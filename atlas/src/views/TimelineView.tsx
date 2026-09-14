import { motion } from 'framer-motion';
import { GitCommitHorizontal, Inbox } from 'lucide-react';
import type { AtlasIndex } from '../data';
import { TIPO_COLORS } from '../data';

export function TimelineView({ index, active, onOpenNode }: { index: AtlasIndex; active: boolean; onOpenNode: (id: string) => void }) {
  const entries = index.data.nodes
    .filter(n => n.cluster === 'Changelog' && n.tipo)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div id="view-timeline" className="view" role="tabpanel" aria-label="Linha do tempo do changelog">
      <div className="timeline-wrap">
        <div className="timeline-axis" aria-hidden="true" />
        {entries.length === 0 ? (
          <div className="empty-state">
            <Inbox size={32} aria-hidden="true" />
            <div>
              Nenhuma entrada de changelog ainda.<br />
              As entradas do SYNAPSE aparecem aqui assim que os primeiros commits forem classificados.
            </div>
          </div>
        ) : (
          entries.map((n, i) => {
            const color = TIPO_COLORS[n.tipo!] || '#94a3b8';
            return (
              <motion.div
                key={n.id}
                className="tl-item"
                role="button"
                tabIndex={0}
                aria-label={`Abrir ${n.title}`}
                initial={{ opacity: 0, y: 18 }}
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                transition={{ delay: Math.min(i * 0.07, 0.7), duration: 0.35 }}
                onClick={() => onOpenNode(n.id)}
                onKeyDown={ev => {
                  if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onOpenNode(n.id); }
                }}
              >
                <div className="tl-date">{(n.date || '—').split('-').reverse().join('/')}</div>
                <div className="tl-dot" style={{ background: color, color, outlineColor: color + '26' }} />
                <div className="tl-card">
                  <span className="tl-type" style={{ background: color + '1f', color, border: `1px solid ${color}44` }}>
                    <GitCommitHorizontal size={10} aria-hidden="true" />
                    {n.tipo}{n.escopo ? ' · ' + n.escopo : ''}
                  </span>
                  <h3>{n.title}</h3>
                  {n.summary && <p>{n.summary}</p>}
                  <span className="tl-id">{n.id}</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
