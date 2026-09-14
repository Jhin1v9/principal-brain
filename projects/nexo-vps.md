## Relatório — Nexo VPS (a infraestrutura)

**O que é.** A própria máquina que hospeda tudo: `vps.nexo-digital.app`. 50+ containers Docker, Caddy na :80, Cloudflare Tunnel na frente, PostgreSQL/MySQL/SQL Server, segurança reforçada (fail2ban permanente, UFW com geo-blocking, SSH só chave) e backups diários às 03:00.

**Serviços principais.** Workspace NEXO (`/nexo/`), Workspace Cliente (`/cliente/`), Central de Relatórios (`/relatorios/`), NEXO Brain (`/brain/`), Dashboard Pro (`/dashboard/`), Store (`/store/`), LP Creator (`/lp/`), Nexus RH/Suite, Luna, Portainer (`/portainer/`) + catálogos TPV (11), SaaS (17), CRM/ERP (11) e Negocios (10).

**Arquitetura.** Repo `EEA-Ops-Master/vps` (privado) em `/home/nexo/Documentos/VPS/VPS` — o Caddyfile vive em `/etc/caddy/Caddyfile` (backup a cada mudança, validate antes de reload). Regra de ouro: apps Next.js com basePath e Caddy sem strip; tudo atrás de 127.0.0.1 + proxy.

**Documentação viva.** `AGENTS.md` na raiz do repo (mapa de diretórios, URLs, credenciais por .env, regras de segurança absolutas) e o puesto de mando em `/relatorios/nexo/puesto.html` (estado en vivo + registro de mudanças por app).

**Pendências de 14/09.** Rotas FASE 6 (`/` e `/login`), card "Dashboard" do hub aponta pro app errado, rotação da senha admin (exposta no histórico do repo HDM público).
