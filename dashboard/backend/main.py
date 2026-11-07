"""Dashboard d'administration pour la stack Ollama.

Expose une petite API au-dessus de l'API Ollama :
  - lister les modeles et savoir lesquels sont resident en VRAM
  - charger / decharger un modele (keep_alive -1 / 0)
  - editer le prompt systeme d'un modele custom et le rebuild
"""

import asyncio
import json
import os
import re
import time
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

# En dev, main.py est dans <repo>/dashboard/backend/ : on remonte de trois crans.
# En conteneur il est a /app/, sans arborescence au-dessus, d'ou le fallback :
# STACK_DIR y est fourni par l'environnement.
_stack_dir = os.environ.get("STACK_DIR")
if not _stack_dir:
    _parents = Path(__file__).resolve().parents
    if len(_parents) < 3:
        raise RuntimeError(
            "STACK_DIR doit etre defini : impossible de deduire la racine du "
            f"repo depuis {Path(__file__).resolve()}"
        )
    _stack_dir = _parents[2]

STACK_DIR = Path(_stack_dir)
MODELFILES_DIR = STACK_DIR / "modelfiles"
PROMPTS_DIR = STACK_DIR / "prompts"
STATIC_DIR = Path(__file__).resolve().parent / "static"

# Le total VRAM ne peut pas etre lu depuis un conteneur sans acces GPU.
VRAM_TOTAL_BYTES = int(float(os.environ.get("GPU_TOTAL_VRAM_GB", "24")) * 1024**3)

# Charger un 27b depuis le disque prend largement plus que le defaut d'httpx.
LOAD_TIMEOUT = httpx.Timeout(600.0, connect=5.0)
SHORT_TIMEOUT = httpx.Timeout(30.0, connect=5.0)

app = FastAPI(title="llm-stack dashboard")


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

async def ollama(method: str, path: str, *, timeout=SHORT_TIMEOUT, **kwargs) -> dict:
    """Appelle l'API Ollama et remonte une erreur lisible cote front."""
    async with httpx.AsyncClient(base_url=OLLAMA_BASE_URL, timeout=timeout) as client:
        try:
            response = await client.request(method, path, **kwargs)
        except httpx.RequestError as exc:
            raise HTTPException(503, f"Ollama injoignable sur {OLLAMA_BASE_URL} : {exc}")
    if response.status_code >= 400:
        raise HTTPException(response.status_code, f"Ollama : {response.text.strip()[:400]}")
    return response.json() if response.content else {}


def base_name(model: str) -> str:
    """qwen3:8b -> qwen3, clem-assist:latest -> clem-assist."""
    return model.split(":", 1)[0]


PARAM_RE = re.compile(r"^\s*PARAMETER\s+(\S+)\s+(.*?)\s*$", re.MULTILINE)
FROM_RE = re.compile(r"^\s*FROM\s+(\S+)\s*$", re.MULTILINE)


def parse_modelfile(text: str) -> tuple[str | None, dict[str, str]]:
    """Extrait le FROM et les PARAMETER d'un Modelfile.

    On s'arrete au SYSTEM : le prompt systeme vit dans prompts/<name>.md,
    qui reste la source de verite editable.
    """
    head = text.split("SYSTEM", 1)[0]
    from_match = FROM_RE.search(head)
    parameters = {key: value for key, value in PARAM_RE.findall(head)}
    return (from_match.group(1) if from_match else None), parameters


def render_modelfile(base: str, parameters: dict[str, str], prompt: str) -> str:
    """Reproduit le format genere par builds/*.sh."""
    lines = [f"FROM {base}"]
    lines += [f"PARAMETER {key} {value}" for key, value in parameters.items()]
    lines += ["SYSTEM \"\"\"", prompt.strip(), "\"\"\"", ""]
    return "\n".join(lines)


def typed_parameters(parameters: dict[str, str]) -> dict[str, object]:
    """L'API /api/create attend des nombres, pas des chaines."""
    typed: dict[str, object] = {}
    for key, value in parameters.items():
        try:
            typed[key] = int(value)
        except ValueError:
            try:
                typed[key] = float(value)
            except ValueError:
                typed[key] = value
    return typed


def read_custom(name: str) -> dict:
    modelfile_path = MODELFILES_DIR / f"{name}.Modelfile"
    prompt_path = PROMPTS_DIR / f"{name}.md"
    if not modelfile_path.is_file():
        raise HTTPException(404, f"Aucun Modelfile pour « {name} »")
    base, parameters = parse_modelfile(modelfile_path.read_text(encoding="utf-8"))
    if base is None:
        raise HTTPException(500, f"{modelfile_path.name} n'a pas de directive FROM")
    return {
        "name": name,
        "base": base,
        "parameters": parameters,
        "prompt": prompt_path.read_text(encoding="utf-8") if prompt_path.is_file() else "",
        "prompt_exists": prompt_path.is_file(),
        "modelfile_path": str(modelfile_path.relative_to(STACK_DIR)),
        "prompt_path": str(prompt_path.relative_to(STACK_DIR)),
    }


def custom_names() -> set[str]:
    if not MODELFILES_DIR.is_dir():
        return set()
    return {path.name.removesuffix(".Modelfile") for path in MODELFILES_DIR.glob("*.Modelfile")}


# --------------------------------------------------------------------------
# Modeles : etat et chargement VRAM
# --------------------------------------------------------------------------

class ModelRef(BaseModel):
    model: str = Field(min_length=1)


# Poids d'un modele = blobs cites par les FROM de son Modelfile. Ne depend que
# du digest du modele : on le met en cache pour ne pas rappeler /api/show (dont
# la reponse liste tous les tenseurs) a chaque rafraichissement.
_weights_cache: dict[str, tuple[str, ...]] = {}


async def weights_key(name: str, digest: str) -> tuple[str, ...]:
    if digest not in _weights_cache:
        show = await ollama("POST", "/api/show", json={"model": name})
        blobs = re.findall(r"^FROM\s+\S*(sha256-[0-9a-f]+)", show.get("modelfile", ""), re.M)
        _weights_cache[digest] = tuple(sorted(blobs)) or (digest,)
    return _weights_cache[digest]


def pick_original(group: list[dict]) -> dict:
    """Le modele d'origine d'un groupe qui partage les memes poids.

    1. celui que le parent_model d'un autre membre designe (clem-assist -> qwen3.8:27b) ;
    2. sinon celui dont le parent est sa propre etiquette du registre
       (qwen3.8:27b -> qwen3.8:27b-q4_K_M) ;
    3. sinon le plus ancien.
    """
    names = {m["name"]: m for m in group}
    for m in group:
        parent = m["parent_model"]
        if parent in names and parent != m["name"]:
            return names[parent]
    for m in group:
        if m["parent_model"].startswith(base_name(m["name"]) + ":"):
            return m
    return min(group, key=lambda m: m["modified_at"] or "")


@app.get("/api/models")
async def list_models() -> dict:
    tags = await ollama("GET", "/api/tags")
    running = await ollama("GET", "/api/ps")

    loaded = {entry["name"]: entry for entry in running.get("models", [])}
    customs = custom_names()

    models = []
    for entry in tags.get("models", []):
        name = entry["name"]
        live = loaded.get(name)
        details = entry.get("details") or {}
        models.append({
            "name": name,
            "digest": entry.get("digest", ""),
            "size": entry.get("size", 0),
            "modified_at": entry.get("modified_at"),
            "parameter_size": details.get("parameter_size"),
            "quantization": details.get("quantization_level"),
            "family": details.get("family"),
            "parent_model": (details.get("parent_model") or "").strip(),
            "loaded": live is not None,
            "size_vram": (live or {}).get("size_vram", 0),
            "expires_at": (live or {}).get("expires_at"),
            "is_custom": base_name(name) in customs,
        })

    # Ollama deduplique les blobs : des modeles qui partagent leurs poids ne les
    # stockent qu'une fois. On rattache chaque derive a son modele d'origine et
    # on ne lui compte que ce qu'il ajoute (prompt, parametres : quelques Ko).
    keys = await asyncio.gather(*(weights_key(m["name"], m["digest"]) for m in models))
    groups: dict[tuple[str, ...], list[dict]] = {}
    for model, key in zip(models, keys):
        groups.setdefault(key, []).append(model)

    disk_total = 0
    for group in groups.values():
        original = pick_original(group)
        disk_total += original["size"]
        for m in group:
            if m is original:
                m["base"] = None
                m["disk_size"] = m["size"]
            else:
                m["base"] = original["name"]
                m["disk_size"] = max(0, m["size"] - original["size"])
                disk_total += m["disk_size"]

    for m in models:
        del m["digest"], m["parent_model"]

    models.sort(key=lambda m: (not m["loaded"], m["name"]))
    return {
        "models": models,
        "disk_total": disk_total,
        "vram_used": sum(m["size_vram"] for m in models),
        "vram_total": VRAM_TOTAL_BYTES,
    }


@app.get("/api/status")
async def status() -> dict:
    version = await ollama("GET", "/api/version")
    return {"ollama_url": OLLAMA_BASE_URL, "version": version.get("version")}


@app.post("/api/models/load")
async def load_model(ref: ModelRef) -> dict:
    """Charge le modele en VRAM et l'y maintient (keep_alive = -1).

    Un prompt vide fait un load sans generation : Ollama repond des que
    les poids sont en memoire.
    """
    await ollama(
        "POST", "/api/generate",
        timeout=LOAD_TIMEOUT,
        json={"model": ref.model, "prompt": "", "keep_alive": -1, "stream": False},
    )
    return {"model": ref.model, "loaded": True}


@app.post("/api/models/unload")
async def unload_model(ref: ModelRef) -> dict:
    """Libere la VRAM immediatement (keep_alive = 0)."""
    await ollama(
        "POST", "/api/generate",
        timeout=LOAD_TIMEOUT,
        json={"model": ref.model, "prompt": "", "keep_alive": 0, "stream": False},
    )
    return {"model": ref.model, "loaded": False}


# --------------------------------------------------------------------------
# Modeles custom : edition du prompt et rebuild
# --------------------------------------------------------------------------

class CustomUpdate(BaseModel):
    prompt: str
    base: str | None = None
    parameters: dict[str, str] | None = None


@app.get("/api/custom")
async def list_custom() -> dict:
    return {"models": [read_custom(name) for name in sorted(custom_names())]}


@app.get("/api/custom/{name}")
async def get_custom(name: str) -> dict:
    return read_custom(name)


@app.put("/api/custom/{name}")
async def update_custom(name: str, update: CustomUpdate) -> dict:
    """Ecrit prompts/<name>.md et regenere le Modelfile, sans rebuild."""
    current = read_custom(name)
    base = update.base or current["base"]
    parameters = current["parameters"] if update.parameters is None else update.parameters

    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
    (PROMPTS_DIR / f"{name}.md").write_text(update.prompt.strip() + "\n", encoding="utf-8")
    (MODELFILES_DIR / f"{name}.Modelfile").write_text(
        render_modelfile(base, parameters, update.prompt), encoding="utf-8"
    )
    return read_custom(name)


@app.post("/api/custom/{name}/rebuild")
async def rebuild_custom(name: str) -> dict:
    """Recree le modele dans Ollama a partir du Modelfile courant.

    Passe par /api/create avec from/system/parameters plutot que par
    `docker exec ollama ollama create` : pas besoin du socket Docker.
    """
    custom = read_custom(name)
    if not custom["prompt"].strip():
        raise HTTPException(400, f"Le prompt {custom['prompt_path']} est vide")

    was_loaded = any(
        entry["name"].startswith(f"{name}:")
        for entry in (await ollama("GET", "/api/ps")).get("models", [])
    )

    await ollama(
        "POST", "/api/create",
        timeout=LOAD_TIMEOUT,
        json={
            "model": name,
            "from": custom["base"],
            "system": custom["prompt"].strip(),
            "parameters": typed_parameters(custom["parameters"]),
            "stream": False,
        },
    )

    # Le rebuild remplace les layers : l'instance en VRAM est celle de
    # l'ancienne version, on la recharge pour que le nouveau prompt prenne.
    if was_loaded:
        await ollama(
            "POST", "/api/generate",
            timeout=LOAD_TIMEOUT,
            json={"model": name, "prompt": "", "keep_alive": -1, "stream": False},
        )

    return {"model": name, "rebuilt": True, "reloaded": was_loaded}


# --------------------------------------------------------------------------
# Services declares et configuration (lecture seule)
# --------------------------------------------------------------------------

# Nimbus ne suppose aucun service : il ne surveille que ceux declares dans ce
# fichier, propre a chaque installation. Absent ou vide : aucun service.
SERVICES_FILE = Path(os.environ.get("SERVICES_FILE") or STACK_DIR / "config" / "services.json")

SERVICE_TIMEOUT = httpx.Timeout(3.0, connect=2.0)


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "service"


def read_services() -> list[dict]:
    """Lit et valide SERVICES_FILE. Une erreur de format remonte telle quelle
    au front, avec le chemin du fichier, plutot que d'etre ignoree."""
    if not SERVICES_FILE.is_file():
        return []
    try:
        raw = json.loads(SERVICES_FILE.read_text(encoding="utf-8") or "[]")
    except json.JSONDecodeError as exc:
        raise HTTPException(500, f"{SERVICES_FILE} n'est pas du JSON valide : {exc}")
    if not isinstance(raw, list):
        raise HTTPException(500, f"{SERVICES_FILE} doit contenir une liste de services")

    services, seen = [], set()
    for index, entry in enumerate(raw, 1):
        if not isinstance(entry, dict) or not entry.get("name") or not entry.get("url"):
            raise HTTPException(
                500, f"{SERVICES_FILE}, service n°{index} : « name » et « url » sont requis"
            )
        slug = slugify(entry["name"])
        while slug in seen:
            slug += "-2"
        seen.add(slug)
        services.append({
            "id": slug,
            "name": str(entry["name"]),
            "description": entry.get("description") or None,
            # url : adresse testee par le backend (ex. reseau Docker).
            "url": str(entry["url"]),
            # link : adresse ouverte par le navigateur. Absente : pas de lien.
            "link": entry.get("link") or None,
            # container : nom du conteneur, pour la commande de diagnostic.
            "container": entry.get("container") or None,
        })
    return services


async def probe(client: httpx.AsyncClient, service: dict) -> dict:
    """Un service "repond" s'il renvoie une reponse HTTP, quel que soit le code :
    on teste la joignabilite, pas une route precise."""
    started = time.perf_counter()
    try:
        response = await client.get(service["url"])
    except httpx.RequestError as exc:
        return {**service, "up": False, "latency_ms": None, "error": type(exc).__name__}
    latency = round((time.perf_counter() - started) * 1000)
    return {**service, "up": True, "latency_ms": latency, "status_code": response.status_code}


@app.get("/api/services")
async def list_services() -> dict:
    services = read_services()
    async with httpx.AsyncClient(timeout=SERVICE_TIMEOUT, follow_redirects=False) as client:
        results = await asyncio.gather(*(probe(client, s) for s in services))
    return {"services": list(results)}


@app.get("/api/config")
async def config() -> dict:
    """Configuration en lecture seule. Ne depend pas d'Ollama : le front s'en
    sert au demarrage pour savoir quelles sections afficher."""
    try:
        services, services_error = read_services(), None
    except HTTPException as exc:
        services, services_error = [], exc.detail
    return {
        "ollama_base_url": OLLAMA_BASE_URL,
        "stack_dir": str(STACK_DIR),
        "gpu_total_vram_gb": VRAM_TOTAL_BYTES / 1024**3,
        "services_file": str(SERVICES_FILE),
        "services": [{"id": s["id"], "name": s["name"], "link": s["link"]} for s in services],
        "services_error": services_error,
    }


# --------------------------------------------------------------------------
# Front statique (build Vite), monte en dernier pour ne pas masquer /api
# --------------------------------------------------------------------------

if STATIC_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str) -> FileResponse:
        return FileResponse(STATIC_DIR / "index.html")
