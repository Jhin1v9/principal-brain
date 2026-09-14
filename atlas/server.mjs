#!/usr/bin/env node
// NEXO BRAIN — Atlas API server (Fastify)
// Serve dist/ estático + API de leitura do grafo e escritas autenticadas.
//
//   node atlas/server.mjs        (rode da raiz do repo ou de atlas/)
//
// Reads (CORS *):  /api/health /api/graph /api/nodes/:id /api/search /api/clusters /api/timeline /api/synapse/status
// Writes (Bearer): POST /api/learning/outcomes  POST /api/memory/notes  POST /api/regenerate
// Writes exigem o env BRAIN_API_TOKEN; sem ele configurado → 503, token errado → 401.

import Fastify from 'fastify';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, normalize, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ATLAS_DIR, REPO_ROOT, loadAtlas, buildGraph, searchAtlas } from './lib/atlas-data.mjs';

const PORT = Number(process.env.PORT || 4321);
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

app.get('/api/nodes/:id', async (req, reply) => {
  const { id } = req.params;
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

app.listen({ port: PORT, host: '127.0.0.1' }).then(() => {
  console.log(`Atlas API em http://127.0.0.1:${PORT}  (token: ${TOKEN ? 'configurado' : 'NÃO configurado — writes 503'})`);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
