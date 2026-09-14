import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Box, ChevronDown, ExternalLink, Github, Layers, Star, Store, Wrench } from 'lucide-react';
import type { AtlasIndex } from '../data';
import { Markdown } from '../components/markdown';
import { GRUPOS, STATUS_LABEL } from '../data/projetos';
import type { GrupoProjetos, Projeto, ProjStatus } from '../data/projetos';

const ICONES: Record<GrupoProjetos['icone'], typeof Star> = {
  estrela: Star,
  nucleo: Layers,
  caixa: Box,
  loja: Store,
  ferramenta: Wrench,
};

const STATUS_COR: Record<ProjStatus, string> = {
  'no-ar': '#3d7a4a',
  evolucao: '#b06f17',
  standby: '#6b6f76',
};

function ProjetoCard({ p, index, indexData, onOpenNode }: {
  p: Projeto;
  index: number;
  indexData: AtlasIndex;
  onOpenNode: (id: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const cor = STATUS_COR[p.status];

  return (
    <motion.div
      className={`proj-card ${aberto ? 'is-open' : ''}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
    >
      <button className="proj-head" onClick={() => setAberto(o => !o)} aria-expanded={aberto}>
        <div className="proj-title">
          <h3>{p.nome}</h3>
          {p.cliente && <span className="proj-cliente">{p.cliente}</span>}
        </div>
        <div className="proj-meta">
          <span className="proj-status" style={{ background: cor + '22', color: cor, border: `1px solid ${cor}55` }}>
            {STATUS_LABEL[p.status]}
          </span>
          <ChevronDown size={15} className="proj-chevron" aria-hidden="true" />
        </div>
      </button>
      <p className="proj-resumo">{p.resumo}</p>
      <div className="proj-foot">
        <span className="proj-stack">{p.stack}</span>
        <span className="proj-atividade">ativo {p.atividade}</span>
      </div>
      <div className="proj-links">
        {p.repo && (
          <a href={p.repo} target="_blank" rel="noreferrer"><Github size={12} aria-hidden="true" /> GitHub</a>
        )}
        {p.url && (
          <a href={p.url} target="_blank" rel="noreferrer"><ExternalLink size={12} aria-hidden="true" /> Abrir</a>
        )}
        <button className="proj-relatorio-btn" onClick={() => setAberto(o => !o)}>
          {aberto ? 'Fechar relatório' : 'Ver relatório'}
        </button>
      </div>
      {aberto && (
        <motion.div
          className="proj-relatorio"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.25 }}
        >
          <Markdown md={p.relatorio} index={indexData} onNode={onOpenNode} />
        </motion.div>
      )}
    </motion.div>
  );
}

export function ProjetosView({ index, active, onOpenNode }: {
  index: AtlasIndex;
  active: boolean;
  onOpenNode: (id: string) => void;
}) {
  const total = useMemo(() => GRUPOS.reduce((acc, g) => acc + g.projetos.length, 0), []);

  return (
    <div id="view-projetos" className="view" role="tabpanel" aria-label="Projetos Nexo">
      <div className="projetos-wrap">
        <div className="projetos-intro">
          <h2 className="font-display">Projetos</h2>
          <p>
            Portfólio vivo da Nexo Digital — clientes, plataforma e catálogos em produção.
            {' '}<b>{total} projetos</b> em {GRUPOS.length} grupos · levantado em 14/09/2026.
            Clique num projeto para abrir o relatório completo.
          </p>
        </div>
        {GRUPOS.map((g, gi) => {
          const Icone = ICONES[g.icone] || Box;
          return (
            <section key={g.id} className="proj-grupo">
              <h3 className="proj-grupo-titulo font-display">
                <Icone size={15} aria-hidden="true" /> {g.titulo}
              </h3>
              <div className="proj-grid">
                {g.projetos.map((p, pi) => (
                  <ProjetoCard key={p.id} p={p} index={gi + pi} indexData={index} onOpenNode={onOpenNode} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
