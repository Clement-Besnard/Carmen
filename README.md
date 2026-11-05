# llm-stack

A personal homelab stack for running open-source LLMs locally, and — eventually — giving
them a voice through a TTS layer.

## Why this repo exists

Two goals, in order:

1. **Get hands-on with open-weight models.** Run them on my own GPU, tune their system
   prompts, watch what quantization and context size actually cost in VRAM, and compare
   sizes (an 8B against a 27B) on real tasks instead of benchmarks.
2. **Make them talk.** The end state is a spoken assistant: speech in, an open-weight
   model in the middle, and a TTS layer producing the answer out loud — the whole loop
   running on local hardware, nothing leaving the machine.

Everything here is self-hosted on a single Ubuntu box with an RTX 3090.

## What's in the box

| Piece | What it does |
| --- | --- |
| `docker-compose.yml` | [Ollama](https://ollama.com) (GPU-backed, bound to localhost) + [Open WebUI](https://github.com/open-webui/open-webui) as the chat front-end on port 3000 |
| `prompts/` | System prompts in Markdown — the editable source of truth for each custom model |
| `modelfiles/` | Generated Ollama Modelfiles (base model, parameters, system prompt) |
| `builds/` | Shell scripts that render a Modelfile from its prompt and run `ollama create` |
| `dashboard/` | A small FastAPI + React admin panel over the Ollama API |
| `langflow-bridge/` | Small OpenAI-compatible proxy that exposes Langflow flows as models in Open WebUI |
| `searxng/` | SearXNG config — the metasearch engine that gives the models web access |
| `app.py` | Minimal Python client, the "does it answer at all" smoke test |
| `clement_sample_1.wav` | Voice sample kept for the upcoming TTS / voice-cloning work |

### Custom models

Two are defined today, both built on Qwen3:

- **`clem-assist`** — `qwen3.6:27b`, 64K context. A technical assistant tuned for concise,
  command-first answers with homelab context baked into the system prompt.
- **`voice-assist`** — `qwen3:8b`, 4K context. Short spoken-style replies, no lists, no
  Markdown. Deliberately small and terse: it's the model meant to sit in front of the TTS
  layer, where latency matters and Markdown is noise.

The pattern is that a prompt lives in `prompts/<name>.md`, the build script wraps it into
`modelfiles/<name>.Modelfile`, and Ollama creates the model from that. Editing the prompt
and re-running the script is the whole iteration loop.

### Web search

[SearXNG](https://docs.searxng.org/) runs on port 8081 (8080 is taken by the dashboard)
and is what gives the models access to the internet. It's a metasearch engine: it forwards
the query to Google, Bing, DuckDuckGo and friends, and aggregates the results. No API key
to manage, and no account-bound requests leaving the box.

Two settings in `searxng/settings.yml` matter more than the rest:

- `search.formats` must include `json`. It's HTML-only by default, and Open WebUI fails
  quietly against an instance that only speaks HTML.
- `server.limiter` is off. The anti-bot limiter rejects non-browser callers, which is
  exactly what Open WebUI and Langflow are.

Open WebUI queries it at `http://searxng:8080/search?q=<query>`. Web search is off per
message by default — turn it on with the toggle in the chat's **+** menu, or enable it per
model. Results go through the usual embedding-and-retrieval step; setting
`web.search.bypass_embedding_and_retrieval` injects raw page content instead, which is
faster but eats context.

The secret key lives in `.env` as `SEARXNG_SECRET`, outside git.

### Langflow

[Langflow](https://www.langflow.org/) runs on port 7860 for building agents visually.
It's set to `LANGFLOW_AUTO_LOGIN=true`, so there's no login screen and no API key: like
the dashboard, it's only bound to `127.0.0.1` and the VPN address.

Open WebUI only speaks Ollama or OpenAI, and Langflow exposes neither — it only has
`/api/v1/run/{flow}`. `langflow-bridge/` closes that gap: it lists Langflow's flows on
`/v1/models` and translates `/v1/chat/completions` into a flow run. Every flow you build
shows up as a model in Open WebUI, prefixed `langflow.`, with no extra step — the model
list is fetched live, so a new flow appears as soon as you save it.

In an Ollama component, point *Base URL* at `http://ollama:11434` — the compose service
name, not the host's VPN address, which nothing listens on from inside the container. The
same URL is exposed as the `OLLAMA_BASE_URL` global variable. Langflow's SSRF protection
blocks private IPs by default, so `LANGFLOW_SSRF_ALLOWED_HOSTS` in the compose file
allowlists the stack's own containers.

Two details worth knowing:

- A flow's model id is its endpoint name, or its slugified name if it has none.
- The OpenAI chat id is passed through as Langflow's `session_id`, so memory components
  keep their history per conversation.

### Dashboard

`dashboard/` is a FastAPI backend with a React (Vite) front-end that sits on top of the
Ollama API and covers what the CLI makes tedious:

- list every model, with size, quantization, family, and whether it's currently resident
  in VRAM;
- load a model and pin it (`keep_alive: -1`) or unload it to free VRAM immediately
  (`keep_alive: 0`);
- edit a custom model's system prompt in the browser, write it back to `prompts/` and
  `modelfiles/`, then rebuild the model in place — reloading it afterwards if it was
  already in VRAM, so the new prompt actually takes effect.

The Vite build outputs into `dashboard/backend/static/`, so in production FastAPI serves
both the API and the front-end from a single process.

> **Status:** the React app is incomplete — `src/main.jsx` imports `App.jsx` and
> `styles.css`, which aren't in the repo yet. The backend API works standalone.

## Getting started

Bring up Ollama and Open WebUI (requires Docker with the NVIDIA container runtime):

```bash
docker volume create open-webui # Persistent volume for Open WebUI
docker compose up -d
```

Pull a base model and build a custom one:

```bash
docker compose exec ollama ollama pull qwen3:8b
./builds/build-voice-assist-model.sh
```

Open WebUI is then on <http://localhost:3000>, Langflow on
<http://localhost:7860>, SearXNG on <http://localhost:8081>, and the Ollama API on
`127.0.0.1:11434`.

Open WebUI stores its connections in its own database, so `OPENAI_API_BASE_URLS` in the
compose file only applies to a fresh install. On an existing one, add the bridge by hand
under *Admin → Settings → Connections*: URL `http://langflow-bridge:7861/v1`, any key.

Run the dashboard backend:

```bash
pip install -r dashboard/backend/requirements.txt
uvicorn dashboard.backend.main:app --port 8080
```

And the front-end in dev mode (it proxies `/api` to port 8080):

```bash
cd dashboard/frontend && npm install && npm run dev
```

### Configuration

The backend reads a few environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Where to reach Ollama |
| `STACK_DIR` | repo root | Where `prompts/` and `modelfiles/` live |
| `GPU_TOTAL_VRAM_GB` | `24` | Total VRAM, for the usage gauge (can't be read from inside a container) |

## Roadmap

- [ ] Finish the dashboard front-end (`App.jsx`, `styles.css`)
- [ ] Add a TTS layer and wire `voice-assist` into it
- [ ] Speech-to-text on the way in, for a full voice loop
- [ ] Voice cloning from `clement_sample_1.wav`
- [ ] Measure end-to-end latency and see how small a model the loop can tolerate

## Notes

Ollama, the dashboard, and Langflow are bound to `127.0.0.1` on purpose — the host is reachable over OpenVPN, and the
API has no auth of its own — same for Langflow, which runs with auto-login. Open WebUI
is the only service on the LAN, and it keeps `WEBUI_AUTH=true` for that reason.
