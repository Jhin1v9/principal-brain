import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, FileText } from 'lucide-react';
import type { AtlasIndex } from '../data';
import { clusterColor } from '../data';

export interface PaletteAction {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  keywords: string;
  run: () => void;
}

function fuzzyScore(q: string, text: string): number {
  const query = q.toLowerCase(), target = text.toLowerCase();
  if (!query) return 0;
  if (target.includes(query)) return 100 - target.indexOf(query);
  // subsequence fuzzy
  let ti = 0, score = 0;
  for (const ch of query) {
    const idx = target.indexOf(ch, ti);
    if (idx === -1) return 0;
    score += idx === ti ? 3 : 1;
    ti = idx + 1;
  }
  return score > 0 ? 40 + score : 0;
}

export function CommandPalette({ open, onClose, index, actions, onOpenNode }: {
  open: boolean;
  onClose: () => void;
  index: AtlasIndex;
  actions: PaletteAction[];
  onOpenNode: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const items = useMemo(() => {
    const scoredNodes = index.data.nodes
      .map(n => ({ kind: 'node' as const, id: n.id, score: Math.max(fuzzyScore(q, n.title), fuzzyScore(q, n.id) * 0.7), node: n }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score || b.node.deg - a.node.deg)
      .slice(0, 7);
    const scoredActions = actions
      .map(a => ({ kind: 'action' as const, id: a.id, score: fuzzyScore(q, a.label + ' ' + a.keywords), action: a }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    return [...scoredActions, ...scoredNodes];
  }, [q, index, actions]);

  useEffect(() => setSel(0), [q, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { ev.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const runItem = (item: typeof items[number]) => {
    onClose();
    if (item.kind === 'action') item.action.run();
    else onOpenNode(item.id);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="palette"
            role="dialog"
            aria-label="Paleta de comandos"
            initial={{ scale: 0.94, y: -14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={ev => ev.stopPropagation()}
          >
            <input
              ref={inputRef}
              placeholder="Buscar documento ou executar ação…"
              aria-label="Buscar documento ou executar ação"
              value={q}
              onChange={ev => setQ(ev.target.value)}
              onKeyDown={ev => {
                if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
                  ev.preventDefault();
                  if (!items.length) return;
                  setSel(s => (s + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length);
                } else if (ev.key === 'Enter') {
                  const item = items[sel];
                  if (item) runItem(item);
                }
              }}
            />
            <div className="palette-list" ref={listRef}>
              {items.length === 0 && (
                <div className="palette-section">Nenhum resultado</div>
              )}
              {items.map((item, i) => {
                const prev = items[i - 1];
                const showSection = !prev || prev.kind !== item.kind;
                return (
                  <div key={item.kind + '-' + item.id}>
                    {showSection && (
                      <div className="palette-section">{item.kind === 'action' ? 'Ações' : 'Documentos'}</div>
                    )}
                    <motion.button
                      type="button"
                      className={`palette-item ${i === sel ? 'is-sel' : ''}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      onMouseEnter={() => setSel(i)}
                      onClick={() => runItem(item)}
                    >
                      <span className="pi-icon">
                        {item.kind === 'action' ? item.action.icon : <FileText size={15} aria-hidden="true" />}
                      </span>
                      <span>{item.kind === 'action' ? item.action.label : item.node.title}</span>
                      <small>
                        {item.kind === 'action' ? item.action.hint : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span className="dot" style={{ width: 7, height: 7, borderRadius: 99, display: 'inline-block', background: clusterColor(item.node.cluster) }} />
                            {item.node.cluster}
                          </span>
                        )}
                        {i === sel && <CornerDownLeft size={12} aria-hidden="true" style={{ marginLeft: 8 }} />}
                      </small>
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
