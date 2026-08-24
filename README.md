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

Open WebUI is then on <http://localhost:3000>, and the Ollama API on
`127.0.0.1:11434`.

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

Ollama is bound to `127.0.0.1` on purpose — the host is reachable over OpenVPN, and the
API has no auth of its own. Open WebUI keeps `WEBUI_AUTH=true` for the same reason.
