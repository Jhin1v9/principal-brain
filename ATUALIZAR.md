# ATUALIZAR.md — NEXO Brain (deploy VPS)

Deploy em: https://vps.nexo-digital.app/brain/ (Cloudflare → Caddy :80 → `127.0.0.1:4321` → container `nexo-brain`)

## O que é este diretório

Clone de trabalho do deploy. `/opt` é root-only, então a criação inicial foi feita via container docker (`alpine` com volume em `/opt`). Todo o resto roda como `nexo`.

- **Código**: `/opt/nexo-brain` (clone de https://github.com/Jhin1v9/principal-brain, branch main)
- **Dados persistentes** (writes da API): `/opt/nexo-brain-data/learning` e `/opt/nexo-brain-data/memory` (volumes rw no compose — seed inicial veio do repo)
- **Token de escrita**: `/opt/nexo-brain/.env` (`BRAIN_API_TOKEN`, chmod 600, NUNCA commitar)
- **Caddy**: rota no `/etc/caddy/Caddyfile` — `redir /brain /brain/ 308` + `handle /brain/*` com `uri strip_prefix /brain`

## Como atualizar

```bash
cd /opt/nexo-brain
git pull
docker compose build
docker compose up -d
docker logs nexo-brain --tail 10
curl -s http://127.0.0.1:4321/api/health
```

Health esperado: `{"ok":true,"nodes":...,"edges":...}`

## Commits locais (não enviados pro GitHub)

O clone tem 3 commits locais de deploy que NÃO existem na main do GitHub
(se um dia quiser subir, abrir branch `feat/docker` — nunca dar push direto na main):

1. `deploy:` `atlas/index.html` carrega `./data.js` (path relativo) — sem isso o front quebra sob `/brain/`
2. `deploy:` `atlas/server.mjs` aceita `HOST` via env (o compose define `0.0.0.0`; no host a porta segue `127.0.0.1:4321`)
3. `deploy:` Dockerfile multi-stage com `npm ci --omit=dev` na imagem final (runtime precisa do fastify)

`git pull` funciona normalmente porque esses commits estão commitados localmente.

## API (resumo)

- Reads abertos (CORS `*`): `/api/health`, `/api/graph`, `/api/nodes/:id`, `/api/search?q=`, `/api/clusters`, `/api/timeline`, `/api/synapse/status`
- Writes exigem `Authorization: Bearer $BRAIN_API_TOKEN`: `POST /api/learning/outcomes`, `POST /api/memory/notes`, `POST /api/regenerate`
- Front: hash routing (`/brain/#/graph`, `#/fluxo`, `#/timeline`) — tudo servido pelo mesmo index.html

## Auto-sync (agente)

Um cron do usuário `nexo` (a cada 5 min, `/opt/nexo-brain/auto-sync.sh`) vigia a
`main` do GitHub: quando aparece commit novo, faz `git rebase` (reaplicando os
commits locais de deploy), rebuilda a imagem, sobe o container, espera o
health e registra o sync na memória do próprio Brain (`/api/memory/notes`).
Conflito de rebase ou falha de build → aborta sem tocar no serviço e alerta
no grupo do Telegram. Estado em `/opt/nexo-brain-data/.last-synced`, log em
`/opt/nexo-brain-data/auto-sync.log`.

Ou seja: para atualizar o Brain em qualquer lugar, basta dar push na `main`
do GitHub — a VPS percebe sozinha em até 5 minutos.

## Projetos no grafo (cluster "Projetos")

Qualquer projeto vira uma **bolinha no grafo** com relatório próprio. Contrato:

- **Brain central (VPS):** editar `projects/manifest.json` (array) + criar `projects/<id>.md`
  com o relatório. `generate.mjs` transforma cada entrada em um nó `projeto/<id>` no
  cluster "Projetos", conectado a um hub por grupo (`grupo/<grupo>`). Relatório curto
  pode ficar no campo `relatorio` do próprio manifest; sidecar `<id>.md` vence.
- **Qualquer repo com o Brain instalado:** criar `.brain/project.json`
  (`{id, nome, cliente?, status, stack, atividade?, repo?, url?, grupo?, resumo, relatorio?}`)
  + opcional `.brain/relatorio.md` → o grafo daquela instância ganha a bolinha sozinho
  no próximo `generate.mjs`.

A visão "Projetos" (aba) e o grafo leem a MESMA fonte (`projects/manifest.json`).
Clicar num projeto (lista ou bolinha) abre o painel com o relatório em markdown.

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| `Recv failure` / connection reset | app ouvindo só em 127.0.0.1 dentro do container | compose já define `HOST=0.0.0.0` |
| 404 em `/brain/data.js` ou tela preta | build sem `generate.mjs` ou `data.js` com path absoluto | rebuild (Dockerfile já roda generate.mjs) |
| 503 em writes | `BRAIN_API_TOKEN` ausente no `.env` | recriar `.env` + `docker compose up -d` |
| 403 em qualquer rota nova do Caddy | catch-all `respond 403` no fim do bloco `:80` | confirmar que o `handle` da rota vem antes e `caddy validate` passa |

## Verificações pós-deploy

```bash
B=https://vps.nexo-digital.app/brain
curl -s $B/api/health
curl -sI $B/ | head -1          # 200
curl -s $B/data.js | grep -m1 window.ATLAS_DATA
curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/api/regenerate   # 401
curl -s --path-as-is -o /dev/null -w "%{http_code}\n" "$B/api/nodes/..%2f..%2fetc%2fpasswd"  # 404/400
```
