import { useEffect, useState } from 'react';

export function HintBar({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hide = () => setHidden(true);
    canvas.addEventListener('pointerdown', hide, { once: true });
    canvas.addEventListener('wheel', hide, { once: true });
    return () => {
      canvas.removeEventListener('pointerdown', hide);
      canvas.removeEventListener('wheel', hide);
    };
  }, [canvasRef]);
  return (
    <div className={`graph-hint glass ${hidden ? 'is-hidden' : ''}`}>
      arraste para mover · roda para zoom · duplo clique aproxima · clique no vazio solta o nó
    </div>
  );
}
