# SYNAPSE — automação pós-commit com agente de IA

Sistema de "harness de agente" que roda **após cada `git commit`**: um agente de
IA (Kimi Code CLI, modo não interativo) classifica o commit, grava uma entrada
estruturada em `changelog/entries/`, consolida o `CHANGELOG.md` e mantém o
relatório vivo `reports/latest.md` — tudo **sem bloquear o commit** (o hook
dispara o trabalho de forma assíncrona).

Regra de comunicação da Nexo Digital aplicada aqui: relatório em linguagem
**técnica** (equipe de engenharia) e, em cada entrada, uma **nota pronta para o
cliente** em linguagem de leigo (benefício, sem jargão, sem internals).

## Como funciona

```
git commit ──► post-commit (async, <1s, nunca bloqueia)
                     │
                     ▼
              synapse.sh (orquestrador, lockfile + idempotência)
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
  IA disponível              IA ausente/falha/desativada
  kimi -p --agent-file       FALLBACK determinístico em shell:
  ├─ classify-commit            entrada básica em
  │   → entries/*.md            changelog/entries/ + CHANGELOG.md
  │   → CHANGELOG.md            (sem relatório)
  └─ generate-report
      → reports/latest.md
```

- **Hook `post-commit`**: coleta hash, autor, data, mensagem, `diff --stat` e
  arquivos tocados num JSON temporário em `.git/`, aplica guards de
  idempotência (entrada `*-<hash>.md` já existe?) e concorrência (lockfile com
  PID) e dispara `synapse.sh` detached (`nohup … &`). Qualquer falha → `exit 0`
  silencioso: o commit nunca espera a IA.
- **Orquestrador `synapse.sh`**: verifica `SYNAPSE_DISABLE` e a existência do
  binário Kimi. No caminho da IA, invoca `kimi -p --agent-file` duas vezes
  (classificador → relatório), com CWD = raiz do repo; o **agente é quem
  escreve os arquivos**, seguindo os prompts em `prompts/`. Se a IA falhar,
  o shell mesmo grava a entrada básica (fallback) e o `CHANGELOG.md`.
- **Auto-commit**: ao final, se `SYNAPSE_AUTO_COMMIT=1` (padrão), o orquestrador
  commita os artefatos (`changelog/entries/`, `CHANGELOG.md`, `reports/latest.md`)
  com a mensagem `chore(synapse): registro do commit <hash> [synapse]`. O hook
  ignora commits cuja mensagem contenha `[synapse]`, então **não há loop
  infinito**. Desative com `SYNAPSE_AUTO_COMMIT=0` para deixar os artefatos no
  working tree.
- **Logs de debug**: `.git/synapse.log` (dentro de `.git/`, fora do histórico).

## Instalação

No **principal-brain** (ou em qualquer repo que contenha a pasta `automation/`):

```bash
bash automation/install.sh                 # Linux / Git Bash
```

```powershell
.\automation\install.ps1                   # PowerShell nativo (Windows)
```

O instalador verifica que está na raiz de um repo git (aceita o caminho como
primeiro argumento: `bash automation/install.sh /caminho/outro-repo`), configura
`git config core.hooksPath automation/hooks` e torna os scripts executáveis.

Para instalar em **outro repo**, copie a pasta `automation/` inteira para a
raiz dele e rode o instalador a partir de lá.

## Configuração

Opcional — copie o exemplo e ajuste:

```bash
cp automation/config.env.example automation/config.env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `KIMI_BIN` | `kimi` | binário do Kimi Code CLI (PATH ou caminho absoluto) |
| `KIMI_MODEL` | _(vazio)_ | modelo opcional passado ao CLI |
| `KIMI_TIMEOUT` | `0` | timeout por invocação em segundos (0 = sem) |
| `SYNAPSE_DISABLE` | `0` | `1` desativa a IA (fallback ainda grava entrada básica) |
| `SYNAPSE_AUTO_COMMIT` | `1` | `1` commita os artefatos sozinho (marca `[synapse]`, sem loop) |
| `SYNAPSE_ENTRIES_DIR` | `changelog/entries` | pasta das entradas |
| `SYNAPSE_CHANGELOG` | `changelog/CHANGELOG.md` | índice consolidado |
| `SYNAPSE_REPORT` | `reports/latest.md` | relatório vivo |

Precedência: `automation/config.env` > variáveis de ambiente > padrões.

## Saídas

- `changelog/entries/<YYYY-MM-DD>-<hash-curto>.md` — análise completa por
  commit (frontmatter YAML: tipo, escopo, impacto, breaking, risco de regressão
  + corpo: Resumo técnico / Análise / Nota para o cliente / Recomendações).
- `changelog/CHANGELOG.md` — índice, mais novo no topo.
- `reports/latest.md` — relatório vivo, linguagem técnica, seções fixas:
  Entregues / Em andamento / Próximos passos / Notas técnicas.

## Desinstalação

```bash
git config --unset core.hooksPath
```

Nada mais precisa ser removido (as pastas `changelog/` e `reports/` são dados,
não código). Para reinstalar, rode o instalador de novo.

## Portabilidade e detalhes técnicos

- Bash portátil (Git Bash do Windows **e** Linux); `.gitattributes` força LF em
  `automation/**`, `changelog/**` e `reports/**` para hooks não quebrarem com
  CRLF.
- O hook resolve a raiz do repo via `git rev-parse --show-toplevel` e localiza
  `automation/` a partir dela — funciona em worktrees e subdiretórios.
- Idempotência: um hash nunca gera duas entradas (guard no hook **e** no
  orquestrador). Concorrência: lockfile com PID em `.git/synapse.lock`, com
  recuperação de lock morto.
- O commit em si mede <1s: todo o trabalho pesado acontece num processo
  detached cujos descritores são redirecionados para `.git/synapse.log`.
