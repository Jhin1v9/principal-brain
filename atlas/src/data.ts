// Tipos + carga de window.ATLAS_DATA (emitido por atlas/generate.mjs em public/data.js)

export interface AtlasNode {
  id: string;
  title: string;
  cluster: string;
  summary: string;
  date?: string | null;
  tipo?: string | null;
  escopo?: string | null;
  kind?: string;
  links: string[];
  deg: number; // preenchido em runtime (generate não emite; manter default 0)
  body?: string;
}

export interface AtlasEdge { source: string; target: string; }

export interface AtlasData {
  generatedAt: string;
  clusters: string[];
  nodes: AtlasNode[];
  edges: AtlasEdge[];
}

declare global {
  interface Window { ATLAS_DATA?: AtlasData; }
}

export const CLUSTER_COLORS: Record<string, string> = {
  'Núcleo': '#eab308',
  'Personalidades': '#8b5cf6',
  'Personas': '#ec4899',
  'Runbooks': '#22d3ee',
  'Conhecimento': '#3b82f6',
  'Memória': '#34d399',
  'Aprendizado': '#f59e0b',
  'Automação SYNAPSE': '#d946ef',
  'Changelog': '#84cc16',
  'Relatórios': '#fb7185',
};

export const TIPO_COLORS: Record<string, string> = {
  feat: '#34d399', fix: '#fb7185', perf: '#a78bfa', docs: '#60a5fa',
  refactor: '#f59e0b', test: '#22d3ee', chore: '#94a3b8', style: '#f472b6',
};

export function clusterColor(cluster: string): string {
  return CLUSTER_COLORS[cluster] || '#94a3b8';
}

function emptyData(): AtlasData {
  return { generatedAt: new Date().toISOString(), clusters: [], nodes: [], edges: [] };
}

export function loadAtlasData(): AtlasData {
  const raw = window.ATLAS_DATA;
  if (!raw || !Array.isArray(raw.nodes)) return emptyData();
  const nodes = raw.nodes.map(n => ({ ...n, deg: n.deg || 0, links: n.links || [] }));
  return { ...raw, nodes, edges: raw.edges || [] };
}

export interface AtlasIndex {
  data: AtlasData;
  byId: Map<string, AtlasNode>;
  adj: Map<string, Set<string>>;
  backlinks: Map<string, string[]>;
  degree: (id: string) => number;
}

export function buildIndex(data: AtlasData): AtlasIndex {
  const byId = new Map(data.nodes.map(n => [n.id, n]));
  const adj = new Map<string, Set<string>>(data.nodes.map(n => [n.id, new Set<string>()]));
  const backlinks = new Map<string, string[]>(data.nodes.map(n => [n.id, [] as string[]]));
  for (const e of data.edges) {
    if (adj.has(e.source)) adj.get(e.source)!.add(e.target);
    if (adj.has(e.target)) adj.get(e.target)!.add(e.source);
    if (byId.has(e.source) && byId.has(e.target)) backlinks.get(e.target)!.push(e.source);
  }
  for (const n of data.nodes) n.deg = adj.get(n.id)?.size || 0;
  return { data, byId, adj, backlinks, degree: id => adj.get(id)?.size || 0 };
}

export function resolveNodeId(target: string | null | undefined, index: AtlasIndex): string | null {
  if (!target) return null;
  let t = decodeURIComponent(String(target)).trim().replace(/^\.\//, '').split('#')[0].split('?')[0];
  if (!t) return null;
  if (index.byId.has(t)) return t;
  if (!t.includes('.')) {
    if (index.byId.has(t + '.md')) return t + '.md';
    for (const n of index.data.nodes) {
      const base = n.id.split('/').pop()!.replace(/\.[^.]+$/, '');
      if (base === t) return n.id;
    }
  }
  return null;
}

export interface ScoredNode { node: AtlasNode; score: number; }

export function searchNodes(query: string, index: AtlasIndex, limit = 8): ScoredNode[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return index.data.nodes
    .map(node => {
      const t = node.title.toLowerCase(), i = node.id.toLowerCase();
      let score = 0;
      if (t.startsWith(q)) score = 100;
      else if (t.includes(q)) score = 60;
      else if (i.includes(q)) score = 40;
      else if ((node.summary || '').toLowerCase().includes(q)) score = 20;
      else if ((node.cluster || '').toLowerCase().includes(q)) score = 10;
      return { node, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || b.node.deg - a.node.deg)
    .slice(0, limit);
}

export function metaLine(index: AtlasIndex): string {
  const d = index.data;
  const date = d.generatedAt.slice(0, 10).split('-').reverse().join('/');
  return `${d.nodes.length} documentos · ${d.edges.length} conexões · gerado em ${date}`;
}
