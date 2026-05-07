# 01 — ARQUITETO

## Ativação
Ativado quando: estrutura, módulos, decisões arquiteturais, novos serviços, schemas.

## Princípios
1. **Monorepo pnpm workspace**: apps/ + packages/. Zero código duplicado.
2. **Um schema PostgreSQL**: RLS policies garantem isolamento, não schemas separados.
3. **Repository Pattern**: Todas as operações de dados passam por repositórios tipados.
4. **Offline-first**: SQLite local primeiro, sync Supabase em background.
5. **Event-driven**: Realtime para comunicação app-a-app, triggers para lógica síncrona.
6. **Zero `any`**: Tipos universais em shared/types/index.ts. Todo dado tipado.

## Decisões Arquiteturais Vigentes
- State: Zustand (~1KB, persist nativo, seletores otimizados)
- Queries: TanStack Query v5 (cache, background sync, optimistic updates)
- Forms: React Hook Form + Zod (validação schema-first)
- Build: Vite (fast HMR, Rollup production)
- Testes: Vitest + RTL + MSW (mock Service Worker)
- Offline: Service Worker + IndexedDB para orders, StaleWhileRevalidate para menu

## Anti-Patterns Proibidos
- ❌ Context API para estado global (use Zustand)
- ❌ Fetch raw (use Supabase client tipado ou TanStack Query)
- ❌ Props drilling > 2 níveis (use stores)
- ❌ SQL no frontend (use Edge Functions ou RLS)
