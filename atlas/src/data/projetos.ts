// Projetos NEXO — a MESMA fonte que alimenta o grafo (projects/manifest.json).
// O generate.mjs lê esse manifest e cria as bolinhas do cluster "Projetos";
// esta view é a listagem curada. Relatórios moram em projects/<id>.md e
// abrem no painel do grafo (clique em "Ver relatório").

import manifest from '../../../projects/manifest.json';

export type ProjStatus = 'no-ar' | 'evolucao' | 'standby';

export interface Projeto {
  id: string;
  nome: string;
  cliente?: string;
  status: ProjStatus;
  stack: string;
  atividade: string;
  repo?: string;
  url?: string;
  resumo: string;
}

export interface GrupoProjetos {
  id: string;
  titulo: string;
  icone: 'estrela' | 'nucleo' | 'caixa' | 'loja' | 'ferramenta';
  projetos: Projeto[];
}

type ManifestEntry = {
  id: string; grupo: string; nome: string; cliente?: string;
  status: ProjStatus; stack: string; atividade: string;
  repo?: string; url?: string; resumo: string;
};

const ENTRIES = manifest as unknown as ManifestEntry[];

const GRUPO_DEF: { id: string; titulo: string; icone: GrupoProjetos['icone'] }[] = [
  { id: 'clientes', titulo: 'Clientes — projetos com nome e cara', icone: 'estrela' },
  { id: 'nucleo', titulo: 'Núcleo Nexo Digital — a plataforma', icone: 'nucleo' },
  { id: 'tpv', titulo: 'TPV — pontos de venda (11 apps)', icone: 'loja' },
  { id: 'saas', titulo: 'SaaS — 17 sistemas', icone: 'caixa' },
  { id: 'crm-erp', titulo: 'CRM/ERP + Negocios — 21 sistemas', icone: 'caixa' },
  { id: 'ferramentas', titulo: 'Ferramentas e produtos em evolução', icone: 'ferramenta' },
];

export const STATUS_LABEL: Record<ProjStatus, string> = {
  'no-ar': 'No ar',
  evolucao: 'Em evolução',
  standby: 'Standby',
};

export const GRUPOS: GrupoProjetos[] = GRUPO_DEF.map(g => ({
  ...g,
  projetos: ENTRIES.filter(e => e.grupo === g.id),
}));

export const TOTAL_PROJETOS = ENTRIES.length;
