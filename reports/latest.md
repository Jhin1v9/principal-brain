# Relatório — último ciclo de entregas

_Atualizado automaticamente pelo SYNAPSE em 2026-09-25_

## Entregues

- **2026-09-25 · 155d347 · fix(atlas)** — torna a aba "Universo" acessível: adiciona `'universo'` ao array `VIEWS` em `App.tsx`, ao union type `View` e ao array `TABS` em `Topbar.tsx` (com ícone `Sparkles`), completando o registro esquecido pelo commit 325fd69 (que só criou a view/rota). Mudança puramente aditiva: 4 inserções / 3 deleções em 2 arquivos.
- **2026-09-25 · 0f7c984 · fix(atlas)** — restaura o import de `Sparkles` em `App.tsx` (referência não resolvida derrubava o render inteiro — "tela azul") e reaplica o endpoint `POST /api/synapses/record` em `server.mjs` (+44 linhas): escrita autenticada (Bearer) que cria/appenda fichas em `clients/<slug>.md` com wikilinks de serviço, virando aresta CLIENTE↔serviço no grafo após regenerate. Proteção contra path traversal via `resolve()` contra `REPO_ROOT`.
- **2026-09-14 · c9e0227 · feat(automation)** — `automation/synapse.sh` passa a regenerar o Atlas automaticamente pós-relatório (`node atlas/generate.mjs`, não fatal) e inclui `atlas/data.js` no auto-commit quando presente; comportamento anterior preservado na ausência de `atlas/` ou de node.
- **2026-09-14 · bd2daf9 · fix(automation)** — contrato dos agentes de IA migrado de argumentos `-p` para variáveis de ambiente `SYNAPSE_*`, eliminando a corrupção de caminhos Windows (`C:\...`) pela conversão MSYS do Git Bash; prompts de classificação e relatório atualizados.
- **2026-09-14 · a851ba5 · fix(atlas)** — corrige layout mobile do Atlas (flexbox no `body`, eliminando a "área morta" dos `calc(100% - Npx)`) e estabiliza renderização: default de `deg` nos nós e `ResizeObserver` para redimensionar o canvas por mudança de conteúdo, não só de janela.
- **2026-09-14 · a3742de · feat(automation)** — introduz o SYNAPSE: hook post-commit assíncrono (nohup, nunca bloqueia), orquestrador `synapse.sh` com fallback determinístico, guard de idempotência, lock de concorrência, auto-commit `[synapse]` e instaladores bash/PowerShell; cria esqueleto de `changelog/` e `reports/`.
- **2026-09-14 · 5c8c675 · feat(atlas + skill)** — Atlas v1: painel visual estático (HTML+CSS+JS autocontido) com grafo canvas de física própria, renderizador markdown, filtros, busca e timeline; `generate.mjs` escaneia o vault para `data.js`. Em paralelo, skill `nexo-workflow/SKILL.md` formaliza o contrato operacional do agente.
- **2026-09-14 · 13640bb · feat(atlas)** — Atlas 2.0: reescrita do frontend vanilla para React 18 + TS + Vite + Tailwind 4 (`graph/engine.ts`, views Grafo/Fluxo/Timeline); novos `server.mjs` (Fastify, leituras + escritas autenticadas Bearer) e `mcp-server.mjs` (7 tools MCP). **Breaking:** `atlas/data.js` migra para `atlas/public/data.js` e o app passa a exigir `npm run build`.

## Em andamento

- **Cobertura de testes da API do Atlas**: nenhum endpoint novo (`/api/synapses/record`, rotas de escrita de 13640bb, tools MCP) tem teste registrado no histórico — pendência recorrente nas Recomendações.
- **Validação da view Universo em runtime**: o commit 155d347 expôs a aba, mas não valida o conteúdo de `UniversoView` (criada em 325fd69) — renderização e funcionamento ainda precisam de verificação manual.

## Próximos passos

- Escrever testes para `POST /api/synapses/record`: criação de ficha nova, append em existente, `kind` inválido (400) e tentativa de path traversal no nome do cliente.
- Adicionar checklist/teste de "nova view = registrar em VIEWS + TABS + tipo View" para evitar recorrência do esquecimento corrigido em 155d347.
- Verificar manualmente se `UniversoView` renderiza corretamente agora que a aba está acessível.
- Documentar o contrato `{ client, body, service?, kind? }` na skill/docs do Atlas e configurar `BRAIN_API_TOKEN` no ambiente do servidor.

## Notas técnicas

- **Padrão de esquecimento de registro**: o bug de 155d347 (view criada mas não listada em VIEWS/TABS/View type) é o segundo do tipo no ciclo (o primeiro foi o import de `Sparkles` perdido) — falta um guard automático ou checklist de cobertura de registro.
- **Novo vetor de I/O sem cobertura**: `POST /api/synapses/record` faz `mkdirSync`/`writeFileSync` no repo (`clients/<slug>.md`). O check `resolve(abs).startsWith(resolve(REPO_ROOT))` mitiga path traversal e o auth exige Bearer, mas slugify e concatenação de conteúdo são novos e não exercidos em produção.
- **Nenhum teste automatizado em todo o histórico recente** — a confiança vem de inspeção de diff, não de suite; testes de fumaça são a maior lacuna técnica do ciclo. Breaking change de 13640bb (`data.js` migrado, build obrigatório) segue sem validação.
