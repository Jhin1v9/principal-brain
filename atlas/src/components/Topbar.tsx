import { Crosshair, FolderKanban, GitCommitHorizontal, Network, Pause, Play, Workflow } from 'lucide-react';
import type { AtlasIndex } from '../data';
import { SearchBox } from './SearchBox';

export type View = 'graph' | 'fluxo' | 'timeline' | 'projetos';

const TABS: { key: View; label: string; icon: typeof Network }[] = [
  { key: 'graph', label: 'Grafo', icon: Network },
  { key: 'fluxo', label: 'Fluxo SYNAPSE', icon: Workflow },
  { key: 'timeline', label: 'Linha do tempo', icon: GitCommitHorizontal },
  { key: 'projetos', label: 'Projetos', icon: FolderKanban },
];

export function Topbar(props: {
  view: View;
  onSwitchView: (v: View) => void;
  meta: string;
  physics: boolean;
  onTogglePhysics: () => void;
  onRecenter: () => void;
  index: AtlasIndex;
  onOpenNode: (id: string) => void;
}) {
  return (
    <header className="topbar glass">
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
            <circle cx="16" cy="16" r="13" stroke="url(#g1)" strokeWidth="2" opacity=".9" />
            <circle cx="16" cy="16" r="4.5" fill="url(#g1)" />
            <circle cx="25.5" cy="9" r="2.4" fill="#8b5cf6" />
            <circle cx="7" cy="23" r="2.4" fill="#3b82f6" />
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#3b82f6" /><stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="brand-text">
          <h1 className="font-display" style={{ fontSize: 17, letterSpacing: '.06em', fontWeight: 700, whiteSpace: 'nowrap' }}>
            NEXO BRAIN <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>— Atlas</span>
          </h1>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '.04em' }}>{props.meta}</p>
        </div>
      </div>

      <nav className="tabs" role="tablist" aria-label="Visões do atlas">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab ${props.view === t.key ? 'is-active' : ''}`}
            data-view={t.key}
            role="tab"
            aria-selected={props.view === t.key}
            onClick={() => props.onSwitchView(t.key)}
          >
            <t.icon size={13} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </nav>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <SearchBox index={props.index} onOpenNode={props.onOpenNode} />
        <button
          className="icon-btn"
          title="Recentralizar grafo"
          aria-label="Recentralizar grafo"
          onClick={props.onRecenter}
        >
          <Crosshair size={16} aria-hidden="true" />
        </button>
        <button
          className={`icon-btn ${props.physics ? 'is-on' : ''}`}
          title={props.physics ? 'Pausar física do grafo' : 'Retomar física do grafo'}
          aria-label="Pausar ou retomar física do grafo"
          aria-pressed={props.physics}
          onClick={props.onTogglePhysics}
        >
          {props.physics ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
