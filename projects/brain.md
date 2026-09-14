## Relatório — NEXO Brain (Atlas 2.0)

**O que é.** O "cérebro" da operação Nexo: todos os documentos vivos (personalidades, memória, aprendizado, automação SYNAPSE, changelog, relatórios) indexados num grafo navegável, com busca full-text, clusters, timeline, backlinks e API HTTP. É esta tela.

**Arquitetura.** Repo `Jhin1v9/principal-brain` → clone de deploy em `/opt/nexo-brain` → Dockerfile multi-stage (node:24-alpine: `npm ci` + `generate.mjs` + build Vite single-file) → container `nexo-brain` na 127.0.0.1:4321 → Caddy `/brain/` com strip de prefixo. Dados de escrita persistidos em volumes (`/opt/nexo-brain-data/learning` e `/memory`).

**API.** Leitura aberta (CORS *): `/api/health`, `/api/graph`, `/api/nodes/:id`, `/api/search?q=`, `/api/clusters`, `/api/timeline`, `/api/synapse/status`. Escrita com Bearer token: `POST /api/learning/outcomes`, `POST /api/memory/notes`, `POST /api/regenerate`. Sem token → 401/503; path traversal bloqueado (404).

**Auto-sync.** Cron de 5 min em `/opt/nexo-brain/auto-sync.sh`: commit novo na `main` → pull, rebuild e nota na memória, sozinho.

**Projetos no grafo.** Manifestos em `projects/manifest.json` (+ `projects/<id>.md`) viram bolinhas no cluster "Projetos". Qualquer repo com o Brain instalado ganha a sua com um `.brain/project.json`.

**Docs completas.** `/relatorios/nexo/brain.html` (relatório interno com exemplos curl) e `/opt/nexo-brain/ATUALIZAR.md` (operação).
