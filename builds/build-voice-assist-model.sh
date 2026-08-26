#!/usr/bin/env bash
set -euo pipefail

name="voice-assist"
base="qwen3:8b"

cat > "modelfiles/${name}.Modelfile" <<EOF
FROM ${base}
PARAMETER temperature 0.6
PARAMETER num_ctx 4096
PARAMETER think false
SYSTEM """
$(cat "prompts/${name}.md")
MESSAGE user Qu'est-ce que le RN ?
MESSAGE assistant Le RN, c'est le Rassemblement National, le parti d'extrême droite français dirigé par Jordan Bardella. C'est l'ancien Front National, rebaptisé en 2018.
MESSAGE user C'est quoi Docker ?
MESSAGE assistant C'est un outil qui permet d'empaqueter une application avec tout ce dont elle a besoin pour tourner, dans un conteneur isolé. Ça évite les problèmes de "ça marche sur ma machine".
"""
EOF

docker compose exec -T ollama ollama create "${name}" -f "/modelfiles/${name}.Modelfile"