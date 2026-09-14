#!/usr/bin/env node
// Atlas generator — varre o brain e emite atlas/data.js (window.ATLAS_DATA = {...})
// Uso: node atlas/generate.mjs   (rode da raiz do repo; o script resolve a raiz sozinho)

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ATLAS_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(ATLAS_DIR, '..');

const CLUSTER_OF = [
  [/\.brain[\\/]personalities[\\/]/, 'Personalidades'],
  [/\.brain[\\/]/, 'Núcleo'],
  [/^personalities[\\/]/, 'Personalidades'],
  [/^personas[\\/]/, 'Personas'],
  [/^runbooks[\\/]/, 'Runbooks'],
  [/^knowledge[\\/]/, 'Conhecimento'],
  [/^memory[\\/]/, 'Memória'],
  [/^learning[\\/]/, 'Aprendizado'],
  [/^automation[\\/]/, 'Automação SYNAPSE'],
  [/^changelog[\\/]/, 'Changelog'],
  [/^reports[\\/]/, 'Relatórios'],
  [/./, 'Núcleo'],
];

const TEXT_EXT = new Set(['.md', '.sh', '.ps1', '.json', '.env', '']);

function clusterOf(rel) {
  const posix = rel.replace(/\\/g, '/');
  for (const [re, c] of CLUSTER_OF) if (re.test(posix)) return c;
  return 'Núcleo';
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function extOf(name) {
  const i = name.lastIndexOf('.');
  return i <= 0 ? '' : name.slice(i);
}

function stripFrontmatter(text) {
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end !== -1) {
      const fm = text.slice(3, end);
      const body = text.slice(end + 4).replace(/^\r?\n/, '');
      return { fm, body };
    }
  }
  return { fm: '', body: text };
}

function fmValue(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

function firstDate(name, fm) {
  const fromFm = fmValue(fm, 'data') || fmValue(fm, 'date');
  if (fromFm && /^\d{4}-\d{2}-\d{2}/.test(fromFm)) return fromFm.slice(0, 10);
  const inName = name.match(/(\d{4}-\d{2}-\d{2})/);
  if (inName) return inName[1];
  return null;
}

function cleanTitle(s) {
  return s
    .replace(/^[#>\s]+/, '')
    .replace(/[*`~]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[\[([^\]|]*)(?:\|[^\]]*)?\]\]/g, '$1')
    .trim();
}

function cleanInline(s) {
  return s
    .replace(/[*`~#>]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[\[([^\]|]*)(?:\|[^\]]*)?\]\]/g, '$1')
    .trim();
}

// ---------- collect files ----------
const files = walk(ROOT)
  .map(p => relative(ROOT, p).replace(/\\/g, '/'))
  .filter(rel => !rel.startsWith('atlas/'))
  .filter(rel => {
    const e = extOf(basename(rel));
    return e === '.md' || rel.startsWith('automation/');
  })
  .filter(rel => !rel.endsWith('.gitkeep'))
  .sort();

const nodes = [];
const byId = new Map();

// assuntos reais dos commits a partir do índice do CHANGELOG (para títulos das entradas)
const changelogSubjects = new Map();
try {
  const cl = readFileSync(join(ROOT, 'changelog/CHANGELOG.md'), 'utf8').replace(/\r\n/g, '\n');
  for (const line of cl.split('\n')) {
    const m = line.match(/`([0-9a-f]{7})`[^—]*—\s*(.+?)\s*\(\[análise\]/);
    if (m) changelogSubjects.set(m[1], m[2]);
  }
} catch { /* CHANGELOG.md pode não existir ainda */ }

for (const rel of files) {
  const abs = join(ROOT, rel);
  let text = '';
  try { text = readFileSync(abs, 'utf8'); } catch { continue; }
  text = text.replace(/\r\n/g, '\n');
  const { fm, body } = stripFrontmatter(text);

  const title =
    (body.match(/^#\s+(.+)$/m) || [])[1] ||
    (fm.match(/^name:\s*(.+)$/m) || [])[1] ||
    basename(rel).replace(/\.[^.]+$/, '');
  const e = extOf(basename(rel));
  const isScript = e === '.sh' || e === '.ps1' || rel.endsWith('/post-commit');
  let summarySource = body;
  if (isScript) {
    // scripts: resumo das primeiras linhas de comentário
    summarySource = body.split('\n').filter(l => /^\s*#/.test(l)).join('\n') || body;
  }
  const summary = cleanInline(
    summarySource.split('\n').filter(l => l.trim() && !/^#/.test(l.trim()) && !/^---/.test(l)).join(' ')
  ).slice(0, 200);

  const short = (basename(rel).match(/-([0-9a-f]{7})\.md$/) || [])[1];
  const node = {
    id: rel,
    title: (short && changelogSubjects.get(short)) || cleanTitle(title).slice(0, 120) || basename(rel),
    cluster: clusterOf(rel),
    date: firstDate(basename(rel), fm),
    tipo: fmValue(fm, 'tipo'),
    escopo: fmValue(fm, 'escopo'),
    summary,
    body: body.slice(0, 40000),
    kind: e === '.md' ? 'doc' : 'script',
  };
  nodes.push(node);
  byId.set(rel, node);
}

// basename index p/ detecção de menções no corpo
const byBasename = new Map();
for (const n of nodes) {
  const base = basename(n.id);
  if (!byBasename.has(base)) byBasename.set(base, []);
  byBasename.get(base).push(n.id);
}

// ---------- extract links ----------
function resolveTarget(fromRel, target) {
  if (!target) return null;
  let t = target.trim().replace(/^\.\//, '').split('#')[0].split('?')[0];
  if (!t) return null;
  t = decodeURIComponent(t).replace(/\\/g, '/');
  if (byId.has(t)) return t;
  // tenta relativo ao diretório do arquivo
  const fromDir = dirname(fromRel).replace(/\\/g, '/');
  const rel = fromDir === '.' ? t : `${fromDir}/${t}`.replace(/\/[^/]*\/\.\.\//g, '/');
  const norm = rel.replace(/\/\.\//g, '/').replace(/[^/]+\/\.\.\//g, '');
  if (byId.has(norm)) return norm;
  if (byId.has(rel)) return rel;
  // wikilink sem extensão
  if (!t.includes('.')) {
    const withMd = `${t}.md`;
    if (byId.has(withMd)) return withMd;
    for (const id of byId.keys()) {
      if (basename(id).replace(/\.[^.]+$/, '') === t) return id;
    }
  }
  return null;
}

const mdLinkRe = /\[([^\]]*)\]\(([^)\s]+)\)/g;
const wikiRe = /\[\[([^\]]+)\]\]/g;

for (const n of nodes) {
  const links = new Set();
  let m;
  // usa o corpo inteiro: menções em código inline/backticks são citações reais no brain
  const bodyNoCode = n.body;
  mdLinkRe.lastIndex = 0;
  while ((m = mdLinkRe.exec(bodyNoCode))) {
    const t = resolveTarget(n.id, m[2]);
    if (t && t !== n.id) links.add(t);
  }
  wikiRe.lastIndex = 0;
  while ((m = wikiRe.exec(bodyNoCode))) {
    const t = resolveTarget(n.id, m[1].split('|')[0].trim());
    if (t && t !== n.id) links.add(t);
  }
  // menções a nomes de arquivos existentes (qualquer caminho com .md ou scripts conhecidos)
  const mentionRe = /[A-Za-z0-9_.\-\/]+\.(?:md|sh|ps1)\b/g;
  while ((m = mentionRe.exec(bodyNoCode))) {
    const t = resolveTarget(n.id, m[0]);
    if (t && t !== n.id) links.add(t);
  }
  n.links = [...links];
}

// ---------- nós sintéticos do SYNAPSE ----------
const synDir = id => id.split('/').slice(0, -1).join('/');
const flowBody = [
  '# Fluxo SYNAPSE',
  '',
  'Pipeline executado após cada `git commit`:',
  '',
  '1. `git commit` dispara o hook `automation/hooks/post-commit` (assíncrono, <1s, nunca bloqueia).',
  '2. O hook coleta metadados (hash, autor, data, diff --stat) num JSON em `.git/` e chama `automation/synapse.sh`.',
  '3. `synapse.sh` (orquestrador, lockfile + idempotência) invoca o primeiro agente Kimi: `prompts/classify-commit.agent.md`.',
  '4. O classificador grava `changelog/entries/<data>-<hash>.md` e atualiza `changelog/CHANGELOG.md`.',
  '5. O orquestrador invoca o segundo agente: `prompts/generate-report.agent.md`, que reescreve `reports/latest.md`.',
  '6. Com `SYNAPSE_AUTO_COMMIT=1` (padrão), o orquestrador commita os artefatos com a marca `[synapse]`.',
  '7. O hook ignora commits cuja mensagem contém `[synapse]` — loop seguro, sem auto-disparo.',
  '',
  'Se a IA falhar ou estiver desativada (`SYNAPSE_DISABLE=1`), o shell grava uma entrada básica em `changelog/entries/` + `CHANGELOG.md` (fallback determinístico, sem relatório).',
].join('\n');

nodes.push(
  {
    id: 'automation/prompts/classify-commit.agent.md',
    title: 'Agente: synapse-classify', cluster: 'Automação SYNAPSE',
    date: null, summary: 'Agente Kimi que lê o diff real do commit, classifica (tipo, impacto, risco) e grava changelog/entries/ + CHANGELOG.md.',
    body: byId.get('automation/prompts/classify-commit.agent.md')?.body || '',
    kind: 'agente', links: ['automation/prompts/generate-report.agent.md', 'automation/synapse.sh', 'changelog/CHANGELOG.md'],
  },
  {
    id: 'automation/prompts/generate-report.agent.md',
    title: 'Agente: synapse-report', cluster: 'Automação SYNAPSE',
    date: null, summary: 'Agente Kimi que consolida o changelog e reescreve o relatório vivo reports/latest.md em linguagem técnica.',
    body: byId.get('automation/prompts/generate-report.agent.md')?.body || '',
    kind: 'agente', links: ['automation/prompts/classify-commit.agent.md', 'reports/latest.md', 'automation/synapse.sh'],
  },
  {
    id: 'synapse/fluxo', title: 'Fluxo SYNAPSE (pipeline pós-commit)', cluster: 'Automação SYNAPSE',
    date: null, summary: 'Diagrama do pipeline: commit → hook → orquestrador → classificador → changelog → relatório → auto-commit [synapse] → loop seguro.',
    body: flowBody, kind: 'fluxo', links: ['automation/hooks/post-commit', 'automation/synapse.sh', 'automation/prompts/classify-commit.agent.md', 'automation/prompts/generate-report.agent.md', 'changelog/CHANGELOG.md', 'reports/latest.md'],
  },
);
// remove duplicata real do prompt de classificação (nó sintético o substitui)
const dup = nodes.findIndex(n => n.id === 'automation/prompts/classify-commit.agent.md');
nodes.splice(dup, 1);

// ---------- edges ----------
const edgeSet = new Set();
const edges = [];
for (const n of nodes) {
  for (const t of n.links || []) {
    if (!byId.has(t) && !nodes.some(x => x.id === t)) continue;
    if (t === n.id) continue;
    const key = `${n.id}→${t}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);
    edges.push({ source: n.id, target: t });
  }
}

// ---------- saída ----------
const data = {
  generatedAt: new Date().toISOString(),
  clusters: ['Núcleo', 'Personalidades', 'Personas', 'Runbooks', 'Conhecimento', 'Memória', 'Aprendizado', 'Automação SYNAPSE', 'Changelog', 'Relatórios'],
  nodes, edges,
};

const out = `// Gerado automaticamente por atlas/generate.mjs — não edite à mão.\nwindow.ATLAS_DATA = ${JSON.stringify(data)};\n`;
writeFileSync(join(ATLAS_DIR, 'data.js'), out);

const perCluster = {};
for (const n of nodes) perCluster[n.cluster] = (perCluster[n.cluster] || 0) + 1;
console.log(`Atlas: ${nodes.length} nós, ${edges.length} arestas`);
for (const [c, k] of Object.entries(perCluster)) console.log(`  ${c}: ${k}`);
