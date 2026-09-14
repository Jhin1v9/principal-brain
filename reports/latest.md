# Relatório — último ciclo de entregas

_Atualizado automaticamente pelo SYNAPSE em 2026-09-14_

## Entregues

- **2026-09-14 · 13640bb · feat(atlas)** — Reescrita completa do Atlas ("Atlas 2.0"): frontend vanilla `app.js` (827 linhas) substituído por React 18 + TS + Vite + Tailwind 4 (framer-motion, lucide, command palette, views Grafo/Fluxo/Timeline; `graph/engine.ts` com 566 linhas). Novos `server.mjs` (Fastify: API de leitura + escritas com Bearer token e defesa de path traversal) e `mcp-server.mjs` (7 tools MCP via stdio). Breaking: `atlas/data.js` migrou para `atlas/public/data.js` e o frontend passa a exigir `npm run build`.
- **2026-09-14 · 5c8c675 · feat(atlas + skill)** — Atlas 1.0: painel estático autocontido (grafo canvas com física própria, renderizador markdown, busca, pan/zoom) + `generate.mjs` (284 linhas) gerando `data.js` versionado a partir do vault; cria a skill operacional `nexo-workflow/SKILL.md`.
- **2026-09-14 · a851ba5 · fix(atlas)** — Correções de layout mobile (flexbox no lugar de `calc()`) e estabilidade: default de `n.deg`, `ResizeObserver` no body, proteção `deg || 0` na busca.
- **2026-09-14 · c9e0227 · feat(automation)** — `synapse.sh` passa a regenerar o Atlas (`node atlas/generate.mjs`) após cada commit quando aplicável (não fatal) e inclui `atlas/data.js` no auto-commit quando presente.
- **2026-09-14 · bd2daf9 · fix(automation)** — Contrato dos agentes migrado de argumentos `-p` (corrompidos pela conversão MSYS do Git Bash) para variáveis de ambiente `SYNAPSE_*`; prompts atualizados.
- **2026-09-14 · a3742de · feat(automation)** — Introdução do SYNAPSE: hook post-commit assíncrono, orquestrador `synapse.sh` com classificação por IA + fallback determinístico, idempotência, lock de concorrência, instaladores bash/PowerShell, esqueleto de changelog e relatório.

## Em andamento

- Validação operacional do Atlas 2.0 (build, três views, API Fastify e tools MCP) — recomendado explicitamente na entrada 13640bb; sem evidência de execução ainda.
- Cobertura de testes: nenhuma das entradas evidencia testes automatizados para os novos servidores (`server.mjs`, `mcp-server.mjs`) nem fumaça para o pipeline SYNAPSE.

## Próximos passos

- Rodar `npm run build` e validar as views Grafo/Fluxo/Timeline antes de apontar usuários ao novo Atlas (13640bb).
- Configurar `BRAIN_API_TOKEN` no ambiente do servidor para habilitar escritas autenticadas (13640bb).
- Adicionar teste mínimo de fumaça para `server.mjs` (health + search) e para as 5 tools de leitura do MCP (13640bb).
- Agendar/confirmar regeneração do grafo do Atlas sempre que o vault mudar — hoje atrelada ao SYNAPSE (5c8c675, c9e0227).
- Verificar manualmente o Atlas em 2–3 larguras mobile e considerar centralizar o default de `deg` na geração em vez do cliente (a851ba5).
- Validar em execução real a geração de relatório com o contrato por env vars (bd2daf9).
- Adicionar log de tempo da regeneração do Atlas e avaliar regeneração incremental conforme o grafo cresce (c9e0227).

## Notas técnicas

- **Breaking change ativo (13640bb):** `atlas/app.js` removido, `atlas/data.js` movido para `atlas/public/data.js`, frontend passa a exigir build. Risco de regressão médio; consumidores do formato legado quebram.
- **Dependência de build:** o Atlas não é mais estático — `dist/` precisa ser gerado com `npm run build`; o SYNAPSE regenera dados (`data.js`) mas não o build, o que pode deixar o `dist/` servido desatualizado.
- **Superfície nova sem testes:** ~6.8k linhas adicionadas (engine de grafo, API, MCP) sem suite automatizada — qualidade só verificável por execução.
- **Impacto do SYNAPSE no fluxo de commits:** `core.hooksPath=automation/hooks` desativa hooks padrão de `.git/hooks` em repos onde for instalado (a3742de).
