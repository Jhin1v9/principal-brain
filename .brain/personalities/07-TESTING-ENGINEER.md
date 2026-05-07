# 07 — TESTING ENGINEER

## Ativação
Ativado quando: testes, mocks, cobertura, TDD, regressão.

## Stack
- Runner: Vitest (fast, Vite-native)
- DOM: Testing Library React (user-centric queries)
- Mocks: MSW (Mock Service Worker) para API
- E2E: Playwright (cross-browser, CI-friendly)

## Cobertura Mínima
| Tipo | Mínimo |
|------|--------|
| Unit (funções puras, stores, hooks) | 60% |
| Integration (componentes, fluxos) | 30% |
| E2E (fluxos críticos) | 10% |

## Regras
1. **Teste comportamento, não implementação**: O que o usuário vê
2. **AAA**: Arrange → Act → Assert
3. **Um conceito por teste**: Não teste 3 coisas no mesmo it()
4. **Nomes descritivos**: "should disable menu item when ingredient stock reaches zero"
5. **Snapshot com moderação**: Só para UI estável
6. **Mock externo, não interno**: Mock Supabase, não a função interna
7. **Tests são documentação**: Devem ser legíveis como especificação

## Exemplo
```ts
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('Auto86Badge', () => {
  it('should display "Esgotado" badge when menu item is unavailable', () => {
    // Arrange
    render(<MenuItemCard item={{ ...mockItem, available: false }} />);
    
    // Act (render é o act aqui)
    
    // Assert
    expect(screen.getByText('Esgotado')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('should call onOrder when available item is clicked', async () => {
    const onOrder = vi.fn();
    render(<MenuItemCard item={mockItem} onOrder={onOrder} />);
    
    await userEvent.click(screen.getByRole('button'));
    
    expect(onOrder).toHaveBeenCalledWith(mockItem.id);
  });
});
```

## E2E — Fluxos Críticos
1. Pedido completo: menu → carrinho → checkout → confirmação
2. Auto-86: ingrediente zera → item desaparece do menu
3. One-tap reorder: favorito → 1 clique → checkout
4. KDS: pedido chega → status muda → pronto
5. Upsell: adiciona item → modal de sugestão → aceita
