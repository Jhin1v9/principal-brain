import { motion } from 'framer-motion';
import { Box, ChevronRight, ExternalLink, FileText, Github, Layers, Star, Store, Wrench } from 'lucide-react';
import type { AtlasIndex } from '../data';
import { GRUPOS, TOTAL_PROJETOS } from '../data/projetos';
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

function ProjetoCard({ p, index, onOpenNode }: {
  p: Projeto;
  index: number;
  onOpenNode: (id: string) => void;
}) {
  const cor = STATUS_COR[p.status];
  return (
    <motion.div
      className="proj-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5), duration: 0.3 }}
    >
      <button className="proj-head" onClick={() => onOpenNode(`projeto/${p.id}`)}>
        <div className="proj-title">
          <h3>{p.nome}</h3>
          {p.cliente && <span className="proj-cliente">{p.cliente}</span>}
        </div>
        <div className="proj-meta">
          <span className="proj-status" style={{ background: cor + '22', color: cor, border: `1px solid ${cor}55` }}>
            {p.status === 'no-ar' ? 'No ar' : p.status === 'evolucao' ? 'Em evolução' : 'Standby'}
          </span>
          <ChevronRight size={15} className="proj-chevron" aria-hidden="true" />
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
        <button className="proj-relatorio-btn" onClick={() => onOpenNode(`projeto/${p.id}`)}>
          <FileText size={11} aria-hidden="true" /> Ver relatório no grafo
        </button>
      </div>
    </motion.div>
  );
}

export function ProjetosView({ index, active, onOpenNode }: {
  index: AtlasIndex;
  active: boolean;
  onOpenNode: (id: string) => void;
}) {
  return (
    <div id="view-projetos" className="view" role="tabpanel" aria-label="Projetos Nexo">
      <div className="projetos-wrap">
        <div className="projetos-intro">
          <h2 className="font-display">Projetos</h2>
          <p>
            Portfólio vivo da Nexo Digital — clientes, plataforma e catálogos em produção.
            {' '}<b>{TOTAL_PROJETOS} projetos</b> em {GRUPOS.length} grupos · fonte única: <code>projects/manifest.json</code>.
            Clique num projeto para ver a bolinha no grafo com o relatório completo.
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
                  <ProjetoCard key={p.id} p={p} index={gi + pi} onOpenNode={onOpenNode} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
