#!/usr/bin/env bash
# NEXO Brain — instalador de projeto
# Transforma qualquer repo git num projeto com Brain: copia o esqueleto
# (.brain/ + skill nexo-workflow), cria .brain/project.json e (opcional)
# registra o projeto no brain central — vira bolinha no grafo em segundos.
#
# Uso:
#   curl -s https://raw.githubusercontent.com/Jhin1v9/principal-brain/main/install.sh | bash
#   curl -s .../install.sh | bash -s -- --nome "HDM Industrial" --cliente Matheus --register
#   ./install.sh --check          # só diagnostica o que falta
#   ./install.sh --yes            # não-interativo (defaults do repo git)
#
# Env: BRAIN_URL (default https://vps.nexo-digital.app/brain)
#      BRAIN_API_TOKEN (obrigatório p/ --register)
#      BRAIN_REF (branch do repo principal-brain, default main)
set -uo pipefail

BRAIN_URL="${BRAIN_URL:-https://vps.nexo-digital.app/brain}"
BRAIN_REF="${BRAIN_REF:-main}"
REPO="https://github.com/Jhin1v9/principal-brain.git"

# ---------- args ----------
ID="" NOME="" CLIENTE="" STATUS="em-desenvolvimento" STACK="" GRUPO="clientes"
RESUMO="" REPO_URL="" URL="" REGISTER="" CHECK=0 ASSUME_YES=0
while [ $# -gt 0 ]; do
  case "$1" in
    --id) ID="$2"; shift 2;;
    --nome) NOME="$2"; shift 2;;
    --cliente) CLIENTE="$2"; shift 2;;
    --status) STATUS="$2"; shift 2;;
    --stack) STACK="$2"; shift 2;;
    --grupo) GRUPO="$2"; shift 2;;
    --resumo) RESUMO="$2"; shift 2;;
    --repo) REPO_URL="$2"; shift 2;;
    --url) URL="$2"; shift 2;;
    --register) REGISTER=1; shift;;
    --no-register) REGISTER=0; shift;;
    --check) CHECK=1; shift;;
    --yes|-y) ASSUME_YES=1; shift;;
    *) echo "Opção desconhecida: $1" >&2; exit 64;;
  esac
done

say()  { printf '%s\n' "$*"; }
ok()   { say "  ok: $*"; }
miss() { say "  falta: $*"; }
have() { command -v "$1" >/dev/null 2>&1; }

# ---------- alvo ----------
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$ROOT" ] && { say "ERRO: rode dentro de um repo git (ou inicialize um: git init)." >&2; exit 1; }
cd "$ROOT"

# defaults derivados do repo git
[ -z "$ID" ] && ID="$(basename "$ROOT" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]\+/-/g; s/^-\|-$//g')"
[ -z "$NOME" ] && NOME="$(basename "$ROOT")"
[ -z "$REPO_URL" ] && REPO_URL="$(git remote get-url origin 2>/dev/null | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//' || true)"

# ---------- fonte do esqueleto (clone local ao script ou sparse clone) ----------
SRC=""
if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
  CAND="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  [ -f "$CAND/.brain/rules/golden-rules.md" ] && SRC="$CAND"
fi
if [ -z "$SRC" ]; then
  have git || { say "ERRO: git é necessário para baixar o esqueleto." >&2; exit 1; }
  TMP="$(mktemp -d)"
  trap 'rm -rf "$TMP"' EXIT
  say "-> baixando esqueleto do brain (branch $BRAIN_REF)..."
  git clone --quiet --depth 1 --filter=blob:none --sparse "$REPO" "$TMP/brain" || { say "ERRO: clone falhou" >&2; exit 1; }
  (cd "$TMP/brain" && git sparse-checkout set .brain .kimi-code) || exit 1
  [ "$BRAIN_REF" != "main" ] && (cd "$TMP/brain" && git fetch --quiet --depth 1 origin "$BRAIN_REF" && git checkout --quiet FETCH_HEAD) || true
  SRC="$TMP/brain"
fi

# ---------- --check ----------
if [ "$CHECK" = 1 ]; then
  say "Diagnóstico do Brain em $ROOT"
  [ -f .brain/project.json ] && ok ".brain/project.json" || miss ".brain/project.json (identidade do projeto)"
  [ -f .brain/rules/golden-rules.md ] && ok ".brain/rules/golden-rules.md" || miss "golden-rules.md"
  [ -d .brain/personalities ] && ok ".brain/personalities/" || miss "personalities/"
  [ -f .kimi-code/skills/nexo-workflow/SKILL.md ] && ok "skill nexo-workflow" || miss "skill nexo-workflow (.kimi-code/skills/)"
  [ -f .brain/relatorio.md ] && ok ".brain/relatorio.md" || miss ".brain/relatorio.md (opcional — relatório pro grafo)"
  say "Registrado no brain central:"
  curl -fsS --max-time 10 "$BRAIN_URL/api/projects/registered" 2>/dev/null \
    | grep -q "\"id\": *\"$ID\"" && ok "projeto/$ID já está no grafo" || miss "projeto/$ID ainda não registrado (rode com --register)"
  exit 0
fi

# ---------- 1. esqueleto (.brain + skill) — nunca sobrescreve o existente ----------
say "-> instalando esqueleto do Brain (sem tocar no que já existe)..."
mkdir -p .brain .kimi-code/skills
cp -rn "$SRC/.brain/." .brain/ 2>/dev/null || true
cp -rn "$SRC/.kimi-code/." .kimi-code/ 2>/dev/null || true
ok ".brain/ (regras, personalidades, BLS, MAMIS)"
ok ".kimi-code/skills/nexo-workflow/ (skill obrigatória das sessões)"

# ---------- 2. identidade do projeto ----------
if [ -f .brain/project.json ] && [ "$ASSUME_YES" = 0 ] && [ -z "$ID$NOME$CLIENTE" ]; then
  say "-> .brain/project.json já existe — mantido. Re-rodando com --register sincroniza o grafo."
else
  if [ "$ASSUME_YES" = 0 ] && [ -t 0 ]; then
    [ -z "$CLIENTE" ] && { printf 'Cliente (ou Enter p/ pular): '; read -r CLIENTE; }
    [ -z "$STACK" ]  && { printf 'Stack (ou Enter): '; read -r STACK; }
    [ -z "$RESUMO" ] && { printf 'Resumo curto (ou Enter): '; read -r RESUMO; }
  fi
  {
    echo "{"
    echo "  \"id\": \"$(echo "$ID" | sed 's/"/\\"/g')\","
    echo "  \"nome\": \"$(echo "$NOME" | sed 's/"/\\"/g')\","
    [ -n "$CLIENTE" ] && echo "  \"cliente\": \"$(echo "$CLIENTE" | sed 's/"/\\"/g')\","
    echo "  \"status\": \"$(echo "$STATUS" | sed 's/"/\\"/g')\","
    [ -n "$STACK" ] && echo "  \"stack\": \"$(echo "$STACK" | sed 's/"/\\"/g')\","
    echo "  \"grupo\": \"$(echo "$GRUPO" | sed 's/"/\\"/g')\","
    [ -n "$REPO_URL" ] && echo "  \"repo\": \"$(echo "$REPO_URL" | sed 's/"/\\"/g')\","
    [ -n "$URL" ] && echo "  \"url\": \"$(echo "$URL" | sed 's/"/\\"/g')\","
    echo "  \"resumo\": \"$(echo "${RESUMO:-Projeto com NEXO Brain instalado.}" | sed 's/"/\\"/g')\""
    echo "}"
  } > .brain/project.json
  ok ".brain/project.json (projeto/$ID)"
fi

# ---------- 3. registro no brain central ----------
if [ -z "$REGISTER" ]; then
  if [ -n "${BRAIN_API_TOKEN:-}" ]; then REGISTER=1; else REGISTER=0; fi
fi
if [ "$REGISTER" = 1 ]; then
  [ -n "${BRAIN_API_TOKEN:-}" ] || { say "ERRO: --register exige BRAIN_API_TOKEN no ambiente." >&2; exit 1; }
  say "-> registrando projeto/$ID no brain central..."
  PAYLOAD="$(pwd)/.brain/.register-payload.json"
  if have python3; then
    python3 - "$PAYLOAD" <<'PY'
import json, sys, pathlib
p = pathlib.Path(".brain/project.json")
data = json.loads(p.read_text(encoding="utf-8"))
rel = pathlib.Path(".brain/relatorio.md")
if rel.exists():
    data["relatorio"] = rel.read_text(encoding="utf-8")
pathlib.Path(sys.argv[1]).write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
PY
  elif have jq; then
    if [ -f .brain/relatorio.md ]; then
      jq -Rn --argjson p "$(cat .brain/project.json)" --rawfile r .brain/relatorio.md '$p + {relatorio: $r}' > "$PAYLOAD"
    else
      cp .brain/project.json "$PAYLOAD"
    fi
  else
    cp .brain/project.json "$PAYLOAD"
    say "  (sem python3/jq: relatório não embutido — o resto do registro funciona)"
  fi
  RESP="$(curl -fsS --max-time 30 -X POST "$BRAIN_URL/api/projects/register" \
    -H "Authorization: Bearer $BRAIN_API_TOKEN" -H 'Content-Type: application/json' \
    --data-binary "@$PAYLOAD" 2>&1)" && rm -f "$PAYLOAD" || { rm -f "$PAYLOAD"; say "ERRO no registro: $RESP" >&2; exit 1; }
  echo "$RESP" | grep -q '"ok": *true' && ok "projeto/$ID agora é uma bolinha no grafo ($BRAIN_URL/#/graph?node=projeto/$ID)" \
    || { say "Resposta inesperada: $RESP" >&2; exit 1; }
fi

# ---------- resumo ----------
say ""
say "Brain instalado em $ROOT"
say "  1. git add .brain .kimi-code && git commit -m \"chore: NEXO Brain instalado\""
[ -f .brain/relatorio.md ] || say "  2. (opcional) crie .brain/relatorio.md — vira o conteúdo do painel do projeto no grafo"
[ "$REGISTER" = 1 ] || say "  3. (opcional) export BRAIN_API_TOKEN=... && ./install.sh --register"
