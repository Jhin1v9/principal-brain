import { useEffect, useRef, useState } from 'react';

// detecta conteúdo transbordando horizontalmente — usado pra ligar o fade
// nas bordas (tabs, cluster bar) só quando algo realmente está fora da tela
export function useCanScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [canScroll, setCanScroll] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener('resize', check);
    return () => { ro.disconnect(); window.removeEventListener('resize', check); };
  }, []);
  return { ref, canScroll };
}
