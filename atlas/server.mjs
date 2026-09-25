#!/usr/bin/env node
// NEXO BRAIN — Atlas API server (Fastify)
// Serve dist/ estático + API de leitura do grafo e escritas autenticadas.
//
//   node atlas/server.mjs        (rode da raiz do repo ou de atlas/)
//
// Reads (CORS *):  /api/health /api/graph /api/nodes/:id /api/search /api/clusters /api/timeline /api/synapse/status /api/projects/registered
// Writes (Bearer): POST /api/learning/outcomes  POST /api/memory/notes  POST /api/regenerate  POST /api/synapses/record
//                  POST /api/projects/register  DELETE /api/projects/:id
// Writes exigem o env BRAIN_API_TOKEN; sem ele configurado → 503, token errado → 401.
//
// POST /api/synapses/record  { client, body, service?, kind? }
//   Registra pedido/comentário de cliente em clients/<slug>.md (cria a ficha se
//   não existir). Cada registro referencia o serviço por wikilink ([[<service>]]),
//   virando aresta CLIENTE↔serviço no grafo após regenerate. kind: pedido (padrão)
//   | comentario | status. Resposta: { ok, path, created }.

import Fastify from 'fastify';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join, normalize, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ATLAS_DIR, REPO_ROOT, loadAtlas, buildGraph, searchAtlas } from './lib/atlas-data.mjs';

const PORT = Number(process.env.PORT || 4321);
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN = process.env.BRAIN_API_TOKEN || null;
const DIST = join(ATLAS_DIR, 'dist');

const app = Fastify({ logger: false });

// CORS aberto para reads
app.addHook('onSend', async (_req, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
});
app.options('/api/*', async (_req, reply) => reply.code(204).send());

function stats() {
  const data = loadAtlas();
  return { data, nodes: data.nodes.length, edges: data.edges.length };
}

/* ------------------------------ reads ------------------------------ */

app.get('/api/health', async () => {
  const { nodes, edges, data } = stats();
  return { ok: true, nodes, edges, generatedAt: data.generatedAt };
});

app.get('/api/graph', async () => stats().data);

// wildcard porque ids de projeto têm barra (projeto/<id>)
app.get('/api/nodes/*', async (req, reply) => {
  const id = req.params['*'];
  const data = loadAtlas();
  const { byId, backlinks } = buildGraph(data);
  const node = byId.get(id);
  if (!node) return reply.code(404).send({ error: `nó não encontrado: ${id}` });

  // path traversal PROIBIDO: resolve dentro da raiz do repo ou 400
  const rel = normalize(String(id)).replace(/^([/\\])+/, '');
  if (rel.startsWith('..') || rel.includes(`..${sep}`) || resolve(REPO_ROOT, rel) !== resolve(join(REPO_ROOT, rel))) {
    return reply.code(400).send({ error: 'caminho inválido' });
  }
  const abs = join(REPO_ROOT, rel);
  if (!resolve(abs).startsWith(resolve(REPO_ROOT))) {
    return reply.code(400).send({ error: 'caminho fora da raiz do repositório' });
  }
  let content = null;
  try { content = readFileSync(abs, 'utf8'); } catch { /* conteúdo embutido no data.js serve como fallback */ }
  return { ...node, content: content ?? node.body ?? '', backlinks: backlinks.get(id) || [] };
});

app.get('/api/search', async (req) => {
  const { q } = req.query;
  return { results: searchAtlas(loadAtlas(), q, 10) };
});

app.get('/api/clusters', async () => {
  const { data } = stats();
  const counts = {};
  for (const n of data.nodes) counts[n.cluster] = (counts[n.cluster] || 0) + 1;
  return Object.entries(counts).map(([cluster, count]) => ({ cluster, count }));
});

app.get('/api/timeline', async () => {
  const { data } = stats();
  return data.nodes
    .filter(n => n.cluster === 'Changelog' && n.tipo)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map(n => ({ id: n.id, title: n.title, date: n.date, tipo: n.tipo, escopo: n.escopo, summary: n.summary }));
});

app.get('/api/synapse/status', async () => {
  const logFile = join(REPO_ROOT, '.git', 'synapse.log');
  let log = [];
  try {
    log = readFileSync(logFile, 'utf8').replace(/\r\n/g, '\n').split('\n').filter(Boolean).slice(-20);
  } catch { /* sem log ainda */ }
  const entriesDir = join(REPO_ROOT, 'changelog', 'entries');
  let entries = 0;
  try { entries = readdirSync(entriesDir).filter(f => f.endsWith('.md')).length; } catch { /* dir pode não existir */ }
  const { data } = stats();
  return { log, changelogEntries: entries, changelogIndexed: data.nodes.filter(n => n.cluster === 'Changelog').length };
});

/* ------------------------------ writes ------------------------------ */

function checkAuth(req, reply) {
  if (!TOKEN) {
    reply.code(503).send({ error: 'BRAIN_API_TOKEN não configurado no servidor. Escritas desabilitadas.' });
    return false;
  }
  const header = req.headers.authorization || '';
  if (header !== `Bearer ${TOKEN}`) {
    reply.code(401).send({ error: 'token inválido ou ausente' });
    return false;
  }
  return true;
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'registro';
}

app.post('/api/learning/outcomes', async (req, reply) => {
  if (!checkAuth(req, reply)) return;
  const { type, title, body } = req.body || {};
  if (type !== 'positive' && type !== 'negative') {
    return reply.code(400).send({ error: 'type deve ser "positive" ou "negative"' });
  }
  if (!title || !body) return reply.code(400).send({ error: 'title e body são obrigatórios' });
  const date = new Date().toISOString().slice(0, 10);
  const rel = join('learning', 'outcomes', type, `${date}-${slugify(title)}.md`);
  const abs = join(REPO_ROOT, rel);
  if (!resolve(abs).startsWith(resolve(REPO_ROOT))) return reply.code(400).send({ error: 'caminho inválido' });
  if (existsSync(abs)) return reply.code(409).send({ error: 'arquivo já existe para este slug/data' });
  mkdirSync(join(REPO_ROOT, 'learning', 'outcomes', type), { recursive: true });
  const fm = ['---', `date: ${date}`, `type: ${type}`, 'tags: []', '---', '', `# ${title}`, '', String(body), ''].join('\n');
  writeFileSync(abs, fm, 'utf8');
  return { ok: true, path: rel.replace(/\\/g, '/') };
});

app.post('/api/memory/notes', async (req, reply) => {
  if (!checkAuth(req, reply)) return;
  const { title, body } = req.body || {};
  if (!title || !body) return reply.code(400).send({ error: 'title e body são obrigatórios' });
  const file = join(REPO_ROOT, 'memory', 'notes.md');
  if (!resolve(file).startsWith(resolve(REPO_ROOT))) return reply.code(400).send({ error: 'caminho inválido' });
  let existing = '';
  try { existing = readFileSync(file, 'utf8'); } catch { /* cria novo */ }
  if (!existing) existing = '# Notas rápidas\n\n';
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  writeFileSync(file, `${existing.replace(/\s*$/, '\n')}\n## ${title} — ${stamp}\n\n${body}\n`, 'utf8');
  return { ok: true, path: 'memory/notes.md' };
});

app.post('/api/synapses/record', async (req, reply) => {
  if (!checkAuth(req, reply)) return;
  const { client, body, service, kind } = req.body || {};
  const kindOk = ['pedido', 'comentario', 'status'].includes(kind || 'pedido');
  if (!client || !body) return reply.code(400).send({ error: 'client e body são obrigatórios' });
  if (!kindOk) return reply.code(400).send({ error: 'kind deve ser pedido, comentario ou status' });
  const slug = slugify(client);
  const rel = join('clients', `${slug}.md`);
  const abs = join(REPO_ROOT, rel);
  if (!resolve(abs).startsWith(resolve(REPO_ROOT))) return reply.code(400).send({ error: 'caminho inválido' });
  mkdirSync(join(REPO_ROOT, 'clients'), { recursive: true });

  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const svc = service ? String(service).trim() : null;
  let created = false;
  let existing = '';
  try { existing = readFileSync(abs, 'utf8'); } catch { created = true; }
  if (!existing) {
    existing = [
      '---', `client: ${String(client).trim()}`, 'tags: [cliente]', '---', '',
      `# ${String(client).trim()}`, '',
      '> Ficha alimentada pela Luna via POST /api/synapses/record. Cada registro abaixo referencia o serviço por wikilink — vira aresta no Atlas após regenerate.', '',
    ].join('\n');
  }
  const entry = [
    `## ${stamp} — ${kind || 'pedido'}`,
    '',
    svc ? `Serviço: [[${svc}]]` : 'Serviço: (não informado)',
    '',
    String(body),
    '',
  ].join('\n');
  writeFileSync(abs, `${existing.replace(/\s*$/, '\n')}\n${entry}`, 'utf8');
  return { ok: true, path: rel.replace(/\\/g, '/'), created };
});

app.post('/api/regenerate', async (_req, reply) => {
  if (!checkAuth(_req, reply)) return;
  const res = spawnSync(process.execPath, [join(ATLAS_DIR, 'generate.mjs')], {
    cwd: REPO_ROOT, timeout: 60_000, encoding: 'utf8',
  });
  if (res.error || res.status !== 0) {
    return reply.code(500).send({ ok: false, error: String(res.error || res.stderr || res.stdout).slice(0, 500) });
  }
  const { nodes, edges } = stats();
  return { ok: true, nodes, edges };
});

/* --------------------------- projetos no grafo --------------------------- */
// Contrato: qualquer repo com o Brain instalado tem `.brain/project.json`.
// O instalador (install.sh) envia esse JSON pra cá e o projeto vira uma
// bolinha no cluster "Projetos" com relatório próprio — sem rebuild.

const PROJECTS_MANIFEST = join(REPO_ROOT, 'projects', 'manifest.json');

function readManifest() {
  try {
    const list = JSON.parse(readFileSync(PROJECTS_MANIFEST, 'utf8'));
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

function writeManifest(list) {
  mkdirSync(join(REPO_ROOT, 'projects'), { recursive: true });
  const tmp = PROJECTS_MANIFEST + '.tmp';
  writeFileSync(tmp, JSON.stringify(list, null, 2) + '\n', 'utf8');
  renameSync(tmp, PROJECTS_MANIFEST);
}

function regenerate() {
  const res = spawnSync(process.execPath, [join(ATLAS_DIR, 'generate.mjs')], {
    cwd: REPO_ROOT, timeout: 60_000, encoding: 'utf8',
  });
  if (res.error || res.status !== 0) {
    return { ok: false, error: String(res.error || res.stderr || res.stdout).slice(0, 500) };
  }
  const { nodes, edges } = stats();
  return { ok: true, nodes, edges };
}

// lista aberta: o instalador usa pra conferir se um projeto já está registrado
app.get('/api/projects/registered', async () => ({
  projects: readManifest().map(m => ({ id: m.id, nome: m.nome, status: m.status || null, grupo: m.grupo || null })),
}));

const PROJECT_FIELDS = ['id', 'nome', 'cliente', 'status', 'stack', 'atividade', 'repo', 'url', 'grupo', 'resumo'];

app.post('/api/projects/register', async (req, reply) => {
  if (!checkAuth(req, reply)) return;
  const body = req.body || {};
  if (!body.nome || !String(body.nome).trim()) {
    return reply.code(400).send({ error: 'nome é obrigatório' });
  }
  const id = slugify(body.id || body.nome);
  const entry = {};
  for (const f of PROJECT_FIELDS) {
    if (body[f] !== undefined && body[f] !== null && String(body[f]).trim() !== '') {
      entry[f] = String(body[f]).trim();
    }
  }
  entry.id = id;
  // relatório: body.relatorio (string md) vira sidecar projects/<id>.md e some do manifest
  const relatorio = typeof body.relatorio === 'string' ? body.relatorio.trim() : '';
  delete entry.relatorio;

  const list = readManifest();
  const idx = list.findIndex(m => m.id === id);
  const merged = idx >= 0 ? { ...list[idx], ...entry } : entry;
  if (relatorio) {
    delete merged.md; // relatório inline vence sidecar antigo
    writeManifestSafe(id, relatorio);
  } else if (idx < 0) {
    merged.md = `${id}.md`; // novo sem relatório: sidecar pode chegar depois
  }
  if (idx >= 0) list[idx] = merged; else list.push(merged);
  writeManifest(list);

  const gen = regenerate();
  if (!gen.ok) return reply.code(500).send({ ok: false, registered: id, error: `registrado, mas regenerate falhou: ${gen.error}` });
  return { ok: true, id, node: `projeto/${id}`, nodes: gen.nodes, edges: gen.edges };
});

app.delete('/api/projects/:id', async (req, reply) => {
  if (!checkAuth(req, reply)) return;
  const id = slugify(req.params.id);
  const list = readManifest();
  const idx = list.findIndex(m => m.id === id);
  if (idx < 0) return reply.code(404).send({ error: `projeto não registrado: ${id}` });
  list.splice(idx, 1);
  writeManifest(list);
  try { rmSync(join(REPO_ROOT, 'projects', `${id}.md`), { force: true }); } catch { /* opcional */ }
  const gen = regenerate();
  if (!gen.ok) return reply.code(500).send({ ok: false, removed: id, error: `removido, mas regenerate falhou: ${gen.error}` });
  return { ok: true, removed: id, nodes: gen.nodes, edges: gen.edges };
});

function writeManifestSafe(id, relatorio) {
  const dir = join(REPO_ROOT, 'projects');
  mkdirSync(dir, { recursive: true });
  const fp = join(dir, `${id}.md`);
  const tmp = fp + '.tmp';
  writeFileSync(tmp, relatorio + '\n', 'utf8');
  renameSync(tmp, fp);
}

/* --------------------------- estático dist --------------------------- */
// zero-dep além do fastify: serve os arquivos de dist/ manualmente
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

app.get('/', async (_req, reply) => {
  try {
    reply.type(MIME['.html']).send(readFileSync(join(DIST, 'index.html')));
  } catch {
    reply.code(404).send({ error: 'dist/ não encontrado — rode npm run build primeiro' });
  }
});

app.get('/data.js', async (_req, reply) => {
  try {
    reply.type(MIME['.js']).send(readFileSync(join(DIST, 'data.js')));
  } catch {
    reply.code(404).send({ error: 'data.js não encontrado — rode npm run regenerate' });
  }
});

app.listen({ port: PORT, host: HOST }).then(() => {
  console.log(`Atlas API em http://${HOST}:${PORT}  (token: ${TOKEN ? 'configurado' : 'NÃO configurado — writes 503'})`);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
