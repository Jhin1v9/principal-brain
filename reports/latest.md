# Relatório — último ciclo de entregas

_Atualizado automaticamente pelo SYNAPSE em 2026-09-14_

## Entregues

- **2026-09-14 · a851ba5 · fix(atlas)** — Layout mobile do Atlas refeito em flexbox (body column, `main` com `flex: 1; min-height: 0`), eliminando a área morta causada pelos `calc()` de altura; `deg` com default `0` na leitura dos nodes e `ResizeObserver` no body acionando re-render do canvas.
- **2026-09-14 · c9e0227 · feat(automation)** — `synapse.sh` passa a regenerar o Atlas pós-commit (`node atlas/generate.mjs`, condicional e não fatal) e inclui `atlas/data.js` no auto-commit de artefatos quando existente.
- **2026-09-14 · 5c8c675 · feat(atlas + skill)** — Introdução do Atlas: painel estático autocontido com grafo canvas (física própria, filtros, busca, pan/zoom/pinch), renderizador markdown, fluxo SYNAPSE e timeline; `generate.mjs` emite `data.js` a partir do vault; nova skill `nexo-workflow` formaliza o contrato operacional do agente.
- **2026-09-14 · bd2daf9 · fix(automation)** — Contrato por env vars: `synapse.sh` exporta `SYNAPSE_REPO`, `SYNAPSE_COMMIT_JSON`, `SYNAPSE_HASH`, `SYNAPSE_ENTRIES_ABS` e `SYNAPSE_REPORT_ABS` em vez de concatenar caminhos Windows no `-p` do agente, eliminando a corrupção de paths pela conversão MSYS do Git Bash; prompts atualizados.
- **2026-09-14 · a3742de · feat(automation)** — Criação do SYNAPSE: hook post-commit assíncrono, orquestrador `synapse.sh` com fallback determinístico, guard de idempotência, lock de concorrência, instaladores bash/PowerShell e esqueleto de changelog e relatórios.

## Em andamento

- Refinamento contínuo do Atlas em mobile: validação manual de 2–3 larguras de tela pendente para confirmar ausência de dependentes do `height` removido do media query antigo (a851ba5).
- Validação em execução real do agente de relatório (agente 2) sob o novo contrato por env vars, pois ele é não-fatal e falhas silenciosas podem passar despercebidas (bd2daf9).

## Próximos passos

- Verificar manualmente o Atlas em 2–3 larguras de tela mobile (a851ba5).
- Centralizar o default de `deg` na geração de `ATLAS_DATA` (`atlas/generate.mjs`) em vez de no cliente, removendo a dupla defesa `deg || 0` (a851ba5).
- Adicionar log com tempo de execução da regeneração do Atlas para detectar commits lentos conforme o grafo cresce; avaliar regeneração incremental se o Atlas escalar (c9e0227).
- Referenciar o Atlas como fonte visual de navegação no `AGENTS.md` do brain (5c8c675).
- Validar no início de `synapse.sh` a presença das env vars esperadas no ambiente do agente, facilitando diagnóstico (bd2daf9).

## Notas técnicas

- Nenhuma breaking change nas entregas do ciclo; riscos de regressão avaliados como baixos em todos os commits.
- Ponto de atenção: `core.hooksPath=automation/hooks` desativa hooks padrão de `.git/hooks` — confirmar que não existiam hooks personalizados prévios antes de instalar em outros repos (a3742de).
- `atlas/data.js` é versionado e depende de regeneração (`node atlas/generate.mjs`) quando o vault muda; risco de grafo desatualizado, não de quebra (5c8c675, mitigado por c9e0227).
- Repo não possui suíte de testes; a confiança nos diffs vem de inspeção, não de validação automatizada.
