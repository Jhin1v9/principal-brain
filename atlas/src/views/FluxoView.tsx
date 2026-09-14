import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { STAGES } from './fluxo-stages';

interface PipePath { id: string; d: string; loop?: boolean; dur: string; begin: string; }

export function FluxoView({ active, onOpenNode }: { active: boolean; onOpenNode: (id: string) => void }) {
  const [selected, setSelected] = useState('commit');
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<PipePath[]>([]);

  const layoutPipes = useCallback(() => {
    const wrap = wrapRef.current, svg = svgRef.current;
    if (!wrap || !svg) return;
    if (window.innerWidth <= 940) { setPaths([]); return; }
    const stages = [...wrap.querySelectorAll<HTMLElement>('.stage')];
    if (!stages.length) return;
    const wr = wrap.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${wr.width} ${wr.height}`);
    const pts = stages.map(el => {
      const r = el.getBoundingClientRect();
      return {
        bottom: { x: r.left - wr.left + r.width / 2, y: r.bottom - wr.top },
        top: { x: r.left - wr.left + r.width / 2, y: r.top - wr.top },
        right: { x: r.right - wr.left, y: r.top - wr.top + r.height / 2 },
        left: { x: r.left - wr.left, y: r.top - wr.top + r.height / 2 },
      };
    });
    const path = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
    };
    const out: PipePath[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      out.push({ id: `fp${i}`, d: path(pts[i].bottom, pts[i + 1].top), dur: `${2.4 + i * 0.22}s`, begin: `${i * 0.3}s` });
    }
    const last = pts[pts.length - 1], first = pts[0];
    const lx = wr.width + 4;
    out.push({
      id: 'floop',
      d: `M ${last.right.x} ${last.right.y} H ${lx} V ${first.right.y} H ${first.right.x}`,
      loop: true, dur: '4s', begin: '1s',
    });
    setPaths(out);
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(layoutPipes, 80);
    window.addEventListener('resize', layoutPipes);
    if (window.ResizeObserver && wrapRef.current) {
      const ro = new ResizeObserver(layoutPipes);
      ro.observe(wrapRef.current);
      return () => { clearTimeout(t); window.removeEventListener('resize', layoutPipes); ro.disconnect(); };
    }
    return () => { clearTimeout(t); window.removeEventListener('resize', layoutPipes); };
  }, [active, layoutPipes]);

  const stage = STAGES.find(s => s.key === selected)!;

  return (
    <div id="view-fluxo" className="view" role="tabpanel" aria-label="Diagrama do pipeline SYNAPSE">
      <div className="fluxo-head">
        <h2>Fluxo SYNAPSE</h2>
        <p>
          O pipeline pós-commit do brain: do seu <code>git commit</code> ao changelog, ao relatório e ao
          auto-commit — sem loop infinito. Clique numa etapa para ver os detalhes.
        </p>
      </div>

      <div className="fluxo-wrap" ref={wrapRef}>
        <svg id="fluxo-svg" ref={svgRef} aria-hidden="true">
          <defs>
            <linearGradient id="pipeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#3b82f6" /><stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          {paths.map(p => (
            <path key={p.id} id={p.id} className={p.loop ? 'pipe-loop' : 'pipe'} d={p.d} />
          ))}
          {paths.map(p => (
            <circle key={'pulse-' + p.id} className="pulse" r={p.loop ? 3.2 : 3.6}
              style={p.loop ? { fill: '#6ee7b7' } : undefined}>
              <animateMotion dur={p.dur} begin={p.begin} repeatCount="indefinite">
                <mpath href={'#' + p.id} />
              </animateMotion>
            </circle>
          ))}
        </svg>

        <div className="fluxo-stages" style={{ display: 'contents' }}>
          {STAGES.map((s, i) => (
            <motion.article
              key={s.key}
              className={`stage glass ${s.cls} ${selected === s.key ? 'is-active' : ''}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 260, damping: 26 }}
              whileHover={{ y: -3 }}
              tabIndex={0}
              role="button"
              aria-label={`Etapa ${i + 1}: ${s.title}`}
              onClick={() => setSelected(s.key)}
              onKeyDown={ev => {
                if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setSelected(s.key); }
              }}
            >
              <span className="st-index">ETAPA {i + 1}</span>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <s.icon size={15} aria-hidden="true" style={{ color: 'var(--text-dim)', flex: 'none' }} />
                {s.title}
              </h3>
              <p>{s.desc}</p>
              <span className="st-tag">{s.tag}</span>
            </motion.article>
          ))}
        </div>
      </div>

      <motion.div
        key={stage.key}
        className="fluxo-detail glass"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h3>{stage.title}</h3>
        <p>{stage.detail}</p>
        <ul>{stage.points.map(p => <li key={p}>{p}</li>)}</ul>
        {stage.node && (
          <div className="fd-actions">
            <button type="button" onClick={() => onOpenNode(stage.node!)}>
              <Share2 size={13} aria-hidden="true" /> Ver no grafo
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
