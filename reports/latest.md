# Relatório — último ciclo de entregas

_Atualizado automaticamente pelo SYNAPSE em 2026-09-14_

## Entregues

- **2026-09-14 · 5c8c675 · feat(atlas+skill)** — Adiciona o Atlas, painel visual estático do brain (grafo estilo Obsidian em canvas com física própria, filtros, busca, pan/zoom/pinch, Fluxo SYNAPSE e timeline), com `atlas/generate.mjs` gerando `data.js` a partir do vault. Cria também a skill `nexo-workflow/SKILL.md` (contrato operacional do agente). 1.722 linhas aditivas, nenhum arquivo existente alterado.
- **2026-09-14 · a3742de · feat(automation)** — Introduz o SYNAPSE, automação pós-commit: hook `post-commit` + orquestrador `synapse.sh` com fallback determinístico, idempotência por glob, lock de concorrência, instaladores bash/PowerShell e esqueleto de `changelog/` e `reports/`.
- **2026-09-14 · bd2daf9 · fix(automation)** — Corrige a passagem de parâmetros para os agentes de IA: caminhos Windows eram corrompidos pela conversão MSYS ao irem como argumento `-p`; agora `synapse.sh` exporta as env vars `SYNAPSE_*` e os prompts documentam o novo contrato.

## Em andamento

- Consolidação da automação SYNAPSE: fluxo completo ainda não validado de ponta a ponta com commit de prova (verificação de `.git/synapse.log` e artefatos), conforme pendência registrada na entrada a3742de.

## Próximos passos

- Rodar `node atlas/generate.mjs` sempre que o vault mudar (ou agendar via SYNAPSE) para evitar grafo desatualizado.
- Adicionar ao `AGENTS.md` do brain a referência ao Atlas como fonte visual de navegação.
- Testar o Atlas em mobile (pinch/touch no canvas não validado no diff).
- Validar em nova execução real a geração de relatório (agente 2) com o contrato por env vars, dado que falhas ali são não-fatais e silenciosas.
- Considerar validação das env vars esperadas no início de `synapse.sh` para facilitar diagnóstico.
- Confirmar que não existiam hooks personalizados em `.git/hooks` antes de instalar a automação em outros repos (`core.hooksPath` sobrescreve o diretório ativo).
- Adicionar `automation/config.env` ao `.gitignore` de forma preventiva.

## Notas técnicas

- Sem breaking changes nas três entregas; risco de regressão avaliado como baixo em todas (diffs 100% aditivos, exceto o fix de passagem de parâmetros, que elimina o ponto de falha anterior).
- Ponto de atenção: `atlas/data.js` é gerado e versionado — risco de dados obsoletos (não de quebra) se a regeneração não for disciplinada.
- Incerteza declarada na entrada a3742de: o instalador define `core.hooksPath=automation/hooks`, o que desativa hooks padrão que estivessem em `.git/hooks`.
