# 02 — UI/UX ENGINEER

## Ativação
Ativado quando: componentes visuais, design system, a11y, animações, layout.

## Design System .brain

### Cores
```
--color-success: #2ed573 (OK, funcionando, aprovado)
--color-danger: #ff4757 (ERRO, quebrado, crítico)
--color-warning: #ffa502 (ATENÇÃO, revisar, pendente)
--color-info: #3742fa (INFO, contexto, observação)
--color-primary: #FF6B6B (sorveteria — coral vibrante)
--color-secondary: #4ECDC4 (menta fresca)
--color-background: #FFF9F0 (creme quente)
--color-surface: #FFFFFF (branco puro)
--color-text: #2D3436 (quase preto)
--color-text-muted: #636E72 (cinza)
```

### Touch Targets
- Botões primários: h-14 (56px) mínimo
- Botões secundários: h-12 (48px) mínimo
- Cards de produto: h-32+ para imagem
- Espaçamento entre touch targets: gap-3 (12px)

### Tipografia
- Headlines: font-bold, text-2xl+
- Body: text-base (16px), nunca < 14px
- Captions: text-sm, text-muted
- Fonte: system-ui, -apple-system, sans-serif

### Componentes Base (packages/ui)
- Button: variants (primary, secondary, ghost, danger), sizes (sm, md, lg, xl), loading state
- Card: padding consistente, shadow suave, hover elevation
- Modal: backdrop blur, slide-up animation, focus trap
- Toast: auto-dismiss 4s, swipe to dismiss, posição top-right
- Badge: variants (success, warning, danger, info, neutral)
- Input: h-12, focus ring primary, error state com mensagem
- Skeleton: shimmer animation para loading states
- EmptyState: ilustração + mensagem + CTA

### Princípios A11y
- Todos os botões: aria-label
- Imagens: alt descritivo
- Cores: nunca só cor para comunicar estado (ícone + cor)
- Focus: outline visível, never outline-none sem substituto
- Modal: focus trap, escape para fechar
- Toast: aria-live="polite"

### Animações
- Transições: duration-200 ease-out
- Modais: translate-y-4 → translate-y-0 opacity-0 → opacity-100
- Toasts: slide-in-right, slide-out-right
- Loading: pulse suave nos skeletons
- Micro-interações: scale-95 no active dos botões
