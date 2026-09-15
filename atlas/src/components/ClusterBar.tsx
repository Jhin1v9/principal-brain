import { motion } from 'framer-motion';
import type { AtlasIndex } from '../data';
import { clusterColor } from '../data';
import { useCanScroll } from './useCanScroll';

export function ClusterBar({ index, filter, onFilter }: { index: AtlasIndex; filter: string | null; onFilter: (c: string | null) => void }) {
  const scroll = useCanScroll<HTMLDivElement>();
  return (
    <div
      ref={scroll.ref}
      className={`cluster-bar ${scroll.canScroll ? 'can-scroll' : ''}`}
      role="toolbar"
      aria-label="Contadores e filtro por cluster"
    >
      {index.data.clusters.map(c => {
        const count = index.data.nodes.filter(n => n.cluster === c).length;
        const color = clusterColor(c);
        return (
          <motion.button
            key={c}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className={`cluster-pill ${filter === c ? 'is-active' : ''}`}
            aria-label={`Destacar cluster ${c}`}
            aria-pressed={filter === c}
            onClick={() => onFilter(filter === c ? null : c)}
          >
            <span className="dot" style={{ background: color, color }} />
            {c} <b>{count}</b>
          </motion.button>
        );
      })}
    </div>
  );
}
