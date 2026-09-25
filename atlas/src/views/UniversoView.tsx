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
      .showNavInfo(false);

    /* ---------- sprites: glow + núcleo + rótulo ---------- */

    // glow radial (cache do canvas por cor)
    const glowCache = new Map<string, HTMLCanvasElement>();
    const glowTexture = (color: string) => {
      let cv = glowCache.get(color);
      if (!cv) {
        cv = document.createElement('canvas');
        cv.width = cv.height = 128;
        const c = cv.getContext('2d')!;
        const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.18, '#ffffff');
        g.addColorStop(0.4, color);
        g.addColorStop(1, '#00000000');
        c.fillStyle = g;
        c.fillRect(0, 0, 128, 128);
        glowCache.set(color, cv);
      }
      const tex = new THREE.Texture(cv);
      tex.needsUpdate = true;
      return tex;
    };

    // núcleo branco incandescente — faz a estrela "queimar" no centro
    const coreTexture = (() => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 32;
      const c = cv.getContext('2d')!;
      const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.6, 'rgba(255,255,255,0.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 32, 32);
      const tex = new THREE.Texture(cv);
      tex.needsUpdate = true;
      return tex;
    })();

    // rótulo com o título do documento (cache da textura por nome+cor)
    const labelCache = new Map<string, THREE.Texture>();
    const labelTexture = (name: string, color: string) => {
      const key = name + '|' + color;
      let tex = labelCache.get(key);
      if (!tex) {
        const font = '600 26px "Space Grotesk", "Segoe UI", sans-serif';
        const meas = document.createElement('canvas').getContext('2d')!;
        meas.font = font;
        const tw = Math.ceil(meas.measureText(name).width);
        const cv = document.createElement('canvas');
        cv.width = tw + 24;
        cv.height = 44;
        const c = cv.getContext('2d')!;
        c.font = font;
        c.textBaseline = 'middle';
        c.shadowColor = 'rgba(2,6,18,0.95)';
        c.shadowBlur = 10;
        c.fillStyle = '#eef2ff';
        c.fillText(name, 12, 24);
        // filetinho na cor do cluster embaixo do texto
        c.shadowBlur = 0;
        c.fillStyle = color;
        c.globalAlpha = 0.85;
        c.fillRect(12, 38, tw, 3);
        tex = new THREE.Texture(cv);
        tex.needsUpdate = true;
        labelCache.set(key, tex);
      }
      return tex;
    };

    // estrela completa = glow colorido + núcleo branco + rótulo flutuando
    const starObject = (node: { name?: string; color?: string; val?: number }) => {
      const group = new THREE.Group();
      const color = node.color || '#94a3b8';
      const size = 10 + (node.val || 1) * 3.2;

      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      glow.scale.set(size, size, 1);
      group.add(glow);

      const core = new THREE.Sprite(new THREE.SpriteMaterial({
        map: coreTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      core.scale.set(size * 0.38, size * 0.38, 1);
      group.add(core);

      const label = new THREE.Sprite(new THREE.SpriteMaterial({
        map: labelTexture(node.name ?? '', color), transparent: true, depthWrite: false,
        opacity: Math.min(1, 0.5 + (node.val || 1) * 0.07),
      }));
      const h = 3.6 + size * 0.17; // rótulo cresce pouco — evita poluir o centro
      label.scale.set(h * ((label.material.map!.image as HTMLCanvasElement).width / (label.material.map!.image as HTMLCanvasElement).height), h, 1);
      label.position.y = size * 0.5 + h * 0.5 + 1.5;
      group.add(label);
      return group;
    };

    /* ---------- dados (mesma fonte do Grafo 2D) ---------- */
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
          val: 1 + Math.min(7, (degree.get(n.id) || 0) * 0.45),
          raw: n,
        })),
        links: data.edges.map((e) => ({ source: e.source, target: e.target })),
      })
      /* conexões visíveis de verdade: mais grossas, curvadas, com pulso de partículas */
      .linkColor(() => '#7f9cf6')
      .linkOpacity(0.42)
      .linkWidth(0.9)
      .linkCurvature(0.06)
      .linkDirectionalParticles(1)
      .linkDirectionalParticleWidth(2.2)
      .linkDirectionalParticleSpeed(0.004)
      .linkDirectionalParticleColor(() => '#dbe4ff')
      .nodeThreeObject(starObject)
      .nodeLabel((n: { name?: string; raw?: AtlasNode }) =>
        `${n.name ?? ''}\n${n.raw?.cluster ?? ''}${n.raw?.summary ? '\n' + n.raw.summary.slice(0, 120) : ''}`)
      .onNodeHover((node: unknown) => { holder.style.cursor = node ? 'pointer' : 'grab'; })
      .onNodeClick((n: { raw?: AtlasNode }) => {
        if (n.raw) onOpenNode(n.raw.id);
      });
    graph.d3Force('charge')?.strength?.(-150);
    graph.d3Force('link')?.distance?.(55);
    graph.cameraPosition({ x: 0, y: 0, z: 640 });

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
