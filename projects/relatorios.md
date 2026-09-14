## Relatório — Central de Relatórios

**O que é.** O portal `/relatorios/`: home pública (estilo jornal), páginas individuais por cliente (gate só por e-mail cadastrado) e área interna da equipe com o puesto de mando (estado en vivo de todos os containers + registro de mudanças por app) e relatórios técnicos (segurança, workspaces, Brain, projetos).

**Arquitetura.** Node puro sem dependências (`relatorios/server.js`), sessão em cookie HMAC (`nxrel`), credenciais da equipe via env (hash sha256). `data/` e `public/` são volumes — conteúdo novo não exige rebuild; mudança no `server.js` exige. Infra de registro reparada em 14/09 (sync que sobrescrevia o catálogo desativado, `data/cambios` gravável).

**Como adicionar cliente.** Editar `relatorios/data/users.json` + criar `public/clientes/<slug>/` — sem rebuild.
