import { clusterColor } from '../data';

export function Legend({ clusters }: { clusters: string[] }) {
  return (
    <div className="legend glass" aria-hidden="true">
      {clusters.map(c => (
        <div key={c} className="lg-item">
          <span className="dot" style={{ background: clusterColor(c), color: clusterColor(c) }} />
          {c}
        </div>
      ))}
    </div>
  );
}
