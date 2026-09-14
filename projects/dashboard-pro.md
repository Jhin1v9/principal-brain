## Relatório — Dashboard Pro

**O que é.** Painel de métricas/operação da Nexo, servido em `/dashboard/` (SPA) com API própria em `/dashboard/api/*` (backend na porta 3500, strip do prefixo só na API).

**Arquitetura.** Backend `nexo_dashboard_backend` (127.0.0.1:3500) + frontend `nexo_dashboard_frontend` (127.0.0.1:13510). Login com usuário `abner` + senha admin (ver .env). Backup completo do código em `Jhin1v9/nexo-digital`.

**Pendente conhecido.** O card "Dashboard" do portal (`/`) aponta pro app errado — repoint pra `/nexo/` exige rebuild do workspace-portal (na lista de pendentes de 14/09).
