import { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { clusterColor, loadAtlasData, type AtlasNode } from '../data';

/**
 * Universo — visão 3D do brain (decreto owner 2026-09-25: "parecer mais um
 * universo"). Nós = estrelas com glow por cluster, links = fios de luz tênues,
 * fundo = starfield com twinkle. Clique abre o mesmo painel do grafo.
 */
export function UniversoView({ active, onOpenNode }: { active: boolean; onOpenNode: (id: string) => void }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);

  // Starfield de fundo
  useEffect(() => {
    const cv = starsRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const resize = () => {
      cv.width = cv.clientWidth * devicePixelRatio;
      cv.height = cv.clientHeight * devicePixelRatio;
    };
    resize();
    const stars = Array.from({ length: 420 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3,
      p: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 1.2,
    }));
    const tick = (t: number) => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const g = ctx.createRadialGradient(cv.width * 0.5, cv.height * 0.6, 0, cv.width * 0.5, cv.height * 0.6, Math.max(cv.width, cv.height) * 0.75);
      g.addColorStop(0, '#0b1226');
      g.addColorStop(0.55, '#070b18');
      g.addColorStop(1, '#04060f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cv.width, cv.height);
      for (const st of stars) {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(st.p + t * 0.0006 * st.s));
        ctx.globalAlpha = a;
        ctx.fillStyle = '#cdd6ff';
        ctx.beginPath();
        ctx.arc(st.x * cv.width, st.y * cv.height, st.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // Grafo 3D
  useEffect(() => {
    if (!active || !holderRef.current) return;
    const holder = holderRef.current;
    const graph = ForceGraph3D()(holder)
      .backgroundColor('#00000000')
      .nodeRelSize(6)
      .nodeOpacity(1)
      .linkOpacity(0.16)
      .linkWidth(0.4)
      .linkDirectionalParticles(0)
      .showNavInfo(false);

    // sprite com glow radial por nó
    const spriteCache = new Map<string, HTMLCanvasElement>();
    const glowSprite = (color: string, size = 64) => {
      const key = color + size;
      let cv = spriteCache.get(key);
      if (!cv) {
        cv = document.createElement('canvas');
        cv.width = cv.height = size * 2;
        const c = cv.getContext('2d')!;
        const g = c.createRadialGradient(size, size, 0, size, size, size);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.25, color);
        g.addColorStop(1, '#00000000');
        c.fillStyle = g;
        c.fillRect(0, 0, size * 2, size * 2);
        spriteCache.set(key, cv);
      }
      const tex = new THREE.Texture(cv);
      tex.needsUpdate = true;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: 2 });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(14, 14, 1);
      return sp;
    };

    // mesma fonte do Grafo 2D: window.ATLAS_DATA (data.js), sem depender da API autenticada
    const data = loadAtlasData();
    const degree = new Map<string, number>();
    for (const e of data.edges) {
      degree.set(e.source, (degree.get(e.source) || 0) + 1);
      degree.set(e.target, (degree.get(e.target) || 0) + 1);
    }
    graph
      .graphData({
        nodes: data.nodes.map((n) => ({
          id: n.id,
          name: n.title,
          color: clusterColor(n.cluster),
          val: 1 + Math.min(6, (degree.get(n.id) || 0) * 0.4),
          raw: n,
        })),
        links: data.edges.map((e) => ({ source: e.source, target: e.target })),
      })
      .nodeThreeObject((node: { color?: string }) => glowSprite(node.color || '#94a3b8'))
      .nodeLabel((n: { name?: string; raw?: AtlasNode }) =>
        `${n.name ?? ''}\n${n.raw?.cluster ?? ''}${n.raw?.summary ? '\n' + n.raw.summary.slice(0, 120) : ''}`)
      .onNodeClick((n: { raw?: AtlasNode }) => {
        if (n.raw) onOpenNode(n.raw.id);
      });
    graph.d3Force('charge')?.strength?.(-160);
    graph.d3Force('link')?.distance?.(42);
    graph.cameraPosition({ x: 0, y: 0, z: 420 });

    return () => { holder.innerHTML = ''; };
  }, [active, onOpenNode]);

  return (
    <div className="view" style={{ overflow: 'hidden', background: '#04060f' }}>
      <canvas ref={starsRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div ref={holderRef} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', left: 14, top: 12, pointerEvents: 'none', color: '#8ea0c9', font: '11px ui-monospace, monospace', letterSpacing: '0.18em' }}>
        UNIVERSO NEXO — arraste pra orbitar · scroll = zoom · clique = abrir
      </div>
    </div>
  );
}
