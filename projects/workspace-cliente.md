## Relatório — Workspace Cliente

**O que é.** A área dos clientes, em `/cliente/`. Cada cliente entra com o e-mail cadastrado, vê seus projetos, faz solicitações (com wizard guiado pela Luna), acompanha a timeline de entregas, conversa no chat (IA + humano), vota em ideias e consulta a Central de Relatórios do seu projeto.

**Arquitetura.** Next.js com basePath `/cliente`, Auth.js, mesmo PostgreSQL. Container `nexo_workspace_cliente` em 127.0.0.1:13472. Rate limits de login/chat, webhook com HMAC, uploads fora de `public/`.

**Destaques de 14/09/2026.** Calendário mensal visual novo (grade de 7 colunas no desktop, drawer no mobile) sincronizado com a timeline — tudo que a equipe entrega aparece no dia certo; card "Relatórios" na página do projeto abre o relatório daquele cliente com seta de volta; fixes de capitalização e layout mobile.
