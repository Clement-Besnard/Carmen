# llm-stack

The base layer of my homelab LLM setup: [Ollama](https://ollama.com) serving open-weight
models on a single Ubuntu box with an RTX 3090, and **Nimbus**, the web dashboard that
administers it.

This repo deliberately stops there. Anything that *uses* the models — a chat UI, agents,
web search, a voice loop — lives in its own project and connects to Ollama over a shared
Docker network. The rule is one-way: other projects depend on this one, never the reverse.

## What's in the box

| Piece | What it does |
| --- | --- |
| `docker-compose.yml` | Ollama (GPU-backed) and the dashboard, on the `llm-net` network |
| `prompts/` | System prompts in Markdown — the editable source of truth for each custom model |
| `modelfiles/` | Generated Ollama Modelfiles (base model, parameters, system prompt) |
| `builds/` | Shell scripts that render a Modelfile from its prompt and run `ollama create` |
| `dashboard/` | Nimbus: a FastAPI + React admin panel over the Ollama API |
| `config/` | Optional `services.json`: the apps Nimbus should monitor (none by default) |

### Custom models

Two are defined today, both built on Qwen3:

- **`clem-assist`** — `qwen3.6:27b`, 64K context. A technical assistant tuned for concise,
  command-first answers with homelab context baked into the system prompt.
- **`voice-assist`** — `qwen3:8b`, 4K context. Short spoken-style replies, no lists, no
  Markdown: the model meant to sit in front of a TTS layer, where latency matters.

A prompt lives in `prompts/<name>.md`, the build script wraps it into
`modelfiles/<name>.Modelfile`, and Ollama creates the model from that. Editing the prompt
and re-running the script — or saving and rebuilding from the dashboard — is the whole
iteration loop.

### Dashboard (Nimbus)

`dashboard/` covers what the Ollama CLI makes tedious:

- list every model with its size, quantization and family, and whether it's resident in
  VRAM;
- load a model and pin it (`keep_alive: -1`), or unload it to free VRAM immediately
  (`keep_alive: 0`);
- edit a custom model's system prompt in the browser, write it back to `prompts/` and
  `modelfiles/`, then rebuild the model in place — reloading it if it was in VRAM.

Nimbus doesn't assume anything runs next to Ollama. To monitor an app that uses it, declare
it in `config/services.json` (see `config/services.example.json`); without that file, the
dashboard shows no services section at all.

The Vite build lands in `dashboard/backend/static/` (generated, not versioned), so in
production FastAPI serves the API and the front-end from one process. Details, API and
environment variables are in [`dashboard/README.md`](dashboard/README.md).

## Getting started

Requires Docker with the NVIDIA container runtime.

```bash
docker compose up -d --build
```

Pull a base model and build a custom one:

```bash
docker compose exec ollama ollama pull qwen3:8b
./builds/build-voice-assist-model.sh
```

The Ollama API is then on port `11434` and Nimbus on <http://127.0.0.1:8080> (and
<http://10.8.0.1:8080> over the VPN).

## Connecting another project

This compose names its default network `llm-net`. A consumer project joins it as an
external network and reaches Ollama by service name:

```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    networks:
      - llm-net

networks:
  llm-net:
    external: true
```

The network exists once this stack has been started, so start it first.

## Notes

- **Exposure.** Nimbus has no authentication: it only listens on the loopback and the VPN
  address (`10.8.0.1`), never on the LAN. Ollama's API has no auth either, and is
  currently published on every interface (`11434:11434`). Now that consumers reach it
  over `llm-net`, that port could be narrowed to `127.0.0.1` and the VPN address.
- **Debugging from a VPN client.** A local, unversioned `docker-compose.local.yml` can
  point the dashboard at the server's Ollama (`OLLAMA_BASE_URL=http://10.8.0.1:11434`);
  see the dashboard README.
