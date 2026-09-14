// Projetos NEXO — catálogo vivo com relatórios.
// Alimenta a visão "Projetos" do Atlas. Atualizado em 14/09/2026 (levantamento GitHub + VPS).

export type ProjStatus = 'no-ar' | 'evolucao' | 'standby';

export interface Projeto {
  id: string;
  nome: string;
  cliente?: string;
  status: ProjStatus;
  stack: string;
  atividade: string;
  repo?: string;
  url?: string;
  resumo: string;
  relatorio: string;
}

export interface GrupoProjetos {
  id: string;
  titulo: string;
  icone: 'estrela' | 'nucleo' | 'caixa' | 'loja' | 'ferramenta';
  projetos: Projeto[];
}

export const STATUS_LABEL: Record<ProjStatus, string> = {
  'no-ar': 'No ar',
  evolucao: 'Em evolução',
  standby: 'Standby',
};

export const GRUPOS: GrupoProjetos[] = [
  {
    id: 'clientes',
    titulo: 'Clientes — projetos com nome e cara',
    icone: 'estrela',
    projetos: [
      {
        id: 'hdm-industrial',
        nome: 'HDM Industrial',
        cliente: 'Matheus',
        status: 'no-ar',
        stack: 'Next.js / TypeScript',
        atividade: '14/09/2026',
        repo: 'https://github.com/Jhin1v9/HDM-Industrial',
        url: 'https://hdm-six.vercel.app',
        resumo: 'Site institucional da indústria HDM, no ar pelo Vercel. Cliente ativo do workspace com relatório de acompanhamento.',
        relatorio: `## Relatório — HDM Industrial (Matheus)

**O que é.** Site institucional da HDM Industrial, publicado no Vercel a partir do repo público no GitHub.

**Estado (14/09/2026).** No ar e em evolução. O cliente acompanha tudo pela plataforma: solicitações, timeline com entregas datadas, calendário mensal sincronizado e relatório próprio na Central de Relatórios.

**Infra.** Deploy contínuo Vercel a partir de \`main\` (o build por push voltou a funcionar quando o repo voltou a ser público). Código TypeScript/Next.js.

**Histórico recente.** Em 14/09: docs internos com senhas removidos do repo (cópia local segura na VPS), relatório de acompanhamento entregue na área do cliente, 4 entregas registradas na timeline (rolagem suave, header premium, revisão milestone e página de acompanhamento).

**Atenção.** A senha do admin ficou no histórico do git antes da sanitização — como o repo é público, a troca da senha está pendente (item crítico da lista de pendentes de 14/09).`,
      },
      {
        id: 'jr-reformas',
        nome: 'JR Reformas',
        cliente: 'Juninho',
        status: 'no-ar',
        stack: 'TypeScript',
        atividade: '10/09/2026',
        repo: 'https://github.com/Jhin1v9/Jr-Reformas',
        url: 'https://app-one-indol-65.vercel.app',
        resumo: 'Site do Juninho no ar no Vercel. Cliente do workspace Nexo com relatório próprio.',
        relatorio: `## Relatório — JR Reformas (Juninho)

**O que é.** Site do Juninho (reformas), no ar no Vercel.

**Estado (14/09/2026).** No ar. Cliente cadastrado na plataforma Nexo com página própria na Central de Relatórios (\`/relatorios/clientes/jr/\`), acessível pelo card "Relatórios" dentro do projeto no workspace do cliente.

**Infra.** Repo \`Jhin1v9/Jr-Reformas\` (público) → deploy Vercel em \`app-one-indol-65.vercel.app\`. Última atividade no código: 10/09/2026.`,
      },
      {
        id: 'ona-dance',
        nome: 'Ona Dance',
        cliente: 'Jess',
        status: 'no-ar',
        stack: '—',
        atividade: '11/08/2026',
        repo: 'https://github.com/EEA-Ops-Master/onadance',
        resumo: 'Cliente do workspace (plano básico) — acompanhamento de solicitações, calendário e relatórios pela plataforma.',
        relatorio: `## Relatório — Ona Dance (Jess)

**O que é.** Cliente ativa da Nexo Digital (org "Ona Dance", plano básico, usuária Jess Nunez — \`info@onadance.com\`).

**Estado (14/09/2026).** Ativa na plataforma: entra no workspace do cliente, acompanha solicitações na timeline, vê o calendário mensal e tem acesso à área de relatórios. Repo do projeto em \`EEA-Ops-Master/onadance\` (org privada).`,
      },
      {
        id: 'santafe',
        nome: 'SantaFe Reformas',
        cliente: 'SantaFe Construcciones',
        status: 'standby',
        stack: '—',
        atividade: '01/05/2026',
        repo: 'https://github.com/EEA-Ops-Master/test-santafe',
        resumo: 'Web da SantaFe Construcciones (reformas). Em standby desde maio, aguardando retomada.',
        relatorio: `## Relatório — SantaFe Construcciones

**O que é.** Site da SantaFe Construcciones (reformas/construção), repo \`EEA-Ops-Master/test-santafe\` ("web santafe reformas").

**Estado (14/09/2026).** Standby desde 01/05/2026 — sem atividade há 4 meses. Retomar quando o cliente voltar: revisar design, conteúdo e publicar.`,
      },
    ],
  },
  {
    id: 'nucleo',
    titulo: 'Núcleo Nexo Digital — a plataforma',
    icone: 'nucleo',
    projetos: [
      {
        id: 'brain',
        nome: 'NEXO Brain (Atlas 2.0)',
        status: 'no-ar',
        stack: 'Fastify + React 18 / Vite / Tailwind 4',
        atividade: '14/09/2026',
        repo: 'https://github.com/Jhin1v9/principal-brain',
        url: '/brain/',
        resumo: 'O cérebro da operação: grafo vivo do conhecimento (89 nós / 114 arestas) + API de leitura aberta e escrita com token.',
        relatorio: `## Relatório — NEXO Brain (Atlas 2.0)

**O que é.** O "cérebro" da operação Nexo: todos os documentos vivos (personalidades, memória, aprendizado, automação SYNAPSE, changelog, relatórios) indexados num grafo navegável, com busca full-text, clusters, timeline, backlinks e API HTTP. É esta tela.

**Arquitetura.** Repo \`Jhin1v9/principal-brain\` → clone de deploy em \`/opt/nexo-brain\` → Dockerfile multi-stage (node:24-alpine: \`npm ci\` + \`generate.mjs\` + build Vite single-file) → container \`nexo-brain\` na 127.0.0.1:4321 → Caddy \`/brain/\` com strip de prefixo. Dados de escrita persistidos em volumes (\`/opt/nexo-brain-data/learning\` e \`/memory\`).

**API.** Leitura aberta (CORS *): \`/api/health\`, \`/api/graph\`, \`/api/nodes/:id\`, \`/api/search?q=\`, \`/api/clusters\`, \`/api/timeline\`, \`/api/synapse/status\`. Escrita com Bearer token: \`POST /api/learning/outcomes\`, \`POST /api/memory/notes\`, \`POST /api/regenerate\`. Sem token → 401/503; path traversal bloqueado (404).

**Docs completas.** \`/relatorios/nexo/brain.html\` (relatório interno com exemplos curl) e \`/opt/nexo-brain/ATUALIZAR.md\` (operação).`,
      },
      {
        id: 'workspace-nexo',
        nome: 'Workspace NEXO (Admin)',
        status: 'no-ar',
        stack: 'Next.js / basePath /nexo',
        atividade: '14/09/2026',
        url: '/nexo/',
        resumo: 'O painel da equipe: solicitações, projetos, chat, calendário operacional, revisão de IA e gestão de clientes.',
        relatorio: `## Relatório — Workspace NEXO (Admin)

**O que é.** O painel interno da equipe Nexo Digital, em \`/nexo/\`. É onde o trabalho acontece: solicitações dos clientes com timeline, projetos, chat interno e com clientes (com handoff pra humano), calendário operacional, revisão das conversas da IA, gestão de organizações e créditos.

**Arquitetura.** Next.js com basePath \`/nexo\` (o Caddy mantém o prefixo — nunca stripa), Auth.js com cookie de sessão, PostgreSQL (\`nexo_postgres\`), Prisma. Container \`nexo_workspace_nexo\` em 127.0.0.1:13471. Login da equipe com e-mail Nexo + senha admin.

**Destaques de 14/09/2026.** Eventos do calendário do admin agora espelham automaticamente na timeline da solicitação ativa do projeto (criar/editar/excluir sincroniza tudo); comentários assumem o autor certo via flag de staff; edição de eventos na timeline; grid de solicitações corrigido pra não estourar com descrições longas.`,
      },
      {
        id: 'workspace-cliente',
        nome: 'Workspace Cliente',
        status: 'no-ar',
        stack: 'Next.js / basePath /cliente',
        atividade: '14/09/2026',
        url: '/cliente/',
        resumo: 'A porta de entrada dos clientes: solicitações, timeline, chat com a Luna, calendário mensal visual e Central de Relatórios.',
        relatorio: `## Relatório — Workspace Cliente

**O que é.** A área dos clientes, em \`/cliente/\`. Cada cliente entra com o e-mail cadastrado, vê seus projetos, faz solicitações (com wizard guiado pela Luna), acompanha a timeline de entregas, conversa no chat (IA + humano), vota em ideias e consulta a Central de Relatórios do seu projeto.

**Arquitetura.** Next.js com basePath \`/cliente\`, Auth.js, mesmo PostgreSQL. Container \`nexo_workspace_cliente\` em 127.0.0.1:13472. Rate limits de login/chat, webhook com HMAC, uploads fora de \`public/\`.

**Destaques de 14/09/2026.** Calendário mensal visual novo (grade de 7 colunas no desktop, drawer no mobile) sincronizado com a timeline — tudo que a equipe entrega aparece no dia certo; card "Relatórios" na página do projeto abre o relatório daquele cliente com seta de volta; fixes de capitalização e layout mobile.`,
      },
      {
        id: 'luna',
        nome: 'Luna (IA da casa)',
        status: 'no-ar',
        stack: 'Kernel próprio + DeepSeek API',
        atividade: '14/09/2026',
        resumo: 'A IA que atende os clientes no chat: wizard de solicitações, respostas, handoff humano e revisão pelo admin.',
        relatorio: `## Relatório — Luna (IA da casa)

**O que é.** A assistente de IA da Nexo Digital. Vive no chat do workspace do cliente: tira dúvidas, guia o wizard de novas solicitações, cobra 1 crédito por mensagem (clientes não-staff) e sabe pedir ajuda humana (handoff) quando precisa.

**Arquitetura.** API de chat \`POST /api/chat/ai\` (workspace-cliente) usando DeepSeek (\`deepseek-chat\`). Conversas persistidas em \`AiConversation\`/\`AiMessage\`; o admin revisa e apaga em \`/nexo/es/chat-revision\`. Uploads da IA em \`/data/uploads/chat\`. Rate limit de 20 mensagens/hora por usuário, bloqueio de prompt injection. Repositórios: \`brain-luna\` (base operacional/consciência compartilhada), \`luna-dashboard\` e \`luna-bridge\` (org).

**Operação.** Alertas de nova solicitação e handoff chegam no grupo do Telegram (\`@lunanexobot\`).`,
      },
      {
        id: 'dashboard-pro',
        nome: 'Dashboard Pro',
        status: 'no-ar',
        stack: 'SPA + backend Python',
        atividade: '14/09/2026',
        url: '/dashboard/',
        resumo: 'Painel de métricas e operações com backend próprio (porta 3500) e SPA (13510).',
        relatorio: `## Relatório — Dashboard Pro

**O que é.** Painel de métricas/operacao da Nexo, servido em \`/dashboard/\` (SPA) com API própria em \`/dashboard/api/*\` (backend na porta 3500, strip do prefixo só na API).

**Arquitetura.** Backend \`nexo_dashboard_backend\` (127.0.0.1:3500) + frontend \`nexo_dashboard_frontend\` (127.0.0.1:13510). Login com usuário \`abner\` + senha admin (ver .env). Backup completo do código em \`Jhin1v9/nexo-digital\`.

**Pendente conhecido.** O card "Dashboard" do portal (\`/\`) aponta pro app errado — repoint pra \`/nexo/\` exige rebuild do workspace-portal (na lista de pendentes de 14/09).`,
      },
      {
        id: 'relatorios',
        nome: 'Central de Relatórios',
        status: 'no-ar',
        stack: 'Node puro (zero deps)',
        atividade: '14/09/2026',
        url: '/relatorios/',
        resumo: 'Portal de relatórios com auth própria: home pública estilo jornal, páginas por cliente e área interna da equipe.',
        relatorio: `## Relatório — Central de Relatórios

**O que é.** O portal \`/relatorios/\`: home pública (estilo jornal), páginas individuais por cliente (gate só por e-mail cadastrado) e área interna da equipe com o puesto de mando (estado en vivo de todos os containers + registro de mudanças por app) e relatórios técnicos (segurança, workspaces, Brain, projetos).

**Arquitetura.** Node puro sem dependências (\`relatorios/server.js\`), sessão em cookie HMAC (\`nxrel\`), credenciais da equipe via env (hash sha256). \`data/\` e \`public/\` são volumes — conteúdo novo não exige rebuild; mudança no \`server.js\` exige. Infra de registro reparada em 14/09 (sync que sobrescrevia o catálogo desativado, \`data/cambios\` gravável).

**Como adicionar cliente.** Editar \`relatorios/data/users.json\` + criar \`public/clientes/<slug>/\` — sem rebuild.`,
      },
      {
        id: 'store',
        nome: 'Nexo Digital Store',
        status: 'no-ar',
        stack: 'TypeScript',
        atividade: '06/09/2026',
        repo: 'https://github.com/Jhin1v9/nexo-digital-store',
        url: '/store/',
        resumo: 'A loja digital da Nexo, no ar na VPS em /store/.',
        relatorio: `## Relatório — Nexo Digital Store

**O que é.** A loja digital da Nexo Digital, no ar em \`/store/\` (container \`nexo_digital_store\`, 127.0.0.1:13469). Repo \`Jhin1v9/nexo-digital-store\`, última atividade 06/09/2026.`,
      },
      {
        id: 'lp-creator',
        nome: 'LP Creator',
        status: 'no-ar',
        stack: 'JavaScript',
        atividade: '06/08/2026',
        repo: 'https://github.com/Jhin1v9/nexo-lp-creator',
        url: '/lp/',
        resumo: 'Criador de landing pages v3.0 — preview em /preview/, publicação em /lp/.',
        relatorio: `## Relatório — LP Creator

**O que é.** Criador de landing pages v3.0 da Nexo. Edição/preview em \`/preview/\` e páginas publicadas servidas em \`/lp/\` (container \`nexo_lp_creator\`, 127.0.0.1:3460). Repo \`Jhin1v9/nexo-lp-creator\`. Última atividade 06/08/2026.`,
      },
      {
        id: 'cms',
        nome: 'Nexo CMS',
        status: 'evolucao',
        stack: 'TypeScript',
        atividade: '14/08/2026',
        repo: 'https://github.com/Jhin1v9/Nexo-CMS',
        resumo: 'CMS da Nexo Digital em evolução.',
        relatorio: `## Relatório — Nexo CMS

**O que é.** O CMS da Nexo Digital (repo \`Jhin1v9/Nexo-CMS\`). Em evolução — última atividade 14/08/2026. Sem deploy público dedicado ainda.`,
      },
    ],
  },
  {
    id: 'tpv',
    titulo: 'TPV — pontos de venda (11 apps)',
    icone: 'loja',
    projetos: [
      {
        id: 'tpv-catalogo',
        nome: 'Catálogo TPV (11 sistemas)',
        status: 'no-ar',
        stack: 'Laravel + Vite / MySQL dedicado (:3308)',
        atividade: '14/09/2026',
        resumo: 'Cafetería, Copas, Estética y SPA, Fastfood, Hostelería, Joyería, Minimarket, Panadería, Papelería, Peluquería y Zapatería.',
        relatorio: `## Relatório — Catálogo TPV (relatório genérico, 11 apps)

**O que são.** Onze pontos de venda (TPV) verticalizados, todos Laravel + Vite com subpath próprio em \`/tpv/<nome>/\`: Cafetería, Copas, Estética y SPA, Fastfood, Hostelería, Joyería y Relojería, Minimarket, Panadería, Papelería y Librería, Peluquería y Zapatería.

**Arquitetura.** Cada app é um container \`nexo_tpv_*\` (portas 14050–14060, só localhost) atrás do Caddy com strip de prefixo. Banco MySQL dedicado \`nexo_mysql_tpv\` (127.0.0.1:3308). Build em dois Dockerfiles (\`Dockerfile.laravel\` + \`Dockerfile.laravel-vite\`) com entrypoint próprio e gerador de URL com subpath (\`FixSubpathUrlGenerator\`).

**Segurança (reforço de 10/09/2026).** Credenciais padrão removidas das telas de login (11 apps), 14 seeders passaram a usar \`env('NEXO_SAAS_PASSWORD')\`, containers reconstruídos com código limpo e 11 arquivos "Credenciales del Sistema.txt" apagados do source.

**Estado (14/09/2026).** Os 11 no ar e saudáveis (0 containers unhealthy na VPS). Repositórios na org \`EEA-Ops-Master\`.`,
      },
    ],
  },
  {
    id: 'saas',
    titulo: 'SaaS — 17 sistemas',
    icone: 'caixa',
    projetos: [
      {
        id: 'saas-catalogo',
        nome: 'Catálogo SaaS (17 sistemas)',
        status: 'no-ar',
        stack: 'Laravel / MySQL dedicado (:3309)',
        atividade: '14/09/2026',
        resumo: 'Citas Médicas, Academia, Bótica, Clínica, Colegio, Ferretería, Gimnasio, Hospedaje, Minimarket, Odontología, Restaurante, Taller Automotriz, Taller Textil, Tienda Moda, Ventas e Inventarios, Veterinaria e Préstamos.',
        relatorio: `## Relatório — Catálogo SaaS (relatório genérico, 17 sistemas)

**O que são.** Dezessete sistemas SaaS verticalizados em \`/saas/<nome>/\`: Citas Médicas, Academia, Bótica, Clínica, Colegio, Ferretería, Gimnasio, Hospedaje, Minimarket, Odontología, Restaurante, Taller Automotriz, Taller Textil, Tienda Moda, Ventas e Inventarios, Veterinaria e Préstamos y Cobranza.

**Arquitetura.** Containers \`nexo_saas_*\` (portas 16001–16017) com Caddy por subpath; MySQL dedicado \`nexo_mysql_saas\` (127.0.0.1:3309). Cada app tem Dockerfile próprio gerado no padrão Laravel (+ \`.dockerignore\`).

**Segurança (10/09/2026).** 17 senhas de banco rotacionadas, fail2ban com jail \`web-login-bruteforce\` (5 tentativas em 5 min → 1h de ban) cobrindo SaaS + TPV.

**Estado (14/09/2026).** Todos no ar. Repositórios na org \`EEA-Ops-Master\` (um repo por sistema).`,
      },
    ],
  },
  {
    id: 'crm-erp',
    titulo: 'CRM/ERP + Negocios — 21 sistemas',
    icone: 'caixa',
    projetos: [
      {
        id: 'crm-catalogo',
        nome: 'CRM/ERP (11 sistemas)',
        status: 'no-ar',
        stack: 'Laravel e Node/React / MySQL (:3307)',
        atividade: '14/09/2026',
        resumo: 'Agencia de Viagens, Colegio, Condomínio, Delivery, Odontologia, Tienda Celulares, Tienda Online, Ventas, Educativo, Farmácia e Taller Automotriz.',
        relatorio: `## Relatório — CRM/ERP (relatório genérico, 11 sistemas)

**O que são.** Onze CRM/ERP em rotas próprias: Agencia de Viajes, Colegio, Condominio, Delivery, Odontologia, Tienda Celulares, Tienda Online, Ventas (Node/React + Swagger), ERP Educativo, ERP Farmacia (Laravel + Vue) e ERP Taller Automotriz.

**Arquitetura.** Containers \`nexo_crm_*\`/\`nexo_erp_*\` (portas 14001–14011), MySQL \`nexo_mysql_crm\` (127.0.0.1:3307) e um SQL Server (\`nexo_sqlserver\`) herdado do stack.

**Estado (14/09/2026).** No ar — os healthchecks que reportavam unhealthy em 09/09 estão resolvidos (0 unhealthy hoje).

**Pendente.** CORS aberto em wildcard (*) nos apps Laravel — restringir a \`vps.nexo-digital.app\` (lista de pendentes de 14/09).`,
      },
      {
        id: 'negocios-catalogo',
        nome: 'Negocios (10 sistemas)',
        status: 'no-ar',
        stack: 'Django 5 / .NET 10 Blazor / Node+React — MySQL',
        atividade: '14/09/2026',
        resumo: 'Almacenes, Abogados, Contable, Contabilidad Perú, Municipal, Médico, Asistencia, Encomiendas, Planilla e Servicio Técnico.',
        relatorio: `## Relatório — Negocios (relatório genérico, 10 sistemas)

**O que são.** Dez sistemas de gestão: AlmacénPro, LexDoc (abogados), ContaDoc (contable), Contabilidad Perú, Gestor Municipal, MediCare (consultório), Control de Asistencia (Node + React), EnvíosPro (encomiendas), NegPlanilla (.NET 10 Blazor) e Servicio Técnico.

**Arquitetura.** Containers \`neg_*\` (portas 15001–15010), majoritariamente Django 5 + MySQL; planilla em C#/.NET; asistencia em Node + React 18.

**Estado (14/09/2026).** No ar (0 unhealthy).

**Pendentes (da lista de 14/09).** \`DEBUG=True\` em produção, \`SECRET_KEY\` hardcoded no compose e \`ALLOWED_HOSTS="*"\` — os três devem ir pra \`.env\` quando houver janela de manutenção.`,
      },
    ],
  },
      {
    id: 'ferramentas',
    titulo: 'Ferramentas e produtos em evolução',
    icone: 'ferramenta',
    projetos: [
      {
        id: 'bug-detector',
        nome: 'BugDetector Pro',
        status: 'evolucao',
        stack: 'TypeScript',
        atividade: '19/07/2026',
        repo: 'https://github.com/Jhin1v9/bug-detector-pro',
        resumo: 'Reporte de bugs developer-first com IA.',
        relatorio: `## Relatório — BugDetector Pro

Ferramenta de reporte de bugs com foco em desenvolvedores e IA. Repo \`Jhin1v9/bug-detector-pro\`, em evolução (última atividade 19/07/2026).`,
      },
      {
        id: 'sitepulse',
        nome: 'SitePulse QA',
        status: 'evolucao',
        stack: 'HTML + CLI',
        atividade: '07/05/2026',
        repo: 'https://github.com/Jhin1v9/SitePulse-QA',
        resumo: 'Auditor de sites standalone + CLI.',
        relatorio: `## Relatório — SitePulse QA

Auditor de sites em modo app standalone e CLI. Repo \`Jhin1v9/SitePulse-QA\` (07/05/2026).`,
      },
      {
        id: 'nexo-sound',
        nome: 'Nexo Sound',
        status: 'evolucao',
        stack: 'Electron / HTML',
        atividade: '29/08/2026',
        repo: 'https://github.com/Jhin1v9/Nexo-Sound',
        resumo: 'Painel desktop pra volume além de 100% no Windows via Equalizer APO.',
        relatorio: `## Relatório — Nexo Sound

Painel desktop que aumenta o volume do Windows além de 100% via Equalizer APO. Repo \`Jhin1v9/Nexo-Sound\` (29/08/2026).`,
      },
      {
        id: 'firmardocus',
        nome: 'FirmarDocUS',
        status: 'evolucao',
        stack: 'TypeScript',
        atividade: '10/09/2026',
        repo: 'https://github.com/EEA-Ops-Master/firmardocus',
        resumo: 'Firma de documentos estilo iLovePDF.',
        relatorio: `## Relatório — FirmarDocUS

Ferramenta de firma de documentos estilo iLovePDF (projeto IT). Repo \`EEA-Ops-Master/firmardocus\` (10/09/2026).`,
      },
      {
        id: 'whatsapp-marketing',
        nome: 'WhatsApp Marketing',
        status: 'standby',
        stack: 'TypeScript',
        atividade: '18/03/2026',
        repo: 'https://github.com/Jhin1v9/Whatsapp-Marketing-Project',
        resumo: 'SaaS de campanhas e atendimento no WhatsApp (API oficial) — standby.',
        relatorio: `## Relatório — WhatsApp Marketing

Plataforma SaaS de atendimento e campanhas no WhatsApp com API oficial: bot, inbox multiatendente, segmentação com opt-in, campanhas, templates, CRM de leads e relatórios. Repo \`Jhin1v9/Whatsapp-Marketing-Project\` — standby desde 18/03/2026.`,
      },
    ],
  },
];
