// Loader compartilhado do ATLAS_DATA (usado por server.mjs e mcp-server.mjs)
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ATLAS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = join(ATLAS_DIR, '..');

export function loadAtlas() {
  const dataFile = join(ATLAS_DIR, 'public', 'data.js');
  if (!existsSync(dataFile)) return { generatedAt: null, clusters: [], nodes: [], edges: [] };
  const src = readFileSync(dataFile, 'utf8');
  const m = src.match(/window\.ATLAS_DATA = (\{[\s\S]*\});?\s*$/);
  if (!m) return { generatedAt: null, clusters: [], nodes: [], edges: [] };
  return JSON.parse(m[1]);
}

export function buildGraph(data) {
  const byId = new Map(data.nodes.map(n => [n.id, n]));
  const backlinks = new Map(data.nodes.map(n => [n.id, []]));
  for (const e of data.edges) {
    if (byId.has(e.source) && byId.has(e.target)) backlinks.get(e.target).push(e.source);
  }
  return { byId, backlinks };
}

export function scoreNode(node, q) {
  const t = (node.title || '').toLowerCase(), i = (node.id || '').toLowerCase();
  if (t.startsWith(q)) return 100;
  if (t.includes(q)) return 60;
  if (i.includes(q)) return 40;
  if ((node.summary || '').toLowerCase().includes(q)) return 20;
  if ((node.cluster || '').toLowerCase().includes(q)) return 10;
  return 0;
}

export function searchAtlas(data, qRaw, limit = 10) {
  const q = String(qRaw || '').toLowerCase().trim();
  if (!q) return [];
  return data.nodes
    .map(n => ({ node: n, score: scoreNode(n, q) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => ({ id: r.node.id, title: r.node.title, cluster: r.node.cluster, score: r.score, excerpt: (r.node.summary || '').slice(0, 200) }));
}
