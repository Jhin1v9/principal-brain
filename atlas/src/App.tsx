import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock, Crosshair, Dices, FolderKanban, GitCommitHorizontal, Network, RefreshCw, Workflow,
} from 'lucide-react';
import { buildIndex, loadAtlasData, metaLine } from './data';
import type { GraphEngine } from './graph/engine';
import { Topbar } from './components/Topbar';
import type { View } from './components/Topbar';
import { ClusterBar } from './components/ClusterBar';
import { CommandPalette } from './components/CommandPalette';
import type { PaletteAction } from './components/CommandPalette';
import { GraphView } from './views/GraphView';
import { FluxoView } from './views/FluxoView';
import { TimelineView } from './views/TimelineView';
import { ProjetosView } from './views/ProjetosView';

const VIEWS: View[] = ['graph', 'fluxo', 'timeline', 'projetos'];

function viewFromHash(): View {
  const v = location.hash.replace('#/', '').split('?')[0];
  return (VIEWS as string[]).includes(v) ? (v as View) : 'graph';
}

export default function App() {
  const index = useMemo(() => buildIndex(loadAtlasData()), []);
  const [view, setView] = useState<View>(viewFromHash);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clusterFilter, setClusterFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [physics, setPhysics] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const engineRef = useRef<GraphEngine | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const switchView = useCallback((v: View) => {
    setView(v);
    if (location.hash !== `#/${v}`) history.replaceState(null, '', `#/${v}`);
  }, []);

  // deep-link + navegação por hash
  useEffect(() => {
    const apply = () => {
      const v = viewFromHash();
      setView(v);
      const m = location.hash.match(/[?&]node=([^&]+)/);
      if (m) {
        const id = decodeURIComponent(m[1]);
        if (index.byId.has(id)) setSelectedId(id);
      }
    };
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [index]);

  // Ctrl/Cmd+K abre a paleta
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
        ev.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openNode = useCallback((id: string) => {
    if (!index.byId.has(id)) return;
    setSelectedId(id);
    setView('graph');
    history.replaceState(null, '', `#/graph?node=${encodeURIComponent(id)}`);
    // espera o grafo estar visível para centralizar
    requestAnimationFrame(() => engineRef.current?.centerOnNode(id, 1.15));
  }, [index]);

  const closePanel = useCallback(() => {
    setSelectedId(null);
    history.replaceState(null, '', `#/${viewRef.current}`);
  }, []);

  const recenter = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    e.fit();
    e.reheat();
    setSelectedId(null);
    history.replaceState(null, '', '#/graph');
  }, []);

  const randomNode = useCallback(() => {
    const ns = index.data.nodes;
    if (!ns.length) return;
    openNode(ns[Math.floor(Math.random() * ns.length)].id);
  }, [index, openNode]);

  const actions: PaletteAction[] = useMemo(() => [
    { id: 'go-graph', label: 'Ir para: Grafo', hint: 'Visão', icon: <Network size={15} />, keywords: 'grafo graph', run: () => switchView('graph') },
    { id: 'go-fluxo', label: 'Ir para: Fluxo SYNAPSE', hint: 'Visão', icon: <Workflow size={15} />, keywords: 'fluxo synapse pipeline', run: () => switchView('fluxo') },
    { id: 'go-timeline', label: 'Ir para: Linha do tempo', hint: 'Visão', icon: <Clock size={15} />, keywords: 'timeline changelog histórico', run: () => switchView('timeline') },
    { id: 'go-projetos', label: 'Ir para: Projetos', hint: 'Visão', icon: <FolderKanban size={15} />, keywords: 'projetos clientes portfólio relatórios', run: () => switchView('projetos') },
    { id: 'recenter', label: 'Centralizar grafo', hint: 'Ação', icon: <Crosshair size={15} />, keywords: 'centralizar fit zoom recentralizar', run: recenter },
    { id: 'random', label: 'Nó aleatório', hint: 'Ação', icon: <Dices size={15} />, keywords: 'aleatório random sorte descobrir', run: randomNode },
    {
      id: 'regen', label: 'Reprocessar SYNAPSE', hint: 'API local', icon: <GitCommitHorizontal size={15} />, keywords: 'regenerar reprocessar synapse generate',
      run: () => { fetch('/api/regenerate', { method: 'POST' }).catch(() => { /* fora do server: ignora */ }); },
    },
    {
      id: 'toggle-physics', label: physics ? 'Pausar física do grafo' : 'Retomar física do grafo', hint: 'Ação',
      icon: <RefreshCw size={15} />, keywords: 'física physics pausar play animação', run: () => setPhysics(p => !p),
    },
  ], [switchView, recenter, randomNode, physics]);

  const selected = selectedId ? index.byId.get(selectedId) || null : null;

  return (
    <>
      <div className="bg-glow" aria-hidden="true" />
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Topbar
          view={view}
          onSwitchView={switchView}
          meta={metaLine(index)}
          physics={physics}
          onTogglePhysics={() => setPhysics(p => !p)}
          onRecenter={recenter}
          index={index}
          onOpenNode={openNode}
        />
        <ClusterBar index={index} filter={clusterFilter} onFilter={setClusterFilter} />

        <main id="main">
          <GraphView
            index={index}
            active={view === 'graph'}
            clusterFilter={clusterFilter}
            query={query}
            physics={physics}
            selected={selected}
            onOpenNode={openNode}
            onClosePanel={closePanel}
            engineRef={engineRef}
          />
          <AnimatePresence mode="wait">
            {view === 'fluxo' && (
              <motion.div
                key="fluxo"
                className="view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                <FluxoView active onOpenNode={openNode} />
              </motion.div>
            )}
            {view === 'timeline' && (
              <motion.div
                key="timeline"
                className="view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                <TimelineView index={index} active onOpenNode={openNode} />
              </motion.div>
            )}
            {view === 'projetos' && (
              <motion.div
                key="projetos"
                className="view"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                <ProjetosView index={index} active onOpenNode={openNode} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        index={index}
        actions={actions}
        onOpenNode={openNode}
      />
    </>
  );
}
