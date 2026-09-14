#!/usr/bin/env bash
# SYNAPSE — instalador (bash: Git Bash no Windows e Linux)
# Uso:
#   bash automation/install.sh            # instala no repo atual
#   bash automation/install.sh /caminho/outro-repo   # instala em outro repo
set -euo pipefail

TARGET="${1:-.}"
cd "$TARGET"

if [ ! -d .git ]; then
  echo "ERRO: '$PWD' não é a raiz de um repositório git (pasta .git não encontrada)." >&2
  exit 1
fi

if [ ! -f automation/hooks/post-commit ] || [ ! -f automation/synapse.sh ]; then
  echo "ERRO: pasta 'automation/' incompleta neste repo." >&2
  echo "      Copie a pasta 'automation/' do principal-brain para cá antes de instalar." >&2
  exit 1
fi

git config core.hooksPath automation/hooks
chmod +x automation/hooks/post-commit automation/synapse.sh 2>/dev/null || true

echo "OK: core.hooksPath = $(git config core.hooksPath)"
echo
echo "SYNAPSE instalado em: $PWD"
echo
echo "Próximos passos:"
echo "  1. (opcional) cp automation/config.env.example automation/config.env"
echo "  2. Faça um commit de teste e observe:"
echo "       changelog/entries/   (entrada do commit)"
echo "       changelog/CHANGELOG.md"
echo "       reports/latest.md"
echo "       .git/synapse.log     (log de debug)"
echo
echo "Para desinstalar:  git config --unset core.hooksPath"
