"""Passerelle OpenAI-compatible devant Langflow.

Open WebUI ne sait parler qu'à des endpoints Ollama ou OpenAI. Langflow, lui,
n'expose que /api/v1/run/{flow}. Ce service traduit l'un vers l'autre : chaque
flow Langflow apparaît comme un "modèle" dans Open WebUI.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import time
from collections.abc import AsyncIterator
from typing import Any

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse

LANGFLOW_URL = os.environ.get("LANGFLOW_URL", "http://langflow:7860").rstrip("/")
LANGFLOW_API_KEY = os.environ.get("LANGFLOW_API_KEY", "")
# Les flows d'exemple livrés avec Langflow pollueraient la liste des modèles.
INCLUDE_EXAMPLES = os.environ.get("INCLUDE_EXAMPLE_FLOWS", "false").lower() == "true"
TIMEOUT = float(os.environ.get("REQUEST_TIMEOUT", "600"))

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("langflow-bridge")

app = FastAPI(title="Langflow ↔ OpenAI bridge")

# slug lisible dans Open WebUI -> uuid du flow Langflow
_slug_to_flow: dict[str, str] = {}


def _headers() -> dict[str, str]:
    return {"x-api-key": LANGFLOW_API_KEY} if LANGFLOW_API_KEY else {}


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "flow"


async def _fetch_flows() -> list[dict[str, Any]]:
    """Liste les flows Langflow, en paginant et en écartant les composants."""
    flows: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=30) as client:
        page = 1
        while True:
            resp = await client.get(
                f"{LANGFLOW_URL}/api/v1/flows/",
                params={
                    "remove_example_flows": str(not INCLUDE_EXAMPLES).lower(),
                    "components_only": "false",
                    "get_all": "false",
                    "header_flows": "true",
                    "page": page,
                    "size": 100,
                },
                headers=_headers(),
            )
            resp.raise_for_status()
            payload = resp.json()
            # Selon la version, l'endpoint renvoie une liste brute ou une page.
            items = payload if isinstance(payload, list) else payload.get("items", [])
            flows.extend(i for i in items if not i.get("is_component"))
            if isinstance(payload, list) or len(items) < 100:
                break
            page += 1
    return flows


async def _refresh_map() -> list[dict[str, str]]:
    """Recalcule le mapping slug -> uuid et renvoie les modèles exposés."""
    models: list[dict[str, str]] = []
    mapping: dict[str, str] = {}
    for flow in await _fetch_flows():
        flow_id = str(flow.get("id"))
        name = flow.get("name") or flow_id
        slug = flow.get("endpoint_name") or _slugify(name)
        if slug in mapping:  # deux flows homonymes : on désambiguïse
            slug = f"{slug}-{flow_id[:8]}"
        mapping[slug] = flow_id
        models.append({"id": slug, "name": name})
    _slug_to_flow.clear()
    _slug_to_flow.update(mapping)
    return models


async def _resolve(model: str) -> str:
    """Traduit un identifiant de modèle Open WebUI en flow Langflow."""
    if model in _slug_to_flow:
        return _slug_to_flow[model]
    await _refresh_map()
    # À défaut, Langflow accepte aussi un uuid ou un endpoint_name direct.
    return _slug_to_flow.get(model, model)


def _extract_text(payload: dict[str, Any]) -> str:
    """Récupère le texte de sortie, quelle que soit la forme du flow."""
    for output in payload.get("outputs", []) or []:
        for inner in output.get("outputs", []) or []:
            results = inner.get("results") or {}
            message = results.get("message") or results.get("text") or {}
            if isinstance(message, dict):
                text = message.get("text") or (message.get("data") or {}).get("text")
                if text:
                    return text
            elif isinstance(message, str) and message:
                return message
            for msg in inner.get("messages", []) or []:
                text = msg.get("message") if isinstance(msg, dict) else None
                if text:
                    return text if isinstance(text, str) else json.dumps(text)
    log.warning("aucun texte extrait de la réponse Langflow: %s", json.dumps(payload)[:500])
    return ""


def _session_id(body: dict[str, Any], messages: list[dict[str, Any]]) -> str:
    """Stabilise la mémoire Langflow sur la durée d'une conversation."""
    for key in ("chat_id", "session_id", "id"):
        value = body.get(key)
        if isinstance(value, str) and value:
            return value
    seed = json.dumps(messages[:1], sort_keys=True) if messages else "empty"
    return hashlib.sha256(seed.encode()).hexdigest()[:32]


def _flatten(messages: list[dict[str, Any]]) -> str:
    """Le dernier message utilisateur, préfixé des consignes système s'il y en a."""
    system = [m for m in messages if m.get("role") == "system"]
    last_user = next(
        (m for m in reversed(messages) if m.get("role") == "user"),
        messages[-1] if messages else {},
    )

    def as_text(content: Any) -> str:
        if isinstance(content, list):  # format multimodal d'Open WebUI
            return "\n".join(p.get("text", "") for p in content if p.get("type") == "text")
        return content if isinstance(content, str) else ""

    body = as_text(last_user.get("content"))
    if system:
        prefix = "\n".join(as_text(m.get("content")) for m in system).strip()
        if prefix:
            return f"{prefix}\n\n{body}"
    return body


@app.get("/health")
async def health() -> dict[str, Any]:
    try:
        return {"status": "ok", "flows": len(await _refresh_map())}
    except Exception as exc:  # noqa: BLE001 - la santé ne doit jamais lever
        return {"status": "degraded", "error": str(exc)}


@app.get("/v1/models")
@app.get("/models")
async def list_models() -> dict[str, Any]:
    try:
        models = await _refresh_map()
    except Exception as exc:  # noqa: BLE001
        log.error("langflow injoignable: %s", exc)
        models = []
    now = int(time.time())
    return {
        "object": "list",
        "data": [
            {
                "id": m["id"],
                "object": "model",
                "created": now,
                "owned_by": "langflow",
                "name": m["name"],
            }
            for m in models
        ],
    }


def _payload(text: str, session: str) -> dict[str, Any]:
    return {
        "input_value": text,
        "input_type": "chat",
        "output_type": "chat",
        "session_id": session,
    }


async def _run_flow(flow: str, text: str, session: str) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            f"{LANGFLOW_URL}/api/v1/run/{flow}",
            params={"stream": "false"},
            json=_payload(text, session),
            headers=_headers(),
        )
    if resp.status_code >= 400:
        raise RuntimeError(f"Langflow {resp.status_code}: {resp.text[:500]}")
    return _extract_text(resp.json())


async def _stream_flow(flow: str, text: str, session: str) -> AsyncIterator[tuple[str, str]]:
    """Relaie le flux Langflow : ("token", morceau) puis ("final", texte complet).

    Langflow répond en NDJSON ; seuls les events "token" et "end" nous intéressent.
    """
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"{LANGFLOW_URL}/api/v1/run/{flow}",
            params={"stream": "true"},
            json=_payload(text, session),
            headers=_headers(),
        ) as resp:
            if resp.status_code >= 400:
                body = (await resp.aread()).decode(errors="replace")
                raise RuntimeError(f"Langflow {resp.status_code}: {body[:500]}")
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                kind = event.get("event")
                data = event.get("data") or {}
                if kind == "token":
                    chunk = data.get("chunk")
                    if chunk:
                        yield "token", chunk
                elif kind == "end":
                    yield "final", _extract_text(data.get("result") or {})


@app.post("/v1/chat/completions")
@app.post("/chat/completions")
async def chat_completions(request: Request) -> Any:
    body = await request.json()
    model = body.get("model", "")
    messages = body.get("messages", []) or []
    flow = await _resolve(model)
    text = _flatten(messages)
    session = _session_id(body, messages)

    created = int(time.time())
    completion_id = f"chatcmpl-{created}"

    if not body.get("stream"):
        try:
            answer = await _run_flow(flow, text, session)
        except Exception as exc:  # noqa: BLE001
            log.error("échec du flow %s: %s", flow, exc)
            return JSONResponse(
                status_code=502,
                content={"error": {"message": str(exc), "type": "langflow_error"}},
            )
        return {
            "id": completion_id,
            "object": "chat.completion",
            "created": created,
            "model": model,
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": answer},
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        }

    def chunk(delta: dict[str, Any], finish: str | None = None) -> str:
        payload = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model,
            "choices": [{"index": 0, "delta": delta, "finish_reason": finish}],
        }
        return f"data: {json.dumps(payload)}\n\n"

    async def sse() -> AsyncIterator[str]:
        yield chunk({"role": "assistant"})
        streamed = False
        try:
            async for kind, value in _stream_flow(flow, text, session):
                if kind == "token":
                    streamed = True
                    yield chunk({"content": value})
                # Certains flows ne streament pas : on rattrape sur le résultat final.
                elif not streamed and value:
                    yield chunk({"content": value})
        except Exception as exc:  # noqa: BLE001 - en-têtes déjà envoyés, on ne peut plus renvoyer un 502
            log.error("échec du flow %s: %s", flow, exc)
            yield chunk({"content": f"\n\n[erreur langflow] {exc}"})
        yield chunk({}, finish="stop")
        yield "data: [DONE]\n\n"

    return StreamingResponse(sse(), media_type="text/event-stream")
