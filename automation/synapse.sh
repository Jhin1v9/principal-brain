#!/usr/bin/env bash
# SYNAPSE — orquestrador pós-commit
# Uso: synapse.sh <hash-do-commit> [caminho-do-json]
#
# Caminho da IA:    kimi -p --agent-file prompts/classify-commit.agent.md
#                   depois prompts/generate-report.agent.md
# Fallback:         shell escreve entrada básica em changelog/entries/ e
#                   atualiza changelog/CHANGELOG.md (determinístico).
set -u

HASH="${1:-}"
[ -n "$HASH" ] || exit 0
SHORT="${HASH:0:7}"
JSON="${2:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT" || exit 0

GIT_DIR_ABS="$(git rev-parse --git-dir 2>/dev/null || echo .git)"
case "$GIT_DIR_ABS" in
  /*) ;;
  *)  GIT_DIR_ABS="$REPO_ROOT/$GIT_DIR_ABS" ;;
esac
LOG="$GIT_DIR_ABS/synapse.log"

log() { printf '%s [synapse] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG"; }

# --- configuração -------------------------------------------------------------
if [ -f "$SCRIPT_DIR/config.env" ]; then
  # shellcheck disable=SC1091
  . "$SCRIPT_DIR/config.env"
fi
: "${SYNAPSE_DISABLE:=0}"
: "${KIMI_BIN:=kimi}"
: "${KIMI_MODEL:=}"
: "${KIMI_TIMEOUT:=0}"
: "${SYNAPSE_ENTRIES_DIR:=changelog/entries}"
: "${SYNAPSE_CHANGELOG:=changelog/CHANGELOG.md}"
: "${SYNAPSE_REPORT:=reports/latest.md}"

ENTRIES_DIR="$REPO_ROOT/$SYNAPSE_ENTRIES_DIR"
CHANGELOG="$REPO_ROOT/$SYNAPSE_CHANGELOG"
mkdir -p "$ENTRIES_DIR" "$(dirname "$CHANGELOG")"

ENTRY_GLOB="$ENTRIES_DIR/*-$SHORT.md"

# --- lock de execução (mkdir atômico; PID dentro; rouba lock morto) ------------
LOCK="$GIT_DIR_ABS/synapse.lock"
acquire_lock() {
  if mkdir "$LOCK" 2>/dev/null; then
    printf '%s' $$ > "$LOCK/pid" 2>/dev/null || true
    return 0
  fi
  OLD_PID="$(cat "$LOCK/pid" 2>/dev/null || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    return 1
  fi
  rm -rf "$LOCK" 2>/dev/null
  mkdir "$LOCK" 2>/dev/null || return 1
  printf '%s' $$ > "$LOCK/pid" 2>/dev/null || true
  return 0
}
release_lock() { rm -rf "$LOCK" 2>/dev/null || true; }
trap release_lock EXIT

acquire_lock || { log "lock ativo por outro processo; abortando ($SHORT)"; exit 0; }

# --- idempotência (corrida contra o hook) --------------------------------------
if ls $ENTRY_GLOB >/dev/null 2>&1; then
  log "entrada já existe para $SHORT; idempotente, nada a fazer"
  exit 0
fi

# --- leitura dos metadados ------------------------------------------------------
if [ -z "$JSON" ] || [ ! -f "$JSON" ]; then
  JSON="$GIT_DIR_ABS/synapse-$SHORT.json"
fi
ASSUNTO=""
DATA_HOJE="$(date '+%Y-%m-%d')"
if [ -f "$JSON" ]; then
  ASSUNTO="$(sed -n 's/.*"assunto": "\(.*\)",*/\1/p' "$JSON" | head -1 | sed 's/\\"/"/g; s/\\\\/\\/g')"
  DATA_COMMIT="$(sed -n 's/.*"data": "\([^T"]*\).*/\1/p' "$JSON" | head -1)"
  [ -n "$DATA_COMMIT" ] && DATA_HOJE="$DATA_COMMIT"
fi
[ -n "$ASSUNTO" ] || ASSUNTO="$(git show -s --format=%s "$HASH" 2>/dev/null || echo 'commit sem assunto')"

ENTRY_FILE="$ENTRIES_DIR/$DATA_HOJE-$SHORT.md"

# ==============================================================================
# FALLBACK determinístico — usado quando a IA está desativada, ausente ou falha
# ==============================================================================
run_fallback() {
  local reason="$1"
  log "fallback ativado ($reason) para $SHORT"

  # classificação heurística pelo prefixo conventional-commit
  local tipo escopo breaking impacto
  tipo="$(printf '%s' "$ASSUNTO" | sed -n 's/^\([a-zA-Z][a-zA-Z]*\)(\([^)]*\))\?\(!\)\?:.*/\1/p' | tr 'A-Z' 'a-z')"
  escopo="$(printf '%s' "$ASSUNTO" | sed -n 's/^[a-zA-Z][a-zA-Z]*(\([^)]*\))\?\(!\)\?:.*/\1/p')"
  [ -n "$tipo" ] || tipo="chore"
  case "$tipo" in
    feat|fix|perf|docs|refactor|test|chore|style) ;;
    *) tipo="chore" ;;
  esac
  if printf '%s' "$ASSUNTO" | grep -q '^[a-zA-Z][a-zA-Z]*(\?[^()]*)\?\!:' \
    || printf '%s' "$ASSUNTO$CORPO_FALLBACK" | grep -qi 'BREAKING'; then
    breaking="sim"
  else
    breaking="nao"
  fi
  case "$tipo" in
    style|docs) impacto="baixo" ;;
    fix)        impacto="alto" ;;
    *)          impacto="medio" ;;
  esac
  [ "$breaking" = "sim" ] && impacto="critico"

  local nota_cliente
  case "$tipo" in
    feat)     nota_cliente="Adicionamos uma melhoria nova ao sistema para facilitar o seu dia a dia." ;;
    fix)      nota_cliente="Corrigimos um problema para que tudo volte a funcionar como esperado." ;;
    perf)     nota_cliente="Deixamos o sistema mais rápido e fluido para você usar." ;;
    docs)     nota_cliente="Atualizamos a documentação interna do projeto." ;;
    refactor) nota_cliente="Reorganizamos partes internas do sistema para garantir mais estabilidade no futuro." ;;
    test)     nota_cliente="Reforçamos a qualidade do sistema com mais verificações automáticas." ;;
    style)    nota_cliente="Ajustamos detalhes visuais internos do sistema." ;;
    *)        nota_cliente="Fizemos ajustes internos de manutenção para manter tudo funcionando bem." ;;
  esac

  cat > "$ENTRY_FILE" <<EOF
---
hash: $HASH
data: $DATA_HOJE
autor: fallback-automatico
tipo: $tipo
escopo: ${escopo:-desconhecido}
impacto: $impacto
breaking: $breaking
risco_regressao: medio (classificação automática por fallback — IA indisponível, sem análise de diff)
arquivos: ver diff em git show $SHORT
---

## Resumo técnico

Commit \`$ASSUNTO\`. Entrada gerada pelo fallback determinístico do SYNAPSE
(classificação por prefixo conventional-commit, sem leitura de diff). Motivo do
fallback: $reason.

## Análise

Sem análise — a classificação por IA estava indisponível ($reason). O tipo
\`$tipo\` foi inferido apenas do prefixo da mensagem do commit. Reclassifique
manualmente se necessário.

## Nota para o cliente

$nota_cliente

## Recomendações

- Reprocessar este commit com a IA ativa para obter análise completa (\`bash automation/synapse.sh $HASH\`).
EOF

  prepend_changelog "- **$DATA_HOJE · \`$SHORT\` · $tipo** — $ASSUNTO ([análise]($(basename "$SYNAPSE_ENTRIES_DIR")/$(basename "$ENTRY_FILE"))) ⚠️ _fallback_"
  log "fallback concluído: $ENTRY_FILE"
}

CORPO_FALLBACK=""
if [ -f "$JSON" ]; then
  CORPO_FALLBACK="$(sed -n 's/.*"corpo": "\(.*\)",*/\1/p' "$JSON" | head -1)"
fi

prepend_changelog() {
  local line="$1" tmp
  if [ ! -f "$CHANGELOG" ]; then
    printf '# Changelog — SYNAPSE\n\n' > "$CHANGELOG"
  fi
  tmp="$(mktemp)"
  { printf '%s\n\n' "$line"; cat "$CHANGELOG"; } > "$tmp" && mv "$tmp" "$CHANGELOG"
}

# --- auto-commit dos artefatos (loop seguro: mensagem com [synapse] é ignorada
# pelo hook) -------------------------------------------------------------------
auto_commit_artifacts() {
  [ "${SYNAPSE_AUTO_COMMIT:-1}" = "1" ] || return 0
  local paths=("$SYNAPSE_ENTRIES_DIR" "$SYNAPSE_CHANGELOG" "$SYNAPSE_REPORT")
  [ -f "$REPO_ROOT/atlas/public/data.js" ] && paths+=("atlas/public/data.js")
  if [ -n "$(git -C "$REPO_ROOT" status --porcelain -- "${paths[@]}" 2>/dev/null)" ]; then
    git -C "$REPO_ROOT" add -- "${paths[@]}" >/dev/null 2>&1
    if git -C "$REPO_ROOT" commit -m "chore(synapse): registro do commit $SHORT [synapse]" >/dev/null 2>&1; then
      log "artefatos do $SHORT commitados automaticamente"
    else
      log "atenção: artefatos do $SHORT ficaram não commitados (falha no auto-commit)"
    fi
  fi
}

# ==============================================================================
# Caminho principal: IA (Kimi Code CLI)
# ==============================================================================
if [ "$SYNAPSE_DISABLE" = "1" ]; then
  run_fallback "SYNAPSE_DISABLE=1"
  auto_commit_artifacts
  exit 0
fi

if ! command -v "$KIMI_BIN" >/dev/null 2>&1; then
  run_fallback "binário '$KIMI_BIN' não encontrado no PATH"
  auto_commit_artifacts
  exit 0
fi

# --- agente 1: classificação + entrada + CHANGELOG ----------------------------
MODEL_ARGS=()
if [ -n "$KIMI_MODEL" ]; then
  MODEL_ARGS=(--model "$KIMI_MODEL")
fi

RUN=()
if [ "$KIMI_TIMEOUT" != "0" ] && command -v timeout >/dev/null 2>&1; then
  RUN=(timeout "$KIMI_TIMEOUT")
fi

log "IA: classificando $SHORT com $KIMI_BIN"
# Contrato via variáveis de ambiente: o Git Bash corrompe caminhos Windows
# (C:\...) passados como argumento (conversão MSYS), env vars passam intactas.
export SYNAPSE_REPO="$REPO_ROOT" SYNAPSE_COMMIT_JSON="$JSON" SYNAPSE_HASH="$HASH"
"${RUN[@]}" "$KIMI_BIN" "${MODEL_ARGS[@]}" \
  --agent-file "$SCRIPT_DIR/prompts/classify-commit.agent.md" \
  -p "Classifique o commit indicado pelas variáveis SYNAPSE_* e siga seu contrato." >>"$LOG" 2>&1
RC=$?

if [ $RC -ne 0 ] || ! ls $ENTRY_GLOB >/dev/null 2>&1; then
  run_fallback "kimi retornou rc=$RC ou não criou a entrada"
  auto_commit_artifacts
  exit 0
fi
log "IA: entrada criada para $SHORT"

# --- agente 2: relatório (falha aqui não é fatal) -----------------------------
log "IA: atualizando relatório para $SHORT"
export SYNAPSE_ENTRIES_ABS="$REPO_ROOT/$SYNAPSE_ENTRIES_DIR" SYNAPSE_REPORT_ABS="$REPO_ROOT/$SYNAPSE_REPORT"
"${RUN[@]}" "$KIMI_BIN" "${MODEL_ARGS[@]}" \
  --agent-file "$SCRIPT_DIR/prompts/generate-report.agent.md" \
  -p "Atualize o relatório conforme seu contrato (variáveis SYNAPSE_*)." >>"$LOG" 2>&1
RC=$?
if [ $RC -ne 0 ]; then
  log "IA: relatório falhou (rc=$RC) — entrada e changelog já gravados, seguindo"
else
  log "IA: relatório atualizado para $SHORT"
fi

# --- regenera o Atlas, se o repo tiver um (mantém o grafo vivo) ----------------
if [ -f "$REPO_ROOT/atlas/generate.mjs" ] && command -v node >/dev/null 2>&1; then
  if (cd "$REPO_ROOT" && node atlas/generate.mjs >>"$LOG" 2>&1); then
    log "atlas regenerado"
  else
    log "atenção: regeneração do atlas falhou (não fatal)"
  fi
fi

auto_commit_artifacts
exit 0
