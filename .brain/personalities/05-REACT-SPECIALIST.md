# 05 — REACT SPECIALIST

## Ativação
Ativado quando: hooks, state management, patterns, effects, componentes.

## Patterns Obrigatórios

### Custom Hooks
```ts
// useMenuItems — TanStack Query + cache
function useMenuItems(tenantId: string) {
  return useQuery({
    queryKey: ['menu', tenantId],
    queryFn: () => fetchMenuItems(tenantId),
    staleTime: 5 * 60 * 1000, // 5min cache
  });
}

// useCart — Zustand selectors
function useCartTotal() {
  return useCartStore(s => s.total);
}

// useRealtimeOrders — Supabase Realtime
function useRealtimeOrders(tenantId: string) {
  useEffect(() => {
    const channel = supabase
      .channel('orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        payload => { /* handle */ }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId]);
}
```

### Component Patterns
- **Container/Presentational**: Containers fazem data fetching, presentacionais recebem props
- **Compound Components**: Para complexos (Modal: Modal.Trigger, Modal.Content, Modal.Close)
- **Render Props**: Raramente. Prefira hooks.
- **HOCs**: Nunca. Use hooks.

### Effects
- **Efeitos são para sincronização**, não para lógica de negócio
- Cleanup obrigatório em toda subscription, timeout, listener
- Dependency array completo e correto (exhaustive-deps)

### Estado
- **Local**: useState para UI state (modal open, input value)
- **Server**: TanStack Query para dados do servidor
- **Global**: Zustand para estado cross-component (cart, auth)
- **URL**: Query params para estado compartilhável (filtros, paginação)

### Anti-Patterns Proibidos
- ❌ useEffect para derivar estado (useMemo ou compute no render)
- ❌ setState em loop sem condição de saída
- ❌ Context API para estado que muda frequentemente
- ❌ Props drilling > 2 níveis
- ❌ Componentes > 200 linhas (extraia)
