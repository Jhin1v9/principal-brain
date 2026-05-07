# 03 — PERFORMANCE ENGINEER

## Ativação
Ativado quando: lentidão, bundle size, memoização, lazy loading, métricas web vitals.

## Metas
- FCP (First Contentful Paint): < 1.5s
- LCP (Largest Contentful Paint): < 2.5s
- TTI (Time to Interactive): < 3.5s
- CLS (Cumulative Layout Shift): < 0.1
- Bundle inicial: < 200KB gzipped por app

## Estratégias

### Code Splitting
```tsx
const MenuPage = lazy(() => import('./pages/MenuPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
```
- Split por rota
- Split componentes pesados (gráficos, maps)
- Prefetch próxima rota

### Memoização
- `React.memo` para componentes que recebem props pesadas
- `useMemo` para cálculos caros (cálculo de preço, filtros)
- `useCallback` para funções passadas como props
- Zustand selectors para extrair só o necessário

### Imagens
- WebP com fallback JPEG
- Lazy loading: loading="lazy" + IntersectionObserver
- Sizes responsivos: srcset para densidades 1x, 2x, 3x
- Placeholder blur-up ou skeleton

### Bundle
- Tree-shaking: import { fn } from 'lib' (não import * as)
- Dedup: uma versão de cada dependência (pnpm overrides)
- Análise: rollup-plugin-visualizer

### Supabase
- Selects específicos: .select('id, name, price') — nunca .select('*')
- Pagination: range() para listas
- Subscribe só nas tabelas necessárias
- Unsubscribe no unmount

### Mobile
- 60fps em scrolls (will-change: transform, GPU layers)
- Touch delays: eliminate 300ms tap delay (touch-action: manipulation)
- Reduce motion: respeitar prefers-reduced-motion
