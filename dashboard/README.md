# Dashboard llm-stack

Interface web pour piloter Ollama : charger / décharger les modèles en VRAM et
rebuild les modèles custom depuis leur prompt système.

```
dashboard/
├── backend/          FastAPI — proxy Ollama + écriture des Modelfiles
│   ├── main.py
│   ├── requirements.txt
│   └── static/       build Vite (généré, non versionné)
├── frontend/         Vite + React
└── Dockerfile        build multi-stage : node → python
```

## Ce que ça fait

**Charger / décharger.** Le toggle appelle `/api/generate` avec un prompt vide et
`keep_alive: -1` (résident) ou `0` (libéré immédiatement). C'est le seul levier
« on/off » qu'expose Ollama — il n'y a pas de notion de modèle « désactivé ».
Avec `OLLAMA_MAX_LOADED_MODELS=1`, charger un modèle évince automatiquement le
précédent.

**Rebuild.** Le prompt système est édité dans le navigateur, écrit dans
`prompts/<nom>.md`, le `modelfiles/<nom>.Modelfile` est régénéré au même format
que `builds/*.sh`, puis le modèle est recréé via `POST /api/create`
(champs `from`/`system`/`parameters`). Pas de `docker exec`, donc pas besoin
d'exposer le socket Docker au conteneur. Si le modèle était en VRAM, il est
rechargé pour que le nouveau prompt prenne effet.

Le `FROM` et les `PARAMETER` sont lus depuis le Modelfile existant, qui reste la
source de vérité pour la base et les paramètres ; le `.md` l'est pour le prompt.

## Lancer

### Docker (avec le reste de la stack)

Ajouter ce service à `docker-compose.yml` :

```yaml
  dashboard:
    build: ./dashboard
    container_name: llm-dashboard
    restart: unless-stopped
    depends_on:
      - ollama
    volumes:
      # Le dashboard réécrit les prompts et régénère les Modelfiles.
      - ./modelfiles:/stack/modelfiles
      - ./prompts:/stack/prompts
    ports:
      # Pas d'authentification : accessible depuis la loopback et le VPN
      # uniquement, jamais depuis le LAN (192.168.1.0/24).
      - "127.0.0.1:8080:8080"
      - "10.8.0.1:8080:8080"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - STACK_DIR=/stack
      - GPU_TOTAL_VRAM_GB=24
```

```bash
docker compose up -d --build dashboard
```

→ <http://127.0.0.1:8080> depuis le serveur, <http://10.8.0.1:8080> depuis un client VPN.

Le préfixe d'IP devant le port restreint l'interface d'écoute : sans lui, Docker
publie sur `0.0.0.0` et le dashboard devient joignable depuis le LAN.

⚠ Le binding sur `10.8.0.1` exige que `tun0` soit up au démarrage du conteneur.
Si OpenVPN démarre après Docker, le conteneur échoue avec
`cannot assign requested address` ; `restart: unless-stopped` finit par le
rattraper, sinon `docker compose up -d dashboard` une fois le VPN monté.

### Dev

Deux terminaux :

```bash
# backend
cd dashboard/backend
pip install -r requirements.txt
OLLAMA_BASE_URL=http://127.0.0.1:11434 uvicorn main:app --port 8080 --reload
```

```bash
# frontend (proxy /api vers le port 8080)
cd dashboard/frontend
npm install && npm run dev
```

→ <http://localhost:5173>

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | API Ollama |
| `STACK_DIR` | racine du repo | Où trouver `modelfiles/` et `prompts/` |
| `GPU_TOTAL_VRAM_GB` | `24` | Total affiché dans la jauge (non lisible sans accès GPU) |

## API

| Méthode | Route | Effet |
|---|---|---|
| `GET` | `/api/status` | Version d'Ollama |
| `GET` | `/api/models` | Modèles + état VRAM |
| `POST` | `/api/models/load` | `{"model": "..."}` → charge en VRAM |
| `POST` | `/api/models/unload` | `{"model": "..."}` → libère la VRAM |
| `GET` | `/api/custom` | Modèles custom (base, params, prompt) |
| `PUT` | `/api/custom/{nom}` | Écrit le prompt + régénère le Modelfile |
| `POST` | `/api/custom/{nom}/rebuild` | Recrée le modèle dans Ollama |

## Sécurité

Aucune authentification. N'importe qui atteignant le port peut décharger un
modèle ou réécrire un prompt système. Le service n'écoute donc que sur la
loopback et sur `10.8.0.1` : la surface d'exposition est celle du VPN, tout
client connecté a un accès admin complet.

Ne pas remplacer ces bindings par `0.0.0.0` — ça ouvrirait le dashboard à tout
le LAN. Pour élargir au-delà du VPN, mettre un reverse proxy avec auth devant.
