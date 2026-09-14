import { useEffect, useRef, useState } from 'react';
import { Link2, Search } from 'lucide-react';
import type { AtlasIndex, AtlasNode } from '../data';
import { clusterColor, searchNodes } from '../data';

export function SearchBox({ index, onOpenNode }: { index: AtlasIndex; onOpenNode: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const found: AtlasNode[] = q.trim() ? searchNodes(q, index, 8).map(r => r.node) : [];

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!boxRef.current?.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const choose = (id: string) => {
    setOpen(false);
    setQ('');
    onOpenNode(id);
  };

  return (
    <div className="search-box" ref={boxRef}>
      <Search size={15} aria-hidden="true" />
      <input
        type="search"
        placeholder="Buscar documento…"
        aria-label="Buscar documento"
        autoComplete="off"
        value={q}
        onChange={ev => { setQ(ev.target.value); setOpen(true); setSel(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={ev => {
          if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
            ev.preventDefault();
            if (!found.length) return;
            setSel(s => (s + (ev.key === 'ArrowDown' ? 1 : -1) + found.length) % found.length);
          } else if (ev.key === 'Enter') {
            const target = found[sel >= 0 ? sel : 0];
            if (target) choose(target.id);
          } else if (ev.key === 'Escape') {
            setOpen(false);
            (ev.target as HTMLInputElement).blur();
          }
        }}
      />
      {open && q.trim() !== '' && (
        <div className="search-results" role="listbox">
          {found.length === 0 && (
            <button type="button" disabled style={{ color: 'var(--text-faint)', cursor: 'default' }}>Nenhum documento encontrado</button>
          )}
          {found.map((n, i) => (
            <button
              key={n.id}
              type="button"
              role="option"
              aria-selected={i === sel}
              className={i === sel ? 'is-sel' : ''}
              onMouseEnter={() => setSel(i)}
              onClick={() => choose(n.id)}
            >
              <span className="dot" style={{ background: clusterColor(n.cluster) }} />
              <span>{n.title}</span>
              <small><Link2 size={11} aria-hidden="true" />{n.deg || 0}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
