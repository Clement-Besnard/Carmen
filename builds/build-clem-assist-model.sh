#!/usr/bin/env bash
set -euo pipefail

name="clem-assist"
base="qwen3.6:27b"

cat > "modelfiles/${name}.Modelfile" <<EOF
FROM ${base}
PARAMETER temperature 0.6
PARAMETER num_ctx 65536
SYSTEM """
$(cat "prompts/${name}.md")
"""
EOF

docker compose exec -T ollama ollama create "${name}" -f "/modelfiles/${name}.Modelfile"