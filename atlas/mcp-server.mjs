#!/usr/bin/env node
// NEXO BRAIN — Atlas MCP server (stdio)
// Registro: .kimi-code/mcp.json → {"mcpServers":{"brain-atlas":{"command":"node","args":["atlas/mcp-server.mjs"],"cwd":"."}}}
// (cwd "." é a raiz do repo; caminho relativo simples — herda do processo pai.)
//
//   node atlas/mcp-server.mjs
//
// Reads: brain_search / brain_read / brain_graph / brain_timeline / brain_synapse_status
// Writes (confirme com o usuário antes de chamar): brain_append_learning / brain_regenerate

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ATLAS_DIR, REPO_ROOT, loadAtlas, buildGraph, searchAtlas } from './lib/atlas-data.mjs';

const server = new McpServer({
  name: 'brain-atlas',
  version: '2.0.0',
});

const text = (t) => ({ content: [{ type: 'text', text: String(t) }] });

function readNodeContent(id) {
  // path traversal PROIBIDO: só resolve dentro da raiz do repo
  const rel = normalize(String(id)).replace(/^([/\\])+/, '');
  if (rel.startsWith('..') || resolve(REPO_ROOT, rel) !== resolve(join(REPO_ROOT, rel))) {
    return null;
  }
  const abs = join(REPO_ROOT, rel);
  if (!resolve(abs).startsWith(resolve(REPO_ROOT))) return null;
  try { return readFileSync(abs, 'utf8'); } catch { return null; }
}

/* ------------------------------ reads ------------------------------ */

server.registerTool('brain_search', {
  description: 'Busca documentos no brain da Nexo Digital por título, caminho, resumo ou cluster. Retorna os 10 melhores com score.',
  inputSchema: { query: z.string().min(1).describe('termo de busca') },
}, async ({ query }) => {
  const results = searchAtlas(loadAtlas(), query, 10);
  if (!results.length) return text(`Nenhum documento encontrado para "${query}".`);
  return text(results.map((r, i) =>
    `${i + 1}. [${r.score}] ${r.title}\n   id: ${r.id}\n   cluster: ${r.cluster}\n   ${r.excerpt}`
  ).join('\n\n'));
});

server.registerTool('brain_read', {
  description: 'Lê um documento completo do brain (markdown + backlinks). O id é o caminho relativo, ex.: "index.md" ou "automation/synapse.sh".',
  inputSchema: { id: z.string().min(1).describe('caminho relativo do documento') },
}, async ({ id }) => {
  const data = loadAtlas();
  const { byId, backlinks } = buildGraph(data);
  const node = byId.get(id);
  if (!node) return text(`Documento não encontrado no atlas: ${id}. Use brain_search para descobrir ids.`);
  const content = readNodeContent(id) ?? node.body ?? '(conteúdo indisponível)';
  const bl = backlinks.get(id) || [];
  return text(
    `# ${node.title}\n` +
    `id: ${node.id}\ncluster: ${node.cluster}${node.date ? `\ndata: ${node.date}` : ''}${node.tipo ? `\ntipo: ${node.tipo}` : ''}\n\n` +
    content +
    (bl.length ? `\n\n---\nLinks para cá (${bl.length}):\n${bl.map(b => `- ${b}`).join('\n')}` : '\n\n---\nLinks para cá: nenhum')
  );
});

server.registerTool('brain_graph', {
  description: 'Retorna nós e arestas do grafo de conhecimento, opcionalmente filtrados por cluster.',
  inputSchema: {
    cluster: z.string().optional().describe('filtrar por nome do cluster (ex.: "Conhecimento") — opcional'),
  },
}, async ({ cluster }) => {
  const data = loadAtlas();
  const nodes = cluster ? data.nodes.filter(n => n.cluster === cluster) : data.nodes;
  if (!nodes.length) return text(cluster ? `Cluster não encontrado ou vazio: ${cluster}. Clusters: ${data.clusters.join(', ')}` : 'Grafo vazio.');
  const ids = new Set(nodes.map(n => n.id));
  const edges = data.edges.filter(e => ids.has(e.source) && ids.has(e.target));
  return text(JSON.stringify({
    generatedAt: data.generatedAt,
    nodes: nodes.map(n => ({ id: n.id, title: n.title, cluster: n.cluster, date: n.date, tipo: n.tipo, links: n.links || [] })),
    edges,
  }, null, 1));
});

server.registerTool('brain_timeline', {
  description: 'Retorna as entradas do changelog (classificadas pelo SYNAPSE a cada commit), mais novas primeiro.',
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe('máximo de entradas (padrão 20)'),
  },
}, async ({ limit }) => {
  const data = loadAtlas();
  const entries = data.nodes
    .filter(n => n.cluster === 'Changelog' && n.tipo)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, limit || 20);
  if (!entries.length) return text('Nenhuma entrada de changelog ainda.');
  return text(entries.map(e =>
    `- ${e.date || '—'} [${e.tipo}${e.escopo ? '/' + e.escopo : ''}] ${e.title}\n  id: ${e.id}\n  ${e.summary || ''}`
  ).join('\n'));
});

server.registerTool('brain_synapse_status', {
  description: 'Status do pipeline SYNAPSE: últimas linhas do .git/synapse.log e contagens do changelog.',
  inputSchema: {},
}, async () => {
  const logFile = join(REPO_ROOT, '.git', 'synapse.log');
  let log = [];
  try {
    log = readFileSync(logFile, 'utf8').replace(/\r\n/g, '\n').split('\n').filter(Boolean).slice(-20);
  } catch { /* sem log ainda */ }
  const entriesDir = join(REPO_ROOT, 'changelog', 'entries');
  let entries = 0;
  try { entries = readdirSync(entriesDir).filter(f => f.endsWith('.md')).length; } catch { /* dir pode não existir */ }
  const data = loadAtlas();
  return text(
    `changelog/entries: ${entries}\nchangelog indexado no atlas: ${data.nodes.filter(n => n.cluster === 'Changelog').length}\n\n` +
    (log.length ? 'últimas linhas do synapse.log:\n' + log.join('\n') : 'synapse.log vazio ou inexistente.')
  );
});

/* ------------------------------ writes ------------------------------ */
// ATENÇÃO: as duas ferramentas abaixo ESCREVEM no repositório.
// Confirme com o usuário antes de chamá-las.

server.registerTool('brain_append_learning', {
  description: 'WRITE — escreve um novo arquivo em learning/outcomes/<type>/ (aprendizado positivo ou negativo). Confirme com o usuário antes de chamar esta ferramenta.',
  inputSchema: {
    type: z.enum(['positive', 'negative']).describe('positive ou negative'),
    title: z.string().min(1).describe('título do aprendizado'),
    body: z.string().min(1).describe('corpo em markdown'),
  },
}, async ({ type, title, body }) => {
  const date = new Date().toISOString().slice(0, 10);
  const slug = String(title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'registro';
  const rel = `learning/outcomes/${type}/${date}-${slug}.md`;
  const abs = join(REPO_ROOT, ...rel.split('/'));
  if (!resolve(abs).startsWith(resolve(REPO_ROOT))) return text('Erro: caminho fora da raiz do repositório.');
  if (existsSync(abs)) return text(`Erro: ${rel} já existe. Escolha outro título.`);
  mkdirSync(join(REPO_ROOT, 'learning', 'outcomes', type), { recursive: true });
  const fm = ['---', `date: ${date}`, `type: ${type}`, 'tags: []', '---', '', `# ${title}`, '', body, ''].join('\n');
  writeFileSync(abs, fm, 'utf8');
  return text(`OK — escrito em ${rel}`);
});

server.registerTool('brain_regenerate', {
  description: 'WRITE — re-executa o gerador do grafo (node atlas/generate.mjs) e reescreve atlas/public/data.js. Confirme com o usuário antes de chamar esta ferramenta.',
  inputSchema: {},
}, async () => {
  const res = spawnSync(process.execPath, [join(ATLAS_DIR, 'generate.mjs')], {
    cwd: REPO_ROOT, timeout: 60_000, encoding: 'utf8',
  });
  if (res.error || res.status !== 0) {
    return text(`Erro ao regenerar: ${String(res.error || res.stderr || res.stdout).slice(0, 500)}`);
  }
  const data = loadAtlas();
  return text(`OK — atlas regenerado: ${data.nodes.length} nós, ${data.edges.length} arestas.\n${String(res.stdout).trim()}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
