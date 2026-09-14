// Etapas do pipeline SYNAPSE (9 estágios)
import { Bot, FileText, GitCommitHorizontal, RotateCcw, Zap } from 'lucide-react';

export interface Stage {
  key: string;
  cls: string; // st-io | st-agent | st-loop | ''
  tag: string;
  title: string;
  desc: string;
  detail: string;
  points: string[];
  node?: string; // nó do grafo relacionado
  icon: typeof GitCommitHorizontal;
}

export const STAGES: Stage[] = [
  {
    key: 'commit', cls: '', tag: 'entrada', title: 'git commit',
    desc: 'Você commita o trabalho normalmente. É o único passo humano de todo o pipeline.',
    detail: 'A partir daqui tudo é automático. O commit em si mede menos de 1 segundo — o SYNAPSE nunca atrasa o seu fluxo de trabalho, porque todo o processamento acontece em um processo separado e assíncrono.',
    points: ['Disparo natural do fluxo de trabalho', 'Zero fricção: nenhum comando extra'],
    icon: GitCommitHorizontal,
  },
  {
    key: 'hook', cls: '', tag: 'hook · <1s', title: 'post-commit hook',
    desc: 'Coleta hash, autor, data, mensagem e diff --stat num JSON e dispara o orquestrador.',
    detail: 'O hook `automation/hooks/post-commit` guarda os metadados do commit em `.git/synapse-<hash>.json`, aplica os guards de idempotência (entrada `*-<hash>.md` já existe?) e concorrência (lockfile com PID), e chama `synapse.sh` detached via `nohup … &`. Qualquer falha aqui resulta em `exit 0` silencioso: o commit nunca espera a IA.',
    points: ['Assíncrono: nunca bloqueia o commit', 'Idempotente: um hash nunca gera duas entradas', 'Lock de concorrência com recuperação de lock morto'],
    node: 'automation/hooks/post-commit',
    icon: Zap,
  },
  {
    key: 'orch', cls: '', tag: 'orquestrador', title: 'synapse.sh',
    desc: 'Orquestrador com lockfile: verifica configuração e invoca os dois agentes Kimi em sequência.',
    detail: '`automation/synapse.sh` lê `automation/config.env` (`KIMI_BIN`, `SYNAPSE_DISABLE`, `SYNAPSE_AUTO_COMMIT`), valida o binário do Kimi e invoca `kimi -p --agent-file` duas vezes com CWD na raiz do repo, passando o contrato por variáveis de ambiente (`SYNAPSE_REPO`, `SYNAPSE_COMMIT_JSON`, `SYNAPSE_HASH`). Se a IA falhar, um fallback determinístico em shell grava a entrada básica mesmo assim.',
    points: ['Precedência: config.env > ambiente > padrões', 'Fallback determinístico sem IA', 'Logs em .git/synapse.log'],
    node: 'automation/synapse.sh',
    icon: Bot,
  },
  {
    key: 'classify', cls: 'st-agent', tag: 'agente kimi · 1', title: 'Agente classificador',
    desc: 'Lê o diff real do commit e classifica: tipo, impacto, breaking, risco de regressão.',
    detail: 'O agente `synapse-classify` (prompt `automation/prompts/classify-commit.agent.md`) executa `git show` do commit — nunca classifica só pela mensagem, porque a mensagem é um chute e o diff é a verdade. Ele grava a análise completa em `changelog/entries/<data>-<hash>.md` com frontmatter estruturado e uma nota pronta para o cliente em linguagem leiga.',
    points: ['Classificação baseada no diff, não na mensagem', 'Schema: tipo, escopo, impacto, breaking, risco', 'Nota para o cliente sem jargão em cada entrada'],
    node: 'automation/prompts/classify-commit.agent.md',
    icon: Bot,
  },
  {
    key: 'changelog', cls: 'st-io', tag: 'artefatos', title: 'changelog/entries + CHANGELOG.md',
    desc: 'Cada commit vira uma entrada analisada; o índice consolidado fica sempre com o mais novo no topo.',
    detail: 'As entradas em `changelog/entries/` guardam o frontmatter YAML (hash, data, autor, tipo, impacto, breaking, risco) e as seções Resumo técnico / Análise / Nota para o cliente / Recomendações. O `changelog/CHANGELOG.md` recebe uma linha por commit, imediatamente após o título, mais novo no topo.',
    points: ['Histórico pesquisável por commit', 'Índice consolidado sem duplicatas', 'Pronto para relatório e para o cliente'],
    node: 'changelog/CHANGELOG.md',
    icon: FileText,
  },
  {
    key: 'report', cls: 'st-agent', tag: 'agente kimi · 2', title: 'Agente de relatório',
    desc: 'Consolida as entradas recentes e reescreve o relatório vivo do brain.',
    detail: 'O agente `synapse-report` (prompt `automation/prompts/generate-report.agent.md`) lê as entradas do changelog e reescreve `reports/latest.md` com as seções fixas: Entregues / Em andamento / Próximos passos / Notas técnicas — em linguagem técnica para a equipe de engenharia.',
    points: ['Relatório sempre fresco, sem trabalho manual', 'Visão consolidada do ciclo de entregas', 'Seções fixas: fácil de escanear'],
    node: 'automation/prompts/generate-report.agent.md',
    icon: Bot,
  },
  {
    key: 'latest', cls: 'st-io', tag: 'artefato', title: 'reports/latest.md',
    desc: 'O relatório vivo do brain — o que foi entregue, o que está em andamento e o que vem a seguir.',
    detail: '`reports/latest.md` é a fonte rápida para responder "o que mudou no brain?". É reescrito a cada commit pelo agente de relatório e consumido pela equipe (e pela Luna) como memória de curto prazo das entregas.',
    points: ['Atualizado automaticamente a cada commit', 'Linguagem técnica para a equipe'],
    node: 'reports/latest.md',
    icon: FileText,
  },
  {
    key: 'autocommit', cls: 'st-io', tag: 'auto-commit', title: 'Auto-commit [synapse]',
    desc: 'O orquestrador commita os artefatos gerados com a marca [synapse] — opcional, ativo por padrão.',
    detail: 'Com `SYNAPSE_AUTO_COMMIT=1` (padrão), o orquestrador commita `changelog/entries/`, `CHANGELOG.md` e `reports/latest.md` com a mensagem `chore(synapse): registro do commit <hash> [synapse]`. Com `SYNAPSE_AUTO_COMMIT=0` os artefatos ficam no working tree para revisão humana — nesse caso, o agente humano NÃO deve commitá-los manualmente: eles são do SYNAPSE.',
    points: ['Marca [synapse] identifica commits de máquina', 'Desligável via SYNAPSE_AUTO_COMMIT=0', 'Artefatos nunca misturados com código manual'],
    icon: GitCommitHorizontal,
  },
  {
    key: 'loop', cls: 'st-loop', tag: 'loop seguro', title: 'Volta ao hook — sem loop infinito',
    desc: 'O hook ignora qualquer commit cuja mensagem contenha [synapse]. O ciclo se fecha em segurança.',
    detail: 'Como o auto-commit também é um `git commit`, ele dispararia o hook de novo — se não fosse o guard: o `post-commit` verifica a mensagem e ignora commits `[synapse]`. Resultado: pipeline contínuo, zero loops infinitos, zero ruído no changelog.',
    points: ['Guard simples e à prova de falhas', 'Changelog sem auto-referência', 'Pipeline contínuo e silencioso'],
    icon: RotateCcw,
  },
];
