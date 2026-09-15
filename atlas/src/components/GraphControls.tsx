import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type { GraphEngine } from '../graph/engine';

// Controles de câmera flutuantes (padrão Google Maps/Mapbox): funcionam
// com toque e mouse, sempre visíveis sobre o universo.
export function GraphControls({ engineRef }: {
  engineRef: React.MutableRefObject<GraphEngine | null>;
}) {
  return (
    <div className="graph-controls glass" role="toolbar" aria-label="Controles de navegação do grafo">
      <button
        type="button"
        title="Aproximar"
        aria-label="Aproximar"
        onClick={() => engineRef.current?.zoomStep(1)}
      >
        <ZoomIn size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        title="Afastar"
        aria-label="Afastar"
        onClick={() => engineRef.current?.zoomStep(-1)}
      >
        <ZoomOut size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        title="Reenquadrar universo"
        aria-label="Reenquadrar universo"
        onClick={() => engineRef.current?.fitAnimated()}
      >
        <Maximize2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
