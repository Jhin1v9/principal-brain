# Relatório — último ciclo de entregas

_Atualizado automaticamente pelo SYNAPSE em 2026-09-25_

## Entregues

- **2026-09-25 · 0f7c984 · fix(atlas)** — restaura o import de `Sparkles` no `App.tsx` (referência não resolvida derrubava o render inteiro — "tela azul") e reaplica o endpoint `POST /api/synapses/record` em `server.mjs` (+44 linhas): escrita autenticada (Bearer) que cria/appenda fichas em `clients/<slug>.md` com wikilinks de serviço, virando aresta CLIENTE↔serviço no grafo após regenerate. Proteção contra path traversal via `resolve()` contra `REPO_ROOT`.
- **2026-09-14 · c9e0227 · feat(automation)** — `automation/synapse.sh` passa a regenerar o Atlas automaticamente pós-relatório (`node atlas/generate.mjs`, não fatal) e inclui `atlas/data.js` no auto-commit quando presente; comportamento anterior preservado na ausência de `atlas/` ou de node.
- **2026-09-14 · bd2daf9 · fix(automation)** — contrato dos agentes de IA migrado de argumentos `-p` para variáveis de ambiente `SYNAPSE_*`, eliminando a corrupção de caminhos Windows (`C:\...`) pela conversão MSYS do Git Bash; prompts de classificação e relatório atualizados.
- **2026-09-14 · a851ba5 · fix(atlas)** — corrige layout mobile do Atlas (flexbox no `body`, eliminando a "área morta" dos `calc(100% - Npx)`) e estabiliza renderização: default de `deg` nos nós e `ResizeObserver` para redimensionar o canvas por mudança de conteúdo, não só de janela.
- **2026-09-14 · a3742de · feat(automation)** — introduz o SYNAPSE: hook post-commit assíncrono (nohup, nunca bloqueia), orquestrador `synapse.sh` com fallback determinístico, guard de idempotência, lock de concorrência, auto-commit `[synapse]` e instaladores bash/PowerShell; cria esqueleto de `changelog/` e `reports/`.
- **2026-09-14 · 5c8c675 · feat(atlas + skill)** — Atlas v1: painel visual estático (HTML+CSS+JS autocontido, sem servidor) com grafo canvas de física própria, renderizador markdown, filtros, busca e timeline; `generate.mjs` escaneia o vault para `data.js`. Em paralelo, skill `nexo-workflow/SKILL.md` formaliza o contrato operacional do agente.
- **2026-09-14 · 13640bb · feat(atlas)** — Atlas 2.0: reescrita do frontend vanilla para React 18 + TS + Vite + Tailwind 4 (`graph/engine.ts`, views Grafo/Fluxo/Timeline); novos `server.mjs` (Fastify, leituras + escritas autenticadas Bearer) e `mcp-server.mjs` (7 tools MCP, 5 reads / 2 writes). **Breaking:** `atlas/data.js` migra para `atlas/public/data.js` e o app passa a exigir `npm run build`.

## Em andamento

- **Cobertura de testes da API do Atlas**: nenhum endpoint novo (`/api/synapses/record`, rotas de escrita de 13640bb, tools MCP) tem teste registrado no histórico — pendência recorrente nas Recomendações.
- **Validação do Atlas 2.0 em runtime**: o commit 0f7c984 evidencia que código se perdeu em pull/merge e que o app quebrou (tela azul) antes de chegar ao usuário — o uso de `<Sparkles />` no `App.tsx` ainda não foi confirmado no código (o diff trouxe só o import).

## Próximos passos

- Escrever testes para `POST /api/synapses/record`: criação de ficha nova, append em existente, `kind` inválido (400) e tentativa de path traversal no nome do cliente.
- Verificar se o uso de `<Sparkles />` existe em `App.tsx`; se o uso também se perdeu no pull, falta um commit de restauração.
- Documentar o contrato `{ client, body, service?, kind? }` na skill/docs do Atlas para consumidores da API (ex.: automação da Luna).
- Adicionar teste de fumaça mínimo para `server.mjs` (health + search) e para as 5 tools de leitura do MCP.
- Configurar `BRAIN_API_TOKEN` no ambiente do servidor para habilitar as escritas autenticadas.
- Confirmar em execução real que a geração de relatório (agente 2) funciona com o contrato por env vars — é não-fatal e falhas silenciosas passariam despercebidas.
- Validar o Atlas em 2–3 larguras mobile e centralizar o default de `deg` na geração de `data.js` em vez de no cliente.

## Notas técnicas

- **Breaking change ativa (13640bb)**: `atlas/data.js` legado deixou de existir e o painel passou a exigir build; consumidores do formato antigo quebram. A migração ainda não tem teste de fumaça.
- **Novo vetor de I/O sem cobertura**: `POST /api/synapses/record` faz `mkdirSync`/`writeFileSync` no repo (`clients/<slug>.md`). O check `resolve(abs).startsWith(resolve(REPO_ROOT))` mitiga path traversal e o auth exige Bearer, mas a lógica de slugify e a concatenação de conteúdo são novas e não exercidas em produção.
- **Padrão de perda de código em pull/merge**: dois commits (0f7c984, bd2daf9) são restaurações de código perdido em pull — risco de regressão alto no fluxo de trabalho atual; recomenda-se revisão de merge e teste mínimo antes de deploy.
- **Nenhum teste automatizado em todo o histórico recente** — a confiança vem de inspeção de diff, não de suite; testes de fumaça são a maior lacuna técnica do ciclo.
