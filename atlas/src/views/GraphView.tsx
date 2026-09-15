import { useEffect, useRef } from 'react';
import type { AtlasIndex } from '../data';
import { GraphEngine } from '../graph/engine';
import { Legend } from '../components/Legend';
import { HintBar } from '../components/HintBar';
import { NodePanel } from '../components/NodePanel';
import { GraphControls } from '../components/GraphControls';
import type { AtlasNode } from '../data';

export function GraphView({ index, active, clusterFilter, query, physics, selected, onOpenNode, onClosePanel, engineRef }: {
  index: AtlasIndex;
  active: boolean;
  clusterFilter: string | null;
  query: string;
  physics: boolean;
  selected: AtlasNode | null;
  onOpenNode: (id: string) => void;
  onClosePanel: () => void;
  engineRef: React.MutableRefObject<GraphEngine | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // o engine nasce uma única vez; este ref garante que ele sempre chame os
  // handlers atuais (sem isso o toggle de nó usaria selectedId velho)
  const handlersRef = useRef({ onOpenNode, onClosePanel });
  handlersRef.current = { onOpenNode, onClosePanel };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new GraphEngine(canvas, index, {
      onOpenNode: (id) => handlersRef.current.onOpenNode(id),
      onHover: () => { /* reservado: futuro tooltip */ },
      onTapEmpty: () => { if (viewRefSelected()) handlersRef.current.onClosePanel(); },
    });
    engineRef.current = engine;
    engine.resize();

    const resize = () => { engine.resize(); };
    window.addEventListener('resize', resize);
    let ro: ResizeObserver | undefined;
    if (window.ResizeObserver && sectionRef.current) {
      ro = new ResizeObserver(resize);
      ro.observe(sectionRef.current);
    }
    return () => {
      window.removeEventListener('resize', resize);
      ro?.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
    // engine nasce uma única vez; filtros/estados entram via efeitos abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (active && engineRef.current) engineRef.current.resize(); }, [active]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    if (e.clusterFilter !== clusterFilter) { e.clusterFilter = clusterFilter; e.reheat(); }
  }, [clusterFilter, active]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    if (e.query !== query) { e.query = query; }
  }, [query, active]);

  useEffect(() => {
    engineRef.current?.setPhysics(physics);
  }, [physics]);

  useEffect(() => {
    engineRef.current?.setSelected(selected?.id || null);
  }, [selected]);

  // o painel de nó ocupa ~452px à direita no desktop: a câmera enquadra o
  // espaço útil (e recupera o espaço ao fechar). No mobile o painel cobre
  // tudo, então o inset permanece zero.
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    const hadInset = e.hasInset();
    const isDesktop = window.innerWidth > 940;
    e.setInsetRight(selected && isDesktop ? 452 : 0);
    if (selected && isDesktop) {
      // reenquadra o nó na área útil (o openNode pode ter centralizado antes do inset existir)
      requestAnimationFrame(() => engineRef.current?.centerOnNode(selected.id, 1.1));
    } else if (!selected && hadInset) {
      e.fitAnimated();
    }
  }, [selected, active]);

  return (
    <section
      id="view-graph"
      className={`view ${selected ? 'has-panel' : ''}`}
      role="tabpanel"
      aria-label="Grafo de conhecimento"
      ref={sectionRef}
      style={{ display: active ? 'block' : 'none' }}
    >
      <canvas
        id="graph-canvas"
        ref={canvasRef}
        aria-label="Grafo de documentos do brain. Use a roda do mouse ou o gesto de pinça para zoom e arraste para mover."
      />
      <GraphControls engineRef={engineRef} />
      <Legend clusters={index.data.clusters} />
      <HintBar canvasRef={canvasRef} />
      <NodePanel node={selected} index={index} onClose={onClosePanel} onOpenNode={onOpenNode} />
    </section>
  );
}

// helper estável para o callback do engine (nasce uma única vez)
function viewRefSelected() { return !!document.querySelector('#view-graph.has-panel'); }

