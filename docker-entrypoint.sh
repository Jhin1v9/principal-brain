#!/bin/sh
# Entrypoint do NEXO Brain: regenera o grafo ANTES de subir o server.
# Garante que dist/data.js reflita o projects/manifest.json montado em
# volume (registros feitos via API sobrevivem a rebuilds de imagem).
set -e
cd /app
node atlas/generate.mjs || echo "generate.mjs falhou no boot — seguindo com o data.js do build" >&2
exec node atlas/server.mjs
