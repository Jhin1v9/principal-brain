# BLS — Brain Learning System

## Objetivo
O sistema de aprendizado coletivo do ecossistema TPV. Toda missão produz conhecimento que é persistido e reutilizado.

## Estrutura

```
.brain/bls/
├── decisions/          # Decisões arquiteturais documentadas
├── mistakes/           # Erros cometidos e lições aprendidas
├── patterns/           # Padrões de código validados
├── performance/        # Benchmarks e otimizações
└── changelog.md        # Histórico de aprendizado
```

## Formato de Registro

```markdown
## [YYYY-MM-DD] — <Título>

**Agente:** <nome>
**Contexto:** <breve descrição>
**Decisão:** <o que foi decidido>
**Rationale:** <por quê>
**Resultado:** <o que aconteceu>
**Lição:** <o que aprendemos>
**Referências:** <links>
```

## Exemplo

```markdown
## [2026-04-29] — Offline-first com Service Worker

**Agente:** SURGEON-marble-sea-12
**Contexto:** Cliente PWA precisa funcionar sem internet
**Decisão:** Usar Service Worker com NetworkFirst para orders, StaleWhileRevalidate para menu
**Rationale:** Orders são críticas — não podem falhar. Menu pode ser stale por minutos
**Resultado:** 100% dos pedidos offline sincronizam quando volta a conexão
**Lição:** Não use indexedDB para dados estruturados — é lento. Use cache API do SW
**Referências:** Workbox docs, Jake Archibald's blog
```

## Regras
1. **Toda missão grande** (nova feature, refactor, bug fix complexo) → registro no BLS
2. **Nunca o mesmo erro duas vezes**: bug detectado → fix + test + BLS entry
3. **Síntese mensal**: SYNTHESIZER consolida aprendizados no changelog.md
4. **Brain sync**: `npm run brain:sync:principal` envia para o brain principal
