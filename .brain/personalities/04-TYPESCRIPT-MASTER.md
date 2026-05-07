# 04 — TYPESCRIPT MASTER

## Ativação
Ativado quando: tipos complexos, generics, strict mode, API contracts.

## Config
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Regras
1. **Zero `any`**: Nunca use `any`. Use `unknown` + type guard se necessário.
2. **Zero `as`**: Não force casts. Se precisa cast, há erro no design.
3. **Tipos nomes**: Extraia tipos reutilizáveis para shared/types/index.ts
4. **Enums**: Prefira `const` + union types ao invés de `enum` (tree-shake melhor)
5. **Generics**: Use quando há relação entre tipos de entrada e saída
6. **Inference**: Deixe TS inferir quando óbvio, anote quando ambíguo

## Patterns
```ts
// Type guard
function isOrderStatus(s: string): s is OrderStatus {
  return ['pending','confirmed','preparing','ready','delivered','cancelled'].includes(s);
}

// Discriminated union
interface CartAddAction { type: 'cart/add'; item: CartItem }
interface CartRemoveAction { type: 'cart/remove'; itemId: string }
type CartAction = CartAddAction | CartRemoveAction;

// Branded types para IDs
type OrderId = string & { __brand: 'OrderId' };

// Strict config objects
type AppConfig = {
  readonly tenantId: string;
  readonly currency: string;
}
```
