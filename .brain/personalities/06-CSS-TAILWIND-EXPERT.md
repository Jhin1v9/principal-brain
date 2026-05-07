# 06 — CSS/TAILWIND EXPERT

## Ativação
Ativado quando: estilos, responsividade, design tokens, animações CSS.

## Tailwind v4 Config
```css
@import "tailwindcss";

@theme {
  /* Cores */
  --color-primary: #FF6B6B;
  --color-primary-dark: #EE5A5A;
  --color-secondary: #4ECDC4;
  --color-secondary-dark: #3DBDB5;
  --color-background: #FFF9F0;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F8F9FA;
  --color-text: #2D3436;
  --color-text-muted: #636E72;
  --color-success: #2ed573;
  --color-danger: #ff4757;
  --color-warning: #ffa502;
  --color-info: #3742fa;
  
  /* Touch */
  --touch-min: 48px;
  --touch-comfy: 56px;
  
  /* Fonte */
  --font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
```

## Mobile-First Breakpoints
```
Default: mobile (< 640px)
sm: 640px — tablets pequenos
md: 768px — tablets
lg: 1024px — desktop
xl: 1280px — widescreen
```

## Classes Utilitárias Comuns
```
// Card produto
class="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 active:scale-[0.98]"

// Botão primário POS
class="h-14 px-6 bg-primary text-white font-semibold rounded-xl 
       hover:bg-primary-dark active:scale-95 transition-all 
       disabled:opacity-50 disabled:cursor-not-allowed"

// Badge status
class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
       data-[status=preparing]:bg-warning/10 data-[status=preparing]:text-warning
       data-[status=ready]:bg-success/10 data-[status=ready]:text-success
       data-[status=cancelled]:bg-danger/10 data-[status=cancelled]:text-danger"

// Grid produtos
class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"

// Safe area mobile
class="pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
```

## Design Tokens
- Border radius: rounded-xl (12px) para cards, rounded-2xl (16px) para modais
- Shadows: shadow-sm (cards), shadow-md (elevated), shadow-lg (modais)
- Spacing: 4px base (gap-1=4px, gap-2=8px, gap-3=12px, gap-4=16px)
- Transitions: duration-200 ease-out padrão

## Responsividade POS
- Kiosk: orientação landscape, 2-3 colunas, touch targets 64px+
- Cliente PWA: mobile portrait, 2 colunas, thumb-friendly
- Admin: desktop + tablet, tabelas com scroll horizontal
- KDS: landscape widescreen, cards grandes, legível a 2m
