# 🔴 TRANSFORMAÇÃO DEMO → PRODUTO REAL
## TPV Sorveteria Tropicale — Plano Mestre de Produção

> **Status:** Rascunho v0.1 | **Autor:** KIMI (post-auditoria) | **Data:** 2026-04-26  
> **Baseado em:** RELATORIO_AUDITORIA_SEGURANCA_TPV_SORVETERIA.md (35 vulnerabilidades)  
> **Regra Canônica:** [[principal-brain-governance]] — este documento governa todas as decisões de arquitetura.

---

## 📊 RESUMO EXECUTIVO

A demo atual é **funcional como MVP** mas **insegura para produção**. Existem **35 vulnerabilidades catalogadas** (11 críticas, 9 altas, 8 médias, 5 baixas, 2 info) que tornam impossível o deploy em ambiente real sem remediação prévia.

**Bloqueadores de Produção:**
1. 🔴 **Credenciais expostas** — Supabase anon key em 4 `vercel.json` + bundles + `.env.local`
2. 🔴 **Banco de dados aberto** — RLS policies `using (true)` permitem acesso total a `anon`
3. 🔴 **Autenticação inexistente** — Admin com senha `123456` client-side; KDS sem login; sem Supabase Auth
4. 🔴 **Edge functions sem auth** — qualquer um cria PaymentIntents Stripe, envia comprovantes, reseta dados
5. 🔴 **Dados PII + saúde (alergias) em localStorage** sem criptografia

**Horizonte de trabalho estimado:** 3-4 semanas de desenvolvimento focado (1 dev full-time).

---

## 🎯 VISÃO DE PRODUTO FINAL

### O que é "Produção" para este projeto?

Um sistema TPV (Terminal Punto de Venta) para sorveteria com:

| Canal | Usuário | Auth | Dados Sensíveis |
|-------|---------|------|-----------------|
| **Cliente PWA** | Cliente final | OTP por telefone (Supabase Auth) | Nome, tel, alergias |
| **Kiosk** | Cliente no balcão | Nenhum (público) | Apenas pedido atual |
| **Admin** | Gerente/Dono | Supabase Auth (email + 2FA opcional) | Vendas, estoque, configs |
| **KDS** | Cozinheiro | PIN de 4 dígitos ou Supabase Auth role `staff` | Pedidos em tempo real |
| **Edge Functions** | Sistema | JWT obrigatório | Transações Stripe, comprovantes |

---

## 🏗️ ARQUITETURA ALVO (Produção)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Cliente PWA │  │   Kiosk     │  │    Admin    │  │     KDS     │ │
│  │  (React)    │  │  (React)    │  │  (React)    │  │  (React)    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┴────────────────┴────────────────┘        │
│                              │                                      │
│                    Vercel CDN (4 projetos)                          │
│                    CSP + Headers de Segurança                       │
│                    .env injetado no build (NUNCA no repo)           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (BaaS)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │   PostgreSQL    │  │  Edge Functions │  │   Supabase Auth     │  │
│  │  + RLS Strict   │  │  + JWT Auth     │  │  OTP / Magic Link   │  │
│  │  + Policies     │  │  + Rate Limit   │  │  + Roles (RBAC)     │  │
│  │  + Audit Log    │  │  + CORS Restrito│  │  + MFA opcional     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Realtime (WebSocket)                        │  │
│  │   Canal isolado por `order_id` + role-based subscription      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVIÇOS EXTERNOS                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Stripe    │  │  SendGrid   │  │   VAPID     │  │   Resend    │ │
│  │  (Pagamentos)│  │  (Email)    │  │  (Push Web) │  │ (Fallback)  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Princípios Arquiteturais

1. **Zero Trust no Frontend** — O frontend é inseguro por definição. Toda validação de permissão acontece no backend (RLS + Edge Functions).
2. **Menor Privilégio** — Cada role vê apenas o que precisa. `anon` tem acesso mínimo (apenas leitura de catálogo público).
3. **Dados Sensíveis Nunca no localStorage** — PII vai para o banco (Supabase) com RLS. Nada de saúde/alergias no browser sem criptografia.
4. **Separação de Ambientes** — `dev`, `staging`, `prod` com projetos Supabase e Vercel distintos.
5. **Auditabilidade** — Toda ação administrativa gera log. Todo pedido tem `created_by`, `updated_by`.

---

## 📋 PLANO DE REMEDIAÇÃO (4 FASES)

### FASE 1 — CONTENÇÃO IMEDIATA (0-24h)
> **Objetivo:** Parar o sangramento. Nenhum dado novo pode ser comprometido.

| # | Ação | Como | Risco se não fizer |
|---|------|------|-------------------|
| 1.1 | **Rotacionar Supabase Anon Key** | Dashboard → Settings → API → Project API Keys → Rotate | Qualquer um com a key antiga acessa o banco |
| 1.2 | **Revogar Moonshot AI Secret Key** | Dashboard Moonshot → Revoke → Gerar nova | Uso não autorizado da API |
| 1.3 | **Remover `.env.local` do repo** | `git rm --cached .env.local` + commit | Commit acidental expõe secrets |
| 1.4 | **Remover chaves dos 4 `vercel.json`** | Deletar bloco `env` de todos os `apps/*/vercel.json` | Chaves no código-fonte público |
| 1.5 | **Configurar env vars no Vercel Dashboard** | Settings → Environment Variables (4 projetos) | Injecção segura no build |
| 1.6 | **NÃO fazer deploy** até Fase 2 completa | Freeze nos deploys | Bundles antigos com keys expostas |
| 1.7 | **Backup do banco** | Supabase Dashboard → Database → Backups | Ponto de restauração antes das mudanças |

**Scripts de verificação:**
```bash
# Verificar se nenhuma key está no código
grep -r "sb_publishable" apps/ --include="*.{json,ts,tsx,js}"
grep -r "sk-TYf4SbYZRos2ZEQQehmtP0HgLZrnYypLFcc0YfvdWmFOoPXf" . --include="*"
```

---

### FASE 2 — FORTALEZA (1-3 dias)
> **Objetivo:** Banco seguro, edge functions autenticadas, CORS restrito.

#### 2.1 Schema de Segurança (SQL)

**A. Remover `anon` de TODAS as policies:**
```sql
-- Revogar grants de anon em TODAS as RPCs administrativas
REVOKE EXECUTE ON FUNCTION public.create_order(jsonb, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_order_status(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.adjust_flavor_stock(text, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_flavor_availability(text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_product_availability(text, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_store_settings(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_customer(text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.restore_demo_data() FROM anon;
REVOKE EXECUTE ON FUNCTION public.debit_flavor_stock(text, numeric, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_flavor_consumption(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_kiosk_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_kiosk_code(text) FROM anon;

-- Manter apenas para authenticated (que será validado via JWT)
GRANT EXECUTE ON FUNCTION public.create_order(jsonb, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text) TO authenticated;
-- ... etc para funções que precisam ser chamadas pelo app
```

**B. Habilitar RLS em tabelas sem proteção:**
```sql
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Policy para payment_transactions: usuário só vê as próprias
CREATE POLICY payment_transactions_select_own
  ON public.payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY payment_transactions_insert_own
  ON public.payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy para receipts
CREATE POLICY receipts_select_own
  ON public.receipts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

**C. Policies restritivas para tabelas principais:**
```sql
-- Customers: usuário só vê/altera o próprio registro
DROP POLICY IF EXISTS customers_read ON public.customers;
DROP POLICY IF EXISTS customers_insert ON public.customers;
DROP POLICY IF EXISTS customers_update ON public.customers;

CREATE POLICY customers_select_own
  ON public.customers FOR SELECT
  TO authenticated
  USING (auth.uid() = id::uuid OR auth.uid() = auth_uid);

CREATE POLICY customers_insert_own
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id::uuid OR auth.uid() = auth_uid);

CREATE POLICY customers_update_own
  ON public.customers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id::uuid OR auth.uid() = auth_uid);

-- Orders: usuário só vê os próprios pedidos
DROP POLICY IF EXISTS orders_read ON public.orders;
DROP POLICY IF EXISTS orders_insert ON public.orders;

CREATE POLICY orders_select_own
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id::uuid OR auth.uid() = auth_uid);

CREATE POLICY orders_insert_own
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id::uuid OR auth.uid() = auth_uid);

-- Order Items: acessível via orders (cascata)
DROP POLICY IF EXISTS order_items_read ON public.order_items;
DROP POLICY IF EXISTS order_items_insert ON public.order_items;

CREATE POLICY order_items_select_own
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE auth.uid() = customer_id::uuid OR auth.uid() = auth_uid
    )
  );
```

**D. Tabela de auditoria:**
```sql
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_admin_only
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
```

#### 2.2 Edge Functions Hardening

**create-payment-intent:**
```typescript
// Antes de criar PaymentIntent:
const authHeader = req.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
}

// Validar JWT com Supabase
const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
if (authError || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders });
}

// Rate limiting simples (por IP)
const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
const rateKey = `rate_limit:payment:${clientIP}`;
// ... (implementar com Redis ou KV do Supabase)

// Validar amount máximo
if (!amount || amount <= 0 || amount > 50000) { // max 500 EUR
  return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400, headers: corsHeaders });
}
```

**CORS restrito:**
```typescript
const ALLOWED_ORIGINS = [
  'https://cliente-pearl.vercel.app',
  'https://kiosk-swart-delta.vercel.app',
  'https://admin-ten-vert-54.vercel.app',
  'https://kds-one.vercel.app',
  'http://localhost:5173',  // dev
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
];

function getCorsHeaders(origin: string) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}
```

#### 2.3 Frontend — Remover Senha Hardcoded

**apps/admin/src/pages/LoginScreen.tsx:**
```typescript
// REMOVER completamente a lógica de senha hardcoded
// Substituir por:
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (error) { toast.error('Credenciais inválidas'); return; }
// Verificar role admin
const { data: profile } = await supabase.from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single();
if (profile?.role !== 'admin') {
  await supabase.auth.signOut();
  toast.error('Acesso restrito a administradores');
  return;
}
```

---

### FASE 3 — AUTENTICAÇÃO REAL (1-2 semanas)
> **Objetivo:** Supabase Auth funcional, roles implementadas, PII fora do localStorage.

#### 3.1 Supabase Auth — Cliente PWA

**Fluxo OTP por Telefone:**
```
Cliente informa telefone → Supabase envia SMS com código → Cliente digita código → Sessão JWT criada → Perfil vinculado
```

**Implementação:**
```typescript
// packages/shared/src/stores/useStore.ts
// REMOVER authMock completamente
// Substituir loginByPhone por:
loginByPhone: async (telefone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: normalizePhone(telefone),
  });
  if (error) throw error;
  return { needsVerification: true };
},

verifyOtp: async (telefone: string, codigo: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizePhone(telefone),
    token: codigo,
    type: 'sms',
  });
  if (error) throw error;
  // Criar/atualizar perfil no banco
  const { data: profile } = await supabase.from('profiles')
    .upsert({
      id: data.user.id,
      telefone: normalizePhone(telefone),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single();
  set({ perfilUsuario: profile });
},
```

#### 3.2 Tabela `profiles` (extensão do auth.users)

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  email text,
  telefone text UNIQUE,
  tem_alergias boolean DEFAULT false,
  alergias jsonb DEFAULT '[]',
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger para criar profile automaticamente ao criar user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'customer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 3.3 KDS — Autenticação por PIN

**Opção A (Simples):** PIN de 4 dígitos compartilhado, validado via Edge Function.
```typescript
// supabase/functions/verify-kds-pin/index.ts
const { pin } = await req.json();
const { data: setting } = await supabase.from('store_settings')
  .select('setting_payload')
  .eq('key', 'kds_pin')
  .single();

if (setting?.setting_payload?.pin !== pin) {
  return new Response(JSON.stringify({ error: 'PIN inválido' }), { status: 401 });
}
// Retornar token temporário (JWT curto, 8h)
const { data: { session }, error } = await supabase.auth.admin.createUser({
  email: `kds-${Date.now()}@temp.local`,
  role: 'staff',
});
```

**Opção B (Robusta):** Supabase Auth com role `staff` +Magic Link enviado para email do funcionário.

#### 3.4 Remover PII do localStorage

**packages/shared/src/stores/useStore.ts:**
```typescript
// ANTES (inseguro):
// persist: createJSONStorage(() => localStorage),
// partialize: (state) => ({ locale: state.locale, perfilUsuario: state.perfilUsuario }),

// DEPOIS (seguro):
persist: createJSONStorage(() => localStorage),
partialize: (state) => ({
  locale: state.locale,
  // perfilUsuario REMOVIDO — vem do Supabase Auth + banco
}),
```

**Cliente carrega perfil do banco:**
```typescript
useEffect(() => {
  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      set({ perfilUsuario: profile });
    }
  };
  loadProfile();
}, []);
```

#### 3.5 Stripe Elements (PCI-DSS)

**apps/cliente/src/components/pagamento/PagamentoModal.tsx:**
```typescript
// REMOVER:
// const [numero, setNumero] = useState('');
// const [titular, setTitular] = useState('');
// const [caducidad, setCaducidad] = useState('');
// const [cvv, setCvv] = useState('');

// SUBSTITUIR POR:
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pedido/confirmado`,
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pagar</button>
    </form>
  );
}
```

---

### FASE 4 — PRODUÇÃO (1 semana)
> **Objetivo:** Infraestrutura de produção, monitoramento, compliance.

#### 4.1 Separação de Ambientes

| Ambiente | Supabase Project | Vercel Projects | Dados |
|----------|-----------------|-----------------|-------|
| **Dev** | `dproxlygtabihfhtxdvm-dev` | `*.vercel.app` (preview) | Fake/Sandbox |
| **Staging** | `dproxlygtabihfhtxdvm-staging` | `*.vercel.app` (preview) | Demo limpo |
| **Prod** | `dproxlygtabihfhtxdvm` (atual) | `*.vercel.app` (domínios custom) | Dados reais |

#### 4.2 Headers de Segurança (Vercel)

**apps/*/vercel.json (produção):**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
      ]
    }
  ]
}
```

#### 4.3 Content Security Policy

**apps/*/index.html:**
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self' 'unsafe-inline' https://js.stripe.com;
           style-src 'self' 'unsafe-inline';
           img-src 'self' https: data: blob:;
           connect-src 'self' https://dproxlygtabihfhtxdvm.supabase.co https://api.stripe.com wss://dproxlygtabihfhtxdvm.supabase.co;
           frame-src https://js.stripe.com https://hooks.stripe.com;
           font-src 'self';
           object-src 'none';
           base-uri 'self';
           form-action 'self';
           upgrade-insecure-requests;">
```

#### 4.4 Build — Remover Console Logs

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

#### 4.5 Monitoramento

| Ferramenta | Propósito | Custo Estimado |
|------------|-----------|---------------|
| **Sentry** | Error tracking, performance | Gratuito (5k events/mês) |
| **Supabase Reports** | Query performance, RLS hits | Incluído no plano |
| **Vercel Analytics** | Web Vitals, tráfego | Incluído no plano Pro |
| **Stripe Dashboard** | Transações, disputes | Taxa por transação |

#### 4.6 Compliance — Verifactu / TicketBAI

Para operação na Espanha (Catalunha):
- **Verifactu** (nacional): Faturas eletrônicas para Hacienda
- **TicketBAI** (País Basco): Similar, regional
- Implementar geração de QR fiscal no comprovante
- Integrar com software certificado de faturação

**Simplificação para MVP:** Usar Stripe como registro de transação e exportar relatório mensal para contador.

---

## 📦 CHECKLIST DE IMPLEMENTAÇÃO

### Pre-Deploy (Bloqueador)
- [ ] 1.1 Rotacionar Supabase Anon Key
- [ ] 1.2 Revogar Moonshot AI Secret Key
- [ ] 1.3 Remover `.env.local` do repo (`git rm --cached`)
- [ ] 1.4 Remover chaves dos 4 `vercel.json`
- [ ] 1.5 Configurar env vars no Vercel Dashboard
- [ ] 1.6 Backup do banco

### Fase 2 — Fortaleza
- [ ] 2.1 Executar `REVOKE` em todas as RPCs para `anon`
- [ ] 2.2 Habilitar RLS em `payment_transactions` e `receipts`
- [ ] 2.3 Criar policies restritivas (`auth.uid()`) para customers, orders, order_items
- [ ] 2.4 Criar tabela `audit_log`
- [ ] 2.5 Adicionar auth + rate limiting em `create-payment-intent`
- [ ] 2.6 Adicionar verificação de propriedade em `send-receipt`
- [ ] 2.7 Restringir CORS em todas as edge functions
- [ ] 2.8 Remover senha `123456` do admin (tela mock)
- [ ] 2.9 Remover `authMock.ts` do projeto
- [ ] 2.10 Rebuild de todos os apps
- [ ] 2.11 Deploy para staging

### Fase 3 — Autenticação
- [ ] 3.1 Configurar Supabase Auth (SMS provider: Twilio/MessageBird)
- [ ] 3.2 Criar tabela `profiles` + trigger `handle_new_user`
- [ ] 3.3 Implementar OTP por telefone no Cliente PWA
- [ ] 3.4 Implementar login por email/senha no Admin
- [ ] 3.5 Implementar PIN ou auth no KDS
- [ ] 3.6 Remover PII do localStorage (Zustand partialize)
- [ ] 3.7 Migrar `perfilUsuario` para `profiles` no banco
- [ ] 3.8 Substituir formulário de cartão por Stripe Elements
- [ ] 3.9 Adicionar role checks nas páginas admin
- [ ] 3.10 Testar E2E: registro → login → pedido → pagamento → KDS

### Fase 4 — Produção
- [ ] 4.1 Criar projetos Supabase dev/staging
- [ ] 4.2 Criar projetos Vercel dev/staging
- [ ] 4.3 Configurar headers de segurança nos `vercel.json`
- [ ] 4.4 Adicionar CSP nos `index.html`
- [ ] 4.5 Configurar `drop_console` no build
- [ ] 4.6 Configurar Sentry
- [ ] 4.7 Documentar runbook de incidentes
- [ ] 4.8 Testes de carga (kiosks simultâneos)
- [ ] 4.9 Pentest básico (OWASP ZAP)
- [ ] 4.10 Go-live!

---

## 💰 ESTIMATIVA DE CUSTOS (Mensal)

| Serviço | Plano | Custo |
|---------|-------|-------|
| **Supabase** | Pro | $25/mês |
| **Vercel** | Pro (4 projetos) | $40/mês ($10×4) |
| **Stripe** | Pay-as-you-go | 1.5% + €0.25 por transação |
| **SMS (Twilio)** | Pay-as-you-go | ~€0.05 por SMS de OTP |
| **Sentry** | Developer | Grátis (até 5k events) |
| **Domínio** | .com/.es | ~€12/ano |
| **SSL** | Let's Encrypt | Grátis |
| **Total infra** | | **~€75-100/mês** |

---

## 🔗 REFERÊNCIAS

- [[RELATORIO_AUDITORIA_SEGURANCA_TPV_SORVETERIA]] — Fonte primária (35 vulnerabilidades)
- [[SUPREME_RUNTIME_GUARDRAILS]] — Checks obrigatórios antes de mudanças em runtime crítico
- [[agent-swarm-hardening-master-plan]] — 6 fases de hardening do swarm
- [[domain]] — Glossário de negócio e regras críticas
- [[stack]] — Stack técnico completo

---

## 📝 HISTÓRICO DE REVISÕES

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| v0.1 | 2026-04-26 | KIMI | Documento inicial pós-auditoria |

---

> **Próximo passo:** Aprovar este plano e iniciar Fase 1 (contenção imediata).
