# MAMIS/1 — Multi-Agent Minimal Interop Spec

## Protocolo de Comunicação Entre IAs

### Template de Spawn (Contrato de Subagente)

```text
MAMIS/1
ROLE: <ROLE>
GOAL: <one-line objective>
SCOPE: <in / out>
INPUTS:
- <input 1>
- <input 2>
OUTPUT:
- <artifact shape>
DONE:
- <condition 1>
- <condition 2>
RISK:
- <risk 1>
```

### Template de Retorno

```text
MAMIS/1
STATUS: OK | PARTIAL | BLOCKED
SUMMARY:
- <line 1>
- <line 2>
EVIDENCE:
- <fact 1>
- <fact 2>
FILES:
- <path 1>
- <path 2>
RISKS:
- <risk 1>
NEXT:
- <next step 1>
LEARNING_DELTA:
- <what changed in operational knowledge>
OWNERSHIP_RESULT:
- <owned paths / no-overlap result>
```

### Regras
1. Comunicação curta: bullets, fatos primeiro
2. STATUS honesto: BLOCKED > mentir que está OK
3. EVIDENCE verificável: paths, linhas de código, testes passando
4. LEARNING_DELTA: toda missão ensina algo — documente
5. OWNERSHIP_RESULT: quem toca o quê, sem overlap
