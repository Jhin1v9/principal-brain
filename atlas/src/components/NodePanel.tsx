import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CornerUpLeft, ExternalLink, FileText, X } from 'lucide-react';
import type { AtlasIndex, AtlasNode } from '../data';
import { clusterColor } from '../data';
import { Markdown } from './markdown';

export function NodePanel({ node, index, onClose, onOpenNode }: {
  node: AtlasNode | null;
  index: AtlasIndex;
  onClose: () => void;
  onOpenNode: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {node && (
        <motion.aside
          key={node.id}
          className="node-panel glass"
          aria-label="Detalhes do documento"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          <button
            className="icon-btn"
            style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30 }}
            aria-label="Fechar painel"
            onClick={onClose}
          >
            <X size={15} aria-hidden="true" />
          </button>

          <div className="panel-cluster" style={{ color: clusterColor(node.cluster), borderColor: clusterColor(node.cluster) + '55' }}>
            <span className="dot" style={{ background: clusterColor(node.cluster), boxShadow: `0 0 8px ${clusterColor(node.cluster)}` }} />
            {node.cluster}
          </div>

          <h2 className="font-display" style={{ fontSize: 19, lineHeight: 1.3, marginBottom: 8, paddingRight: 26 }}>{node.title}</h2>

          <div className="panel-meta" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {node.date && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} aria-hidden="true" /> {node.date}
              </span>
            )}
            {node.tipo && <span>tipo: {node.tipo}</span>}
            {node.escopo && <span>escopo: {node.escopo}</span>}
            <span style={{ width: '100%' }}>{node.id}</span>
          </div>

          {node.summary && <p className="panel-summary">{node.summary}</p>}

          {node.kind === 'script' || node.kind === 'agente' ? (
            <pre className="panel-md" style={{ whiteSpace: 'pre-wrap' }}><code>{node.body || ''}</code></pre>
          ) : (
            <Markdown md={node.body || ''} index={index} onNode={onOpenNode} />
          )}

          <div style={{ marginBottom: 18 }}>
            <h3 className="font-display" style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CornerUpLeft size={12} aria-hidden="true" /> Links para cá
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {(index.backlinks.get(node.id) || []).length === 0 && (
                <li style={{ color: 'var(--text-faint)', fontSize: 12 }}>Nenhum documento aponta para cá ainda.</li>
              )}
              {(index.backlinks.get(node.id) || []).map(src => {
                const s = index.byId.get(src);
                return (
                  <li key={src}>
                    <button type="button" className="backlink-btn" title={src} onClick={() => onOpenNode(src)}>
                      <CornerUpLeft size={12} aria-hidden="true" />
                      {s ? s.title : src}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            type="button"
            className="btn-open-file"
            onClick={() => {
              const url = '../' + node.id.split('/').map(encodeURIComponent).join('/');
              const a = document.createElement('a');
              a.href = url; a.target = '_blank'; a.rel = 'noopener';
              a.click();
            }}
          >
            <FileText size={14} aria-hidden="true" /> Abrir arquivo <ExternalLink size={13} aria-hidden="true" />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
