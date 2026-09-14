// Engine do grafo: física própria (repulsão + molas + gravidade) + renderização
// em canvas único (nós, arestas, halos, partículas). Adaptado do app.js vanilla.
import type { AtlasIndex, AtlasNode } from '../data';
import { clusterColor } from '../data';

export interface GraphNode extends AtlasNode {
  x: number; y: number; vx: number; vy: number;
  phase: number; // fase da "respiração"
}

export interface EngineEvents {
  onOpenNode: (id: string) => void;
  onHover: (id: string | null) => void;
}

interface Particle { x: number; y: number; r: number; speed: number; drift: number; alpha: number; }

const REP = 4600, REST = 130, SPRING = 0.028, GRAV = 0.016, DAMP = 0.86;
const HUB_DEG = 8;

export class GraphEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private index: AtlasIndex;
  private events: EngineEvents;
  private dpr = Math.min(window.devicePixelRatio || 1, 2);

  nodes: GraphNode[];
  private nodeById = new Map<string, GraphNode>();
  private edges: { source: string; target: string }[];
  private particles: Particle[] = [];
  private clusterCentroids = new Map<string, { x: number; y: number; n: number }>();

  private k = 1; private tx = 0; private ty = 0;
  private alpha = 1;
  private hover: string | null = null;
  private selected: string | null = null;
  private physics = true;
  private disposed = false;
  private raf = 0;
  private time = 0;
  private centroidsTick = 0;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  clusterFilter: string | null = null;
  query = '';

  private pointers = new Map<number, { x: number; y: number }>();
  private pinchDist = 0;
  private dragState: null | {
    type: 'pan' | 'node' | 'pinch';
    moved: number;
    sx?: number; sy?: number; tx0?: number; ty0?: number;
    node?: GraphNode;
  } = null;

  constructor(canvas: HTMLCanvasElement, index: AtlasIndex, events: EngineEvents) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.index = index;
    this.events = events;
    this.nodes = index.data.nodes.map((n, i) => ({
      ...n,
      x: Math.cos(i * 2.399) * (140 + i * 2.2),
      y: Math.sin(i * 2.399) * (140 + i * 2.2),
      vx: 0, vy: 0,
      phase: (i * 0.6180339887) % (Math.PI * 2),
    }));
    for (const n of this.nodes) this.nodeById.set(n.id, n);
    this.edges = index.data.edges.filter(e => this.nodeById.has(e.source) && this.nodeById.has(e.target));
    this.initParticles();
    this.bind();
    // pré-aquecimento: o primeiro frame já nasce estabilizado
    const warm = this.reducedMotion ? 120 : 300;
    for (let i = 0; i < warm; i++) this.physicsTick();
    this.fit();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  /* ---------------- API pública ---------------- */

  resize() {
    const r = this.canvas.parentElement!.getBoundingClientRect();
    this.canvas.width = Math.max(1, r.width * this.dpr);
    this.canvas.height = Math.max(1, r.height * this.dpr);
  }

  fit(margin = 0.82) {
    const r = this.canvas.parentElement!.getBoundingClientRect();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of this.nodes) {
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
    }
    const bw = Math.max(maxX - minX, 1), bh = Math.max(maxY - minY, 1);
    this.k = Math.max(0.3, Math.min(Math.min(r.width / bw, r.height / bh) * margin, 1.5));
    this.tx = -((minX + maxX) / 2) * this.k;
    this.ty = -((minY + maxY) / 2) * this.k;
  }

  centerOnNode(id: string, k = 1.15) {
    const n = this.nodeById.get(id);
    if (!n) return;
    this.k = k;
    this.tx = -n.x * k;
    this.ty = -n.y * k;
    this.alpha = Math.max(this.alpha, 0.6);
  }

  setSelected(id: string | null) { this.selected = id; }
  getSelected() { return this.selected; }

  setPhysics(on: boolean) {
    this.physics = on;
    if (on) this.alpha = 1;
  }
  getPhysics() { return this.physics; }

  reheat() { this.alpha = Math.max(this.alpha, 0.6); }

  focusNode(id: string | null) {
    this.selected = id;
    if (id) this.centerOnNode(id, Math.max(this.k, 1.0));
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.unbind();
  }

  /* ---------------- física ---------------- */

  private physicsTick() {
    const ns = this.nodes;
    const n = ns.length;
    this.alpha = Math.max(0.12, this.alpha * 0.995);

    for (let i = 0; i < n; i++) {
      const a = ns[i];
      for (let j = i + 1; j < n; j++) {
        const b = ns[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = Math.random() - .5; dy = Math.random() - .5; d2 = 1; }
        const d = Math.sqrt(d2);
        const f = Math.min(REP / d2, 14) * this.alpha;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      }
    }
    for (const e of this.edges) {
      const na = this.nodeById.get(e.source)!, nb = this.nodeById.get(e.target)!;
      const dx = nb.x - na.x, dy = nb.y - na.y;
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const f = (d - REST) * SPRING;
      na.vx += (dx / d) * f; na.vy += (dy / d) * f;
      nb.vx -= (dx / d) * f; nb.vy -= (dy / d) * f;
    }
    for (const node of ns) {
      node.vx -= node.x * GRAV * this.alpha;
      node.vy -= node.y * GRAV * this.alpha;
      node.vx *= DAMP; node.vy *= DAMP;
      const sp = Math.hypot(node.vx, node.vy);
      if (sp > 9) { node.vx = node.vx / sp * 9; node.vy = node.vy / sp * 9; }
      node.x += node.vx * this.alpha;
      node.y += node.vy * this.alpha;
    }
  }

  /* ---------------- render ---------------- */

  private nodeRadius(node: GraphNode): number {
    return 4 + Math.min(11, node.deg * 1.15);
  }

  private matchesFilter(node: GraphNode): boolean {
    if (this.clusterFilter && node.cluster !== this.clusterFilter) return false;
    if (this.query) {
      const q = this.query.toLowerCase();
      return node.title.toLowerCase().includes(q) || node.id.toLowerCase().includes(q) ||
        (node.summary || '').toLowerCase().includes(q);
    }
    return true;
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * 2000 - 1000, y: Math.random() * 1400 - 700,
        r: 0.6 + Math.random() * 1.8,
        speed: 0.05 + Math.random() * 0.16,
        drift: Math.random() * Math.PI * 2,
        alpha: 0.05 + Math.random() * 0.16,
      });
    }
  }

  private updateCentroids() {
    this.clusterCentroids.clear();
    for (const n of this.nodes) {
      const c = this.clusterCentroids.get(n.cluster) || { x: 0, y: 0, n: 0 };
      c.x += n.x; c.y += n.y; c.n++;
      this.clusterCentroids.set(n.cluster, c);
    }
    for (const c of this.clusterCentroids.values()) { c.x /= c.n; c.y /= c.n; }
  }

  private drawParticles(w: number, h: number, toX: (x: number) => number, toY: (y: number) => number) {
    const ctx = this.ctx;
    const t = this.time * 0.016;
    ctx.save();
    for (const p of this.particles) {
      const px = ((p.x + this.tx * 0.12 + Math.sin(t * p.speed * 6 + p.drift) * 30) % (w + 80)) - 40;
      const py = ((p.y + this.ty * 0.12 + Math.cos(t * p.speed * 5 + p.drift) * 24) % (h + 80)) - 40;
      const wrappedX = px < -40 ? px + w + 80 : px;
      const wrappedY = py < -40 ? py + h + 80 : py;
      const tw = 0.7 + 0.3 * Math.sin(t * 2 + p.drift * 3);
      ctx.globalAlpha = p.alpha * tw;
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.arc(wrappedX, wrappedY, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawClusterHalos(toX: (x: number) => number, toY: (y: number) => number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [cluster, c] of this.clusterCentroids) {
      const color = clusterColor(cluster);
      const r = 60 + Math.min(130, c.n * 9);
      const x = toX(c.x), y = toY(c.y);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color + '14');
      g.addColorStop(1, color + '00');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawGraph() {
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const toX = (x: number) => x * this.k + w / 2 + this.tx;
    const toY = (y: number) => y * this.k + h / 2 + this.ty;

    this.drawParticles(w, h, toX, toY);
    this.drawClusterHalos(toX, toY);

    const hasFocus = !!(this.hover || this.selected || this.query || this.clusterFilter);
    const focusId = this.hover || this.selected;
    let focusSet: Set<string> | null = null;
    if (focusId) {
      focusSet = new Set([focusId]);
      (this.index.adj.get(focusId) || []).forEach(t => focusSet!.add(t));
    }

    // arestas curvas (quadráticas) com halo sutil + núcleo colorido por peso
    const breathe = this.reducedMotion ? 0 : Math.sin(this.time * 0.0011) * 0.5 + 0.5;
    ctx.lineCap = 'round';
    for (const e of this.edges) {
      const a = this.nodeById.get(e.source)!, b = this.nodeById.get(e.target)!;
      const ax = toX(a.x), ay = toY(a.y), bx = toX(b.x), by = toY(b.y);
      if ((ax < -60 && bx < -60) || (ax > w + 60 && bx > w + 60) ||
          (ay < -60 && by < -60) || (ay > h + 60 && by > h + 60)) continue;

      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const nx = -(by - ay), ny = (bx - ax);
      const len = Math.hypot(nx, ny) || 1;
      const off = Math.min(14, len * 0.08);
      const cx = mx + (nx / len) * off, cy = my + (ny / len) * off;

      let alpha = 0.2;
      let focusedEdge = false;
      if (focusSet) {
        focusedEdge = focusSet.has(e.source) && focusSet.has(e.target) &&
          (e.source === focusId || e.target === focusId);
        alpha = focusedEdge ? 0.85 : 0.045;
      } else if (hasFocus) {
        alpha = (this.matchesFilter(a) && this.matchesFilter(b)) ? 0.2 : 0.035;
      }
      const weight = 0.7 + Math.min(1.3, (a.deg + b.deg) * 0.045);
      const ca = clusterColor(a.cluster), cb = clusterColor(b.cluster);

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cx, cy, bx, by);
      ctx.strokeStyle = `rgba(139,92,246,${(alpha * 0.35).toFixed(3)})`;
      ctx.lineWidth = (focusedEdge ? 4.5 : 3) * weight;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cx, cy, bx, by);
      ctx.strokeStyle = hexWithAlpha(focusedEdge ? cb : '#94a3b8', alpha);
      ctx.lineWidth = (focusedEdge ? 1.8 : 1) * weight;
      ctx.stroke();

      if (focusedEdge) {
        const t = (this.time * 0.00035 + a.phase) % 1;
        const px = quad(ax, cx, bx, t), py = quad(ay, cy, by, t);
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#e0e7ff';
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // nós
    const placedLabels: { x: number; y: number; w: number; h: number }[] = [];
    for (const node of this.nodes) {
      const r = this.nodeRadius(node) * (0.75 + this.k * 0.25);
      const x = toX(node.x), y = toY(node.y);
      if (x < -40 || y < -40 || x > w + 40 || y > h + 40) continue;

      let alpha = 1;
      if (focusSet) alpha = focusSet.has(node.id) ? 1 : 0.12;
      else if (hasFocus) alpha = this.matchesFilter(node) ? 1 : 0.14;
      const dimmed = alpha < 0.5;

      const color = clusterColor(node.cluster);
      const isHub = node.deg >= HUB_DEG;
      const isFocus = node.id === focusId;
      const breatheA = isHub && !dimmed && !this.reducedMotion
        ? 0.85 + 0.15 * Math.sin(this.time * 0.0016 + node.phase * 4)
        : 1;

      ctx.save();
      ctx.globalAlpha = alpha * breatheA;

      // glow radial por cluster
      if (!dimmed) {
        const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.2);
        g.addColorStop(0, hexWithAlpha(color, isHub ? 0.5 : 0.32));
        g.addColorStop(1, hexWithAlpha(color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = dimmed ? 0 : isHub ? 18 : 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // núcleo branco suave
      ctx.beginPath();
      ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();

      // anel nos hubs (deg alto) — tracejado girando devagar
      if (isHub && !dimmed) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.reducedMotion ? 0 : this.time * 0.0004 + node.phase);
        ctx.beginPath();
        ctx.setLineDash([4, 7]);
        ctx.arc(0, 0, r + 4.5, 0, Math.PI * 2);
        ctx.strokeStyle = hexWithAlpha(color, 0.75);
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      // anel de foco
      if (isFocus) {
        const fr = r + 8 + (this.reducedMotion ? 0 : Math.sin(this.time * 0.004) * 1.5);
        ctx.beginPath();
        ctx.arc(x, y, fr, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.restore();

      // rótulo: visibilidade por zoom/grau + anti-colisão
      const showLabel =
        isFocus ||
        (node.deg >= 8 && this.k > 0.45) ||
        (node.deg >= 4 && this.k > 0.7) ||
        this.k > 1.05;
      if (showLabel) {
        const la = dimmed ? 0.1 : Math.max(0.2, Math.min(1, 0.35 + (this.k - 0.6) * 1.6 + node.deg * 0.02));
        ctx.globalAlpha = la;
        ctx.font = `${node.deg >= 5 ? 600 : 400} ${node.deg >= 5 ? 12 : 10.5}px "Space Grotesk", Inter, "Segoe UI", sans-serif`;
        ctx.fillStyle = isFocus ? '#fff' : '#cbd5e1';
        ctx.textAlign = 'center';
        const label = node.title.length > 34 ? node.title.slice(0, 33) + '…' : node.title;
        const tw = ctx.measureText(label).width;
        const box = { x: x - tw / 2 - 3, y: y + r + 3, w: tw + 6, h: 14 };
        const collides = placedLabels.some(b =>
          box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y);
        if (!collides || isFocus) {
          placedLabels.push(box);
          ctx.fillText(label, x, y + r + 13);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  private loop() {
    if (this.disposed) return;
    this.time = performance.now();
    if (this.physics && !this.reducedMotion) this.physicsTick();
    if (++this.centroidsTick % 12 === 0) this.updateCentroids();
    this.drawGraph();
    this.raf = requestAnimationFrame(this.loop);
  }

  /* ---------------- interação ---------------- */

  private screenToWorld(px: number, py: number) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (px - r.left - r.width / 2 - this.tx) / this.k,
      y: (py - r.top - r.height / 2 - this.ty) / this.k,
    };
  }

  private nodeAt(px: number, py: number): GraphNode | null {
    const r = this.canvas.getBoundingClientRect();
    let best: GraphNode | null = null, bestD = 20;
    for (const node of this.nodes) {
      const x = node.x * this.k + r.width / 2 + this.tx;
      const y = node.y * this.k + r.height / 2 + this.ty;
      const d = Math.hypot(px - r.left - x, py - r.top - y) - this.nodeRadius(node) * this.k;
      if (d < bestD) { bestD = d; best = node; }
    }
    return best;
  }

  private zoomAt(px: number, py: number, factor: number) {
    const r = this.canvas.getBoundingClientRect();
    const cx = px - r.left - r.width / 2, cy = py - r.top - r.height / 2;
    const k2 = Math.max(0.22, Math.min(this.k * factor, 3.2));
    this.tx = cx - (cx - this.tx) * (k2 / this.k);
    this.ty = cy - (cy - this.ty) * (k2 / this.k);
    this.k = k2;
  }

  private onPointerDown = (ev: PointerEvent) => {
    this.canvas.setPointerCapture(ev.pointerId);
    this.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      this.dragState = { type: 'pinch', moved: 0 };
      return;
    }
    const node = this.nodeAt(ev.clientX, ev.clientY);
    this.dragState = node
      ? { type: 'node', node, moved: 0 }
      : { type: 'pan', moved: 0, sx: ev.clientX, sy: ev.clientY, tx0: this.tx, ty0: this.ty };
    this.canvas.classList.add('is-dragging');
  };

  private onPointerMove = (ev: PointerEvent) => {
    if (this.pointers.has(ev.pointerId)) this.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

    if (this.dragState?.type === 'pinch' && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinchDist > 0) {
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        this.zoomAt(mid.x, mid.y, d / this.pinchDist);
      }
      this.pinchDist = d;
      return;
    }
    if (this.dragState) {
      const dx = ev.movementX ?? 0, dy = ev.movementY ?? 0;
      this.dragState.moved += Math.abs(dx) + Math.abs(dy);
      if (this.dragState.type === 'pan') {
        this.tx = this.dragState.tx0! + (ev.clientX - this.dragState.sx!);
        this.ty = this.dragState.ty0! + (ev.clientY - this.dragState.sy!);
      } else if (this.dragState.type === 'node' && this.dragState.moved > 3 && this.dragState.node) {
        const p = this.screenToWorld(ev.clientX, ev.clientY);
        this.dragState.node.x = p.x; this.dragState.node.y = p.y;
        this.dragState.node.vx = this.dragState.node.vy = 0;
        this.alpha = Math.max(this.alpha, 0.5);
      }
      return;
    }
    const node = this.nodeAt(ev.clientX, ev.clientY);
    const id = node ? node.id : null;
    if (id !== this.hover) {
      this.hover = id;
      this.canvas.style.cursor = node ? 'pointer' : 'grab';
      this.events.onHover(id);
    }
  };

  private onPointerUp = (ev: PointerEvent) => {
    this.pointers.delete(ev.pointerId);
    this.canvas.classList.remove('is-dragging');
    if (this.dragState && this.dragState.moved < 4) {
      if (this.dragState.type === 'node' && this.dragState.node) {
        this.events.onOpenNode(this.dragState.node.id);
      }
    }
    this.dragState = null;
    this.pinchDist = 0;
  };

  private onPointerCancel = (ev: PointerEvent) => {
    this.pointers.delete(ev.pointerId);
    this.dragState = null;
  };

  private onWheel = (ev: WheelEvent) => {
    ev.preventDefault();
    this.zoomAt(ev.clientX, ev.clientY, ev.deltaY < 0 ? 1.12 : 0.89);
  };

  private bind() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private unbind() {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }
}

function quad(a: number, c: number, b: number, t: number): number {
  const u = 1 - t;
  return u * u * a + 2 * u * t * c + t * t * b;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}
