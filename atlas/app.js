/* ============ NEXO BRAIN — Atlas ============ */
'use strict';

const DATA = window.ATLAS_DATA;
const NODES = DATA.nodes;
const EDGES = DATA.edges;

const CLUSTER_COLORS = {
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
const TIPO_COLORS = {
  feat: '#34d399', fix: '#fb7185', perf: '#a78bfa', docs: '#60a5fa',
  refactor: '#f59e0b', test: '#22d3ee', chore: '#94a3b8', style: '#f472b6',
};

const byId = new Map(NODES.map(n => [n.id, n]));
const adj = new Map(NODES.map(n => [n.id, new Set()]));
for (const e of EDGES) {
  if (adj.has(e.source)) adj.get(e.source).add(e.target);
  if (adj.has(e.target)) adj.get(e.target).add(e.source);
}
const backlinks = new Map(NODES.map(n => [n.id, []]));
for (const e of EDGES) {
  if (byId.has(e.source) && byId.has(e.target)) backlinks.get(e.target).push(e.source);
}
const degree = id => adj.get(id)?.size || 0;

/* ---------- util ---------- */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function resolveNodeId(target) {
  if (!target) return null;
  let t = decodeURIComponent(String(target)).trim().replace(/^\.\//, '').split('#')[0].split('?')[0];
  if (byId.has(t)) return t;
  if (!t.includes('.')) {
    if (byId.has(t + '.md')) return t + '.md';
    for (const n of NODES) {
      const base = n.id.split('/').pop().replace(/\.[^.]+$/, '');
      if (base === t) return n.id;
    }
  }
  return null;
}

/* ================================================================
   Mini-renderizador markdown (~100 linhas): headings, bold, itálico,
   code inline/blocks, listas, links, wikilinks, quote, hr, tabelas.
================================================================ */
function inlineMd(text) {
  let s = esc(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (m, target, label) => {
    const id = resolveNodeId(target);
    return id ? `<a data-node="${esc(id)}">${esc(label)}</a>` : esc(label);
  });
  s = s.replace(/\[\[([^\]]+)\]\]/g, (m, target) => {
    const id = resolveNodeId(target);
    return id ? `<a data-node="${esc(id)}">${esc(target)}</a>` : esc(target);
  });
  s = s.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (m, label, href) => {
    const id = resolveNodeId(href);
    return id ? `<a data-node="${esc(id)}">${label}</a>` : `<a href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return s;
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let para = [], list = null, quote = [], code = null, table = [];

  const flushPara = () => { if (para.length) { html.push(`<p>${para.map(inlineMd).join('<br>')}</p>`); para = []; } };
  const flushList = () => { if (list) { html.push(`<${list.type}>${list.items.map(i => `<li>${inlineMd(i)}</li>`).join('')}</${list.type}>`); list = null; } };
  const flushQuote = () => { if (quote.length) { html.push(`<blockquote>${quote.map(inlineMd).join('<br>')}</blockquote>`); quote = []; } };
  const flushTable = () => {
    if (table.length) {
      const rows = table.filter(r => !/^\s*\|?[\s:|-]+\|?\s*$/.test(r)).map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      if (rows.length) {
        const [head, ...body] = rows;
        html.push('<table><thead><tr>' + head.map(c => `<th>${inlineMd(c)}</th>`).join('') + '</tr></thead><tbody>' +
          body.map(r => '<tr>' + r.map(c => `<td>${inlineMd(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>');
      }
      table = [];
    }
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); flushTable(); };

  for (const line of lines) {
    if (code) {
      if (/^```/.test(line)) { html.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`); code = null; }
      else code.push(line);
      continue;
    }
    if (/^```/.test(line)) { flushAll(); code = []; continue; }
    if (/^\s*\|.*\|\s*$/.test(line)) { flushPara(); flushList(); flushQuote(); table.push(line); continue; }
    flushTable();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flushAll(); const lvl = h[1].length; html.push(`<h${lvl}>${inlineMd(h[2])}</h${lvl}>`); continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flushAll(); html.push('<hr>'); continue; }
    if (/^>\s?/.test(line)) { flushPara(); flushList(); quote.push(line.replace(/^>\s?/, '')); continue; }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) { flushPara(); flushQuote(); if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; } list.items.push(ul[1]); continue; }
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ol) { flushPara(); flushQuote(); if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; } list.items.push(ol[1]); continue; }
    if (!line.trim()) { flushAll(); continue; }
    flushList(); flushQuote();
    para.push(line);
  }
  if (code) html.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
  flushAll();
  return html.join('\n');
}

/* ================================================================
   GRAFO — física própria (repulsão + molas + gravidade) + canvas
================================================================ */
const canvas = $('#graph-canvas');
const ctx = canvas.getContext('2d');
const DPR = Math.min(window.devicePixelRatio || 1, 2);

const G = {
  nodes: NODES.map((n, i) => ({
    ...n,
    deg: degree(n.id),
    x: Math.cos(i * 2.399) * (140 + i * 2.2),
    y: Math.sin(i * 2.399) * (140 + i * 2.2),
    vx: 0, vy: 0,
  })),
  edges: EDGES.filter(e => byId.has(e.source) && byId.has(e.target)),
  k: 1, tx: 0, ty: 0,
  hover: null, selected: null,
  physics: true,
  alpha: 1,
  clusterFilter: null,
  query: '',
  pointers: new Map(),
  pinchDist: 0,
};

function resizeCanvas() {
  const r = canvas.parentElement.getBoundingClientRect();
  canvas.width = r.width * DPR;
  canvas.height = r.height * DPR;
}
window.addEventListener('resize', () => { resizeCanvas(); drawGraph(); layoutFluxoPipes(); });

function physicsTick() {
  const ns = G.nodes;
  const n = ns.length;
  const REP = 4600, REST = 130, SPRING = 0.028, GRAV = 0.016, DAMP = 0.86;
  G.alpha = Math.max(0.12, G.alpha * 0.995);

  for (let i = 0; i < n; i++) {
    const a = ns[i];
    for (let j = i + 1; j < n; j++) {
      const b = ns[j];
      let dx = a.x - b.x, dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < 1) { dx = (Math.random() - .5); dy = (Math.random() - .5); d2 = 1; }
      const d = Math.sqrt(d2);
      const f = Math.min(REP / d2, 14) * G.alpha;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }
  }
  for (const e of G.edges) {
    const na = G.nodes.find(x => x.id === e.source), nb = G.nodes.find(x => x.id === e.target);
    let dx = nb.x - na.x, dy = nb.y - na.y;
    const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const f = (d - REST) * SPRING;
    na.vx += (dx / d) * f; na.vy += (dy / d) * f;
    nb.vx -= (dx / d) * f; nb.vy -= (dy / d) * f;
  }
  for (const node of ns) {
    node.vx -= node.x * GRAV * G.alpha;
    node.vy -= node.y * GRAV * G.alpha;
    node.vx *= DAMP; node.vy *= DAMP;
    const sp = Math.hypot(node.vx, node.vy);
    if (sp > 9) { node.vx = node.vx / sp * 9; node.vy = node.vy / sp * 9; }
    node.x += node.vx * G.alpha;
    node.y += node.vy * G.alpha;
  }
}

function nodeRadius(node) {
  return 4 + Math.min(11, node.deg * 1.15);
}

function matchesFilter(node) {
  if (G.clusterFilter && node.cluster !== G.clusterFilter) return false;
  if (G.query) {
    const q = G.query.toLowerCase();
    return node.title.toLowerCase().includes(q) || node.id.toLowerCase().includes(q) ||
      (node.summary || '').toLowerCase().includes(q);
  }
  return true;
}

function drawGraph() {
  const w = canvas.width / DPR, h = canvas.height / DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const toX = x => x * G.k + w / 2 + G.tx;
  const toY = y => y * G.k + h / 2 + G.ty;

  const hasFocus = G.hover || G.selected || G.query || G.clusterFilter;
  const focusId = G.hover || G.selected;
  const focusSet = focusId ? (() => { const s = new Set([focusId]); (adj.get(focusId) || []).forEach(t => s.add(t)); return s; })() : null;

  // arestas
  ctx.lineWidth = 1;
  for (const e of G.edges) {
    const a = G.nodes.find(x => x.id === e.source), b = G.nodes.find(x => x.id === e.target);
    let alpha = 0.22;
    if (focusSet) alpha = focusSet.has(e.source) && focusSet.has(e.target) && (e.source === focusId || e.target === focusId) ? 0.85 : 0.05;
    else if (hasFocus) alpha = (matchesFilter(a) && matchesFilter(b)) ? 0.22 : 0.04;
    ctx.strokeStyle = `rgba(148,163,184,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(toX(a.x), toY(a.y));
    ctx.lineTo(toX(b.x), toY(b.y));
    ctx.stroke();
  }

  // nós
  const placedLabels = [];
  for (const node of G.nodes) {
    const r = nodeRadius(node) * (0.75 + G.k * 0.25);
    const x = toX(node.x), y = toY(node.y);
    if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue;

    let alpha = 1;
    if (focusSet) alpha = focusSet.has(node.id) ? 1 : 0.12;
    else if (hasFocus) alpha = matchesFilter(node) ? 1 : 0.14;
    const dimmed = alpha < 0.5;

    const color = CLUSTER_COLORS[node.cluster] || '#94a3b8';
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = dimmed ? 0 : 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    if (node.id === focusId) {
      ctx.beginPath();
      ctx.arc(x, y, r + 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // rótulo: visibilidade por zoom/grau + anti-colisão simples
    const showLabel =
      node.id === focusId ||
      (node.deg >= 8 && G.k > 0.45) ||
      (node.deg >= 4 && G.k > 0.7) ||
      G.k > 1.05;
    if (showLabel) {
      const la = dimmed ? 0.1 : clamp(0.35 + (G.k - 0.6) * 1.6 + node.deg * 0.02, 0.2, 1);
      ctx.globalAlpha = la;
      ctx.font = `${node.deg >= 5 ? 600 : 400} ${node.deg >= 5 ? 12 : 10.5}px Inter, "Segoe UI", sans-serif`;
      ctx.fillStyle = node.id === focusId ? '#fff' : '#cbd5e1';
      ctx.textAlign = 'center';
      const label = node.title.length > 34 ? node.title.slice(0, 33) + '…' : node.title;
      const tw = ctx.measureText(label).width;
      const box = { x: x - tw / 2 - 3, y: y + r + 3, w: tw + 6, h: 14 };
      const collides = placedLabels.some(b =>
        box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y);
      if (!collides || node.id === focusId) {
        placedLabels.push(box);
        ctx.fillText(label, x, y + r + 13);
      }
    }
  }
  ctx.globalAlpha = 1;
}

function loop() {
  if (G.physics) physicsTick();
  drawGraph();
  requestAnimationFrame(loop);
}

function screenToWorld(px, py) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (px - r.left - r.width / 2 - G.tx) / G.k,
    y: (py - r.top - r.height / 2 - G.ty) / G.k,
  };
}

function nodeAt(px, py) {
  const r = canvas.getBoundingClientRect();
  const w = r.width, h = r.height;
  let best = null, bestD = 20;
  for (const node of G.nodes) {
    const x = node.x * G.k + w / 2 + G.tx;
    const y = node.y * G.k + h / 2 + G.ty;
    const d = Math.hypot(px - r.left - x, py - r.top - y) - nodeRadius(node) * G.k;
    if (d < bestD) { bestD = d; best = node; }
  }
  return best;
}

function zoomAt(px, py, factor) {
  const r = canvas.getBoundingClientRect();
  const cx = px - r.left - r.width / 2, cy = py - r.top - r.height / 2;
  const k2 = clamp(G.k * factor, 0.22, 3.2);
  G.tx = cx - (cx - G.tx) * (k2 / G.k);
  G.ty = cy - (cy - G.ty) * (k2 / G.k);
  G.k = k2;
}

function fitGraph(margin = 0.82) {
  const r = canvas.parentElement.getBoundingClientRect();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of G.nodes) {
    minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
  }
  const bw = Math.max(maxX - minX, 1), bh = Math.max(maxY - minY, 1);
  const k = clamp(Math.min(r.width / bw, r.height / bh) * margin, 0.3, 1.5);
  G.k = k;
  G.tx = -((minX + maxX) / 2) * k;
  G.ty = -((minY + maxY) / 2) * k;
}

let dragState = null;
canvas.addEventListener('pointerdown', ev => {
  canvas.setPointerCapture(ev.pointerId);
  G.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (G.pointers.size === 2) {
    const [a, b] = [...G.pointers.values()];
    G.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    dragState = { type: 'pinch' };
    return;
  }
  const node = nodeAt(ev.clientX, ev.clientY);
  dragState = node
    ? { type: 'node', node, moved: 0 }
    : { type: 'pan', sx: ev.clientX, sy: ev.clientY, tx: G.tx, ty: G.ty, moved: 0 };
  canvas.classList.add('is-dragging');
});

canvas.addEventListener('pointermove', ev => {
  if (G.pointers.has(ev.pointerId)) G.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

  if (dragState?.type === 'pinch' && G.pointers.size === 2) {
    const [a, b] = [...G.pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (G.pinchDist > 0) {
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      zoomAt(mid.x, mid.y, d / G.pinchDist);
    }
    G.pinchDist = d;
    return;
  }
  if (dragState) {
    const dx = ev.movementX ?? 0, dy = ev.movementY ?? 0;
    dragState.moved = (dragState.moved || 0) + Math.abs(dx) + Math.abs(dy);
    if (dragState.type === 'pan') {
      G.tx = dragState.tx + (ev.clientX - dragState.sx);
      G.ty = dragState.ty + (ev.clientY - dragState.sy);
    } else if (dragState.type === 'node' && dragState.moved > 3) {
      const p = screenToWorld(ev.clientX, ev.clientY);
      dragState.node.x = p.x; dragState.node.y = p.y;
      dragState.node.vx = dragState.node.vy = 0;
      G.alpha = Math.max(G.alpha, 0.5);
    }
    return;
  }
  // hover
  const node = nodeAt(ev.clientX, ev.clientY);
  if ((node?.id || null) !== (G.hover || null)) {
    G.hover = node ? node.id : null;
    canvas.style.cursor = node ? 'pointer' : 'grab';
  }
});

canvas.addEventListener('pointerup', ev => {
  G.pointers.delete(ev.pointerId);
  canvas.classList.remove('is-dragging');
  if (dragState && dragState.moved !== undefined && dragState.moved < 4) {
    if (dragState.type === 'node') openNode(dragState.node.id);
    else closePanel();
  }
  dragState = null;
  G.pinchDist = 0;
});
canvas.addEventListener('pointercancel', ev => { G.pointers.delete(ev.pointerId); dragState = null; });

canvas.addEventListener('wheel', ev => {
  ev.preventDefault();
  zoomAt(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1.12 : 0.89);
}, { passive: false });

function centerOnNode(id, k = 1.15) {
  const node = G.nodes.find(x => x.id === id);
  if (!node) return;
  G.k = k;
  G.tx = -node.x * k;
  G.ty = -node.y * k;
  G.alpha = Math.max(G.alpha, 0.6);
}

/* ================================================================
   PAINEL LATERAL
================================================================ */
const panel = $('#node-panel');

function openNode(id) {
  const node = byId.get(id);
  if (!node) return;
  G.selected = id;
  const color = CLUSTER_COLORS[node.cluster] || '#94a3b8';
  const pc = $('#panel-cluster');
  pc.innerHTML = `<span class="dot" style="background:${color};box-shadow:0 0 8px ${color}"></span>${esc(node.cluster)}`;
  pc.style.color = color;
  pc.style.borderColor = color + '55';
  $('#panel-title').textContent = node.title;
  const meta = [];
  if (node.date) meta.push(node.date);
  if (node.tipo) meta.push('tipo: ' + node.tipo);
  if (node.escopo) meta.push('escopo: ' + node.escopo);
  meta.push(node.id);
  $('#panel-meta').textContent = meta.join('  ·  ');
  $('#panel-summary').textContent = node.summary || '';
  $('#panel-md').innerHTML = node.kind === 'script'
    ? `<pre><code>${esc(node.body || '')}</code></pre>`
    : mdToHtml(node.body || '');

  const bl = backlinks.get(id) || [];
  const blEl = $('#panel-backlinks');
  blEl.innerHTML = bl.length
    ? bl.map(src => {
        const s = byId.get(src);
        return `<li><button data-node="${esc(src)}" title="${esc(src)}">← ${esc(s ? s.title : src)}</button></li>`;
      }).join('')
    : '<li class="empty">Nenhum documento aponta para cá ainda.</li>';

  $('#btn-open-file').onclick = () => window.open('../' + id.split('/').map(encodeURIComponent).join('/'), '_blank');
  panel.hidden = false;
}

function closePanel() {
  panel.hidden = true;
  G.selected = null;
}
$('#panel-close').addEventListener('click', closePanel);

// cliques em links internos do painel (delegação)
panel.addEventListener('click', ev => {
  const a = ev.target.closest('[data-node]');
  if (a) { ev.preventDefault(); openNode(a.dataset.node); }
});

/* ================================================================
   BUSCA
================================================================ */
const searchInput = $('#search');
const searchResults = $('#search-results');
let searchSel = -1;

function searchNodes(q) {
  const query = q.toLowerCase().trim();
  if (!query) return [];
  return NODES
    .map(n => {
      const t = n.title.toLowerCase(), i = n.id.toLowerCase();
      let score = 0;
      if (t.startsWith(query)) score = 100;
      else if (t.includes(query)) score = 60;
      else if (i.includes(query)) score = 40;
      else if ((n.summary || '').toLowerCase().includes(query)) score = 20;
      return { n, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || b.n.deg - a.n.deg)
    .map(r => r.n);
}

function renderSearchResults(q) {
  const found = searchNodes(q).slice(0, 8);
  G.query = q.trim();
  searchSel = -1;
  if (!q.trim() || !found.length) { searchResults.hidden = true; searchResults.innerHTML = ''; return; }
  searchResults.innerHTML = found.map((n, i) => {
    const c = CLUSTER_COLORS[n.cluster];
    return `<button role="option" data-i="${i}" data-id="${esc(n.id)}"><span class="dot" style="background:${c}"></span><span>${esc(n.title)}</span><small>${n.deg}🔗</small></button>`;
  }).join('');
  searchResults.hidden = false;
  searchResults._found = found;
}

searchInput.addEventListener('input', () => renderSearchResults(searchInput.value));
searchInput.addEventListener('keydown', ev => {
  const found = searchResults._found || [];
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
    ev.preventDefault();
    if (!found.length) return;
    searchSel = (searchSel + (ev.key === 'ArrowDown' ? 1 : -1) + found.length) % found.length;
    [...searchResults.children].forEach((el, i) => el.classList.toggle('is-sel', i === searchSel));
  } else if (ev.key === 'Enter') {
    const target = found[searchSel >= 0 ? searchSel : 0];
    if (target) {
      searchResults.hidden = true;
      switchView('graph');
      centerOnNode(target.id);
      openNode(target.id);
    }
  } else if (ev.key === 'Escape') {
    searchResults.hidden = true;
    searchInput.blur();
  }
});
searchResults.addEventListener('click', ev => {
  const btn = ev.target.closest('button[data-id]');
  if (!btn) return;
  searchResults.hidden = true;
  switchView('graph');
  centerOnNode(btn.dataset.id);
  openNode(btn.dataset.id);
});
document.addEventListener('click', ev => {
  if (!ev.target.closest('.search-box')) searchResults.hidden = true;
});

/* ================================================================
   CONTADORES POR CLUSTER + LEGENDA
================================================================ */
const clusterBar = $('#cluster-bar');
DATA.clusters.forEach(c => {
  const count = NODES.filter(n => n.cluster === c).length;
  const color = CLUSTER_COLORS[c];
  const pill = document.createElement('button');
  pill.className = 'cluster-pill';
  pill.innerHTML = `<span class="dot" style="background:${color};color:${color}"></span>${esc(c)} <b>${count}</b>`;
  pill.setAttribute('aria-label', `Destacar cluster ${c}`);
  pill.addEventListener('click', () => {
    const on = G.clusterFilter === c;
    G.clusterFilter = on ? null : c;
    [...clusterBar.children].forEach(el => el.classList.remove('is-active'));
    if (!on) pill.classList.add('is-active');
    G.alpha = Math.max(G.alpha, 0.5);
  });
  clusterBar.appendChild(pill);
});

$('#legend').innerHTML = DATA.clusters.map(c => {
  const color = CLUSTER_COLORS[c];
  return `<div class="lg-item"><span class="dot" style="background:${color};color:${color}"></span>${esc(c)}</div>`;
}).join('');

$('#meta-line').textContent =
  `${NODES.length} documentos · ${EDGES.length} conexões · gerado em ${DATA.generatedAt.slice(0, 10).split('-').reverse().join('/')}`;

/* ================================================================
   FLUXO SYNAPSE
================================================================ */
const STAGES = [
  {
    key: 'commit', cls: 'st-io', tag: 'entrada', title: 'git commit',
    desc: 'Você commita o trabalho normalmente. É o único passo humano de todo o pipeline.',
    detail: 'A partir daqui tudo é automático. O commit em si mede menos de 1 segundo — o SYNAPSE nunca atrasa o seu fluxo de trabalho, porque todo o processamento acontece em um processo separado e assíncrono.',
    points: ['Disparo natural do fluxo de trabalho', 'Zero fricção: nenhum comando extra'],
  },
  {
    key: 'hook', cls: '', tag: 'hook · <1s', title: 'post-commit hook',
    desc: 'Coleta hash, autor, data, mensagem e diff --stat num JSON e dispara o orquestrador.',
    detail: 'O hook `automation/hooks/post-commit` guarda os metadados do commit em `.git/synapse-<hash>.json`, aplica os guards de idempotência (entrada `*-<hash>.md` já existe?) e concorrência (lockfile com PID), e chama `synapse.sh` detached via `nohup … &`. Qualquer falha aqui resulta em `exit 0` silencioso: o commit nunca espera a IA.',
    points: ['Assíncrono: nunca bloqueia o commit', 'Idempotente: um hash nunca gera duas entradas', 'Lock de concorrência com recuperação de lock morto'],
    node: 'automation/hooks/post-commit',
  },
  {
    key: 'orch', cls: '', tag: 'orquestrador', title: 'synapse.sh',
    desc: 'Orquestrador com lockfile: verifica configuração e invoca os dois agentes Kimi em sequência.',
    detail: '`automation/synapse.sh` lê `automation/config.env` (`KIMI_BIN`, `SYNAPSE_DISABLE`, `SYNAPSE_AUTO_COMMIT`), valida o binário do Kimi e invoca `kimi -p --agent-file` duas vezes com CWD na raiz do repo, passando o contrato por variáveis de ambiente (`SYNAPSE_REPO`, `SYNAPSE_COMMIT_JSON`, `SYNAPSE_HASH`). Se a IA falhar, um fallback determinístico em shell grava a entrada básica mesmo assim.',
    points: ['Precedência: config.env > ambiente > padrões', 'Fallback determinístico sem IA', 'Logs em .git/synapse.log'],
    node: 'automation/synapse.sh',
  },
  {
    key: 'classify', cls: 'st-agent', tag: 'agente kimi · 1', title: 'Agente classificador',
    desc: 'Lê o diff real do commit e classifica: tipo, impacto, breaking, risco de regressão.',
    detail: 'O agente `synapse-classify` (prompt `automation/prompts/classify-commit.agent.md`) executa `git show` do commit — nunca classifica só pela mensagem, porque a mensagem é um chute e o diff é a verdade. Ele grava a análise completa em `changelog/entries/<data>-<hash>.md` com frontmatter estruturado e uma nota pronta para o cliente em linguagem leiga.',
    points: ['Classificação baseada no diff, não na mensagem', 'Schema: tipo, escopo, impacto, breaking, risco', 'Nota para o cliente sem jargão em cada entrada'],
    node: 'automation/prompts/classify-commit.agent.md',
  },
  {
    key: 'changelog', cls: 'st-io', tag: 'artefatos', title: 'changelog/entries + CHANGELOG.md',
    desc: 'Cada commit vira uma entrada analisada; o índice consolidado fica sempre com o mais novo no topo.',
    detail: 'As entradas em `changelog/entries/` guardam o frontmatter YAML (hash, data, autor, tipo, impacto, breaking, risco) e as seções Resumo técnico / Análise / Nota para o cliente / Recomendações. O `changelog/CHANGELOG.md` recebe uma linha por commit, imediatamente após o título, mais novo no topo.',
    points: ['Histórico pesquisável por commit', 'Índice consolidado sem duplicatas', 'Pronto para relatório e para o cliente'],
    node: 'changelog/CHANGELOG.md',
  },
  {
    key: 'report', cls: 'st-agent', tag: 'agente kimi · 2', title: 'Agente de relatório',
    desc: 'Consolida as entradas recentes e reescreve o relatório vivo do brain.',
    detail: 'O agente `synapse-report` (prompt `automation/prompts/generate-report.agent.md`) lê as entradas do changelog e reescreve `reports/latest.md` com as seções fixas: Entregues / Em andamento / Próximos passos / Notas técnicas — em linguagem técnica para a equipe de engenharia.',
    points: ['Relatório sempre fresco, sem trabalho manual', 'Visão consolidada do ciclo de entregas', 'Seções fixas: fácil de escanear'],
    node: 'automation/prompts/generate-report.agent.md',
  },
  {
    key: 'latest', cls: 'st-io', tag: 'artefato', title: 'reports/latest.md',
    desc: 'O relatório vivo do brain — o que foi entregue, o que está em andamento e o que vem a seguir.',
    detail: '`reports/latest.md` é a fonte rápida para responder "o que mudou no brain?". É reescrito a cada commit pelo agente de relatório e consumido pela equipe (e pela Luna) como memória de curto prazo das entregas.',
    points: ['Atualizado automaticamente a cada commit', 'Linguagem técnica para a equipe'],
    node: 'reports/latest.md',
  },
  {
    key: 'autocommit', cls: 'st-io', tag: 'auto-commit', title: 'Auto-commit [synapse]',
    desc: 'O orquestrador commita os artefatos gerados com a marca [synapse] — opcional, ativo por padrão.',
    detail: 'Com `SYNAPSE_AUTO_COMMIT=1` (padrão), o orquestrador commita `changelog/entries/`, `CHANGELOG.md` e `reports/latest.md` com a mensagem `chore(synapse): registro do commit <hash> [synapse]`. Com `SYNAPSE_AUTO_COMMIT=0` os artefatos ficam no working tree para revisão humana — nesse caso, o agente humano NÃO deve commitá-los manualmente: eles são do SYNAPSE.',
    points: ['Marca [synapse] identifica commits de máquina', 'Desligável via SYNAPSE_AUTO_COMMIT=0', 'Artefatos nunca misturados com código manual'],
  },
  {
    key: 'loop', cls: 'st-loop', tag: 'loop seguro', title: 'Volta ao hook — sem loop infinito',
    desc: 'O hook ignora qualquer commit cuja mensagem contenha [synapse]. O ciclo se fecha em segurança.',
    detail: 'Como o auto-commit também é um `git commit`, ele dispararia o hook de novo — se não fosse o guard: o `post-commit` verifica a mensagem e ignora commits `[synapse]`. Resultado: pipeline contínuo, zero loops infinitos, zero ruído no changelog.',
    points: ['Guard simples e à prova de falhas', 'Changelog sem auto-referência', 'Pipeline contínuo e silencioso'],
  },
];

function buildFluxo() {
  const wrap = $('#fluxo-wrap');
  const stagesEl = $('#fluxo-stages');
  stagesEl.innerHTML = STAGES.map((s, i) => `
    <article class="stage ${s.cls}" data-key="${s.key}" style="animation-delay:${i * 70}ms" tabindex="0" role="button" aria-label="Etapa ${i + 1}: ${esc(s.title)}">
      <span class="st-index">ETAPA ${i + 1}</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.desc)}</p>
      <span class="st-tag">${s.tag}</span>
    </article>`).join('');

  const detail = $('#fluxo-detail');
  function selectStage(key) {
    const s = STAGES.find(x => x.key === key);
    if (!s) return;
    [...stagesEl.children].forEach(el => el.classList.toggle('is-active', el.dataset.key === key));
    detail.innerHTML = `
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.detail)}</p>
      <ul>${s.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
      ${s.node ? `<div class="fd-actions"><button data-node="${esc(s.node)}">Ver no grafo →</button></div>` : ''}`;
    detail.hidden = false;
    detail.querySelector('[data-node]')?.addEventListener('click', ev => {
      switchView('graph');
      centerOnNode(ev.currentTarget.dataset.node);
      openNode(ev.currentTarget.dataset.node);
    });
  }
  stagesEl.addEventListener('click', ev => {
    const st = ev.target.closest('.stage');
    if (st) selectStage(st.dataset.key);
  });
  stagesEl.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      const st = ev.target.closest('.stage');
      if (st) { ev.preventDefault(); selectStage(st.dataset.key); }
    }
  });
  selectStage('commit');
}

function layoutFluxoPipes() {
  if (window.innerWidth <= 940) return;
  const wrap = $('#fluxo-wrap');
  const svg = $('#fluxo-svg');
  const stages = [...wrap.querySelectorAll('.stage')];
  if (!stages.length) return;
  const wr = wrap.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${wr.width} ${wr.height}`);
  const pts = stages.map(el => {
    const r = el.getBoundingClientRect();
    return {
      bottom: { x: r.left - wr.left + r.width / 2, y: r.bottom - wr.top },
      top: { x: r.left - wr.left + r.width / 2, y: r.top - wr.top },
      right: { x: r.right - wr.left, y: r.top - wr.top + r.height / 2 },
      left: { x: r.left - wr.left, y: r.top - wr.top + r.height / 2 },
    };
  });
  const path = (a, b) => {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
  };
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const sameCol = Math.abs(a.bottom.x - b.top.x) < 10;
    d += `<path id="fp${i}" class="pipe" d="${sameCol ? path(a.bottom, b.top) : path(a.bottom, b.top)}"/>`;
  }
  // loop de volta: última etapa → margem direita → primeira etapa
  const last = pts[pts.length - 1], first = pts[0];
  const lx = wr.width + 4;
  d += `<path id="floop" class="pipe-loop" d="M ${last.right.x} ${last.right.y} H ${lx} V ${first.right.y} H ${first.right.x}"/>`;

  let pulses = '';
  const npipes = pts.length - 1;
  for (let i = 0; i < npipes; i++) {
    pulses += `<circle class="pulse" r="3.6"><animateMotion dur="${2.4 + i * 0.22}s" begin="${i * 0.3}s" repeatCount="indefinite"><mpath href="#fp${i}"/></animateMotion></circle>`;
  }
  pulses += `<circle class="pulse" r="3.2" fill="#6ee7b7" style="fill:#6ee7b7"><animateMotion dur="4s" begin="1s" repeatCount="indefinite"><mpath href="#floop"/></animateMotion></circle>`;

  svg.innerHTML = `
    <defs><linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#3b82f6"/><stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient></defs>${d}${pulses}`;
}

/* ================================================================
   LINHA DO TEMPO
================================================================ */
function buildTimeline() {
  const list = $('#timeline-list');
  const entries = NODES
    .filter(n => n.cluster === 'Changelog' && n.tipo)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (!entries.length) {
    list.innerHTML = `<div class="tl-empty">Nenhuma entrada de changelog ainda.<br>As entradas do SYNAPSE aparecem aqui assim que os primeiros commits forem classificados.</div>`;
    return;
  }
  list.innerHTML = entries.map((n, i) => {
    const color = TIPO_COLORS[n.tipo] || '#94a3b8';
    const data = n.date || '—';
    return `
    <div class="tl-item" data-id="${esc(n.id)}" style="animation-delay:${i * 90}ms" tabindex="0" role="button" aria-label="Abrir ${esc(n.title)}">
      <div class="tl-date">${data.split('-').reverse().join('/')}</div>
      <div class="tl-dot" style="background:${color};color:${color};outline-color:${color}26"></div>
      <div class="tl-card">
        <span class="tl-type" style="background:${color}1f;color:${color};border:1px solid ${color}44">${esc(n.tipo)}${n.escopo ? ' · ' + esc(n.escopo) : ''}</span>
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.summary || '')}</p>
        <span class="tl-id">${esc(n.id)}</span>
      </div>
    </div>`;
  }).join('');

  list.addEventListener('click', ev => {
    const item = ev.target.closest('.tl-item');
    if (!item) return;
    switchView('graph');
    centerOnNode(item.dataset.id);
    openNode(item.dataset.id);
  });
}

/* ================================================================
   NAVEGAÇÃO (abas + hash) + BOTÕES
================================================================ */
const VIEWS = ['graph', 'fluxo', 'timeline'];
function switchView(view) {
  if (!VIEWS.includes(view)) view = 'graph';
  document.querySelectorAll('.tab').forEach(t => {
    const on = t.dataset.view === view;
    t.classList.toggle('is-active', on);
    t.setAttribute('aria-selected', String(on));
  });
  document.querySelectorAll('.view').forEach(v => v.classList.remove('is-active'));
  $(`#view-${view}`).classList.add('is-active');
  if (location.hash !== `#/${view}`) history.replaceState(null, '', `#/${view}`);
  if (view === 'fluxo') requestAnimationFrame(layoutFluxoPipes);
  if (view === 'graph') requestAnimationFrame(() => { resizeCanvas(); });
}
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchView(t.dataset.view)));
window.addEventListener('hashchange', () => switchView(location.hash.replace('#/', '')));

$('#btn-recenter').addEventListener('click', () => {
  fitGraph();
  G.alpha = 1;
  closePanel();
});
$('#btn-physics').addEventListener('click', ev => {
  G.physics = !G.physics;
  const btn = ev.currentTarget;
  btn.classList.toggle('is-on', G.physics);
  btn.setAttribute('aria-pressed', String(G.physics));
  btn.title = G.physics ? 'Pausar física do grafo' : 'Retomar física do grafo';
  if (G.physics) G.alpha = 1;
});

// esconde a dica de navegação após interagir
canvas.addEventListener('pointerdown', () => $('#graph-hint').classList.add('is-hidden'), { once: true });
canvas.addEventListener('wheel', () => $('#graph-hint').classList.add('is-hidden'), { once: true });

/* ================================================================
   BOOT
================================================================ */
buildFluxo();
buildTimeline();
// deep-link: #/graph?node=<id> abre direto o documento no painel
// (capturado antes do switchView, que reescreve o hash)
const deepNode = location.hash.match(/[?&]node=([^&]+)/);
switchView((location.hash.replace('#/', '') || 'graph').split('?')[0]);
resizeCanvas();
// pré-aquece a física para o primeiro frame já nascer estabilizado
for (let i = 0; i < 300; i++) physicsTick();
fitGraph();
requestAnimationFrame(loop);
setTimeout(layoutFluxoPipes, 120);
if (deepNode) {
  const id = decodeURIComponent(deepNode[1]);
  if (byId.has(id)) {
    centerOnNode(id, 1.0);
    openNode(id);
  }
}
