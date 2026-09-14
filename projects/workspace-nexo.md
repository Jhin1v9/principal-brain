## Relatório — Workspace NEXO (Admin)

**O que é.** O painel interno da equipe Nexo Digital, em `/nexo/`. É onde o trabalho acontece: solicitações dos clientes com timeline, projetos, chat interno e com clientes (com handoff pra humano), calendário operacional, revisão das conversas da IA, gestão de organizações e créditos.

**Arquitetura.** Next.js com basePath `/nexo` (o Caddy mantém o prefixo — nunca stripa), Auth.js com cookie de sessão, PostgreSQL (`nexo_postgres`), Prisma. Container `nexo_workspace_nexo` em 127.0.0.1:13471. Login da equipe com e-mail Nexo + senha admin.

**Destaques de 14/09/2026.** Eventos do calendário do admin agora espelham automaticamente na timeline da solicitação ativa do projeto (criar/editar/excluir sincroniza tudo); comentários assumem o autor certo via flag de staff; edição de eventos na timeline; grid de solicitações corrigido pra não estourar com descrições longas.
