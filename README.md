# .BRAIN — NEXO DIGITAL (base de operações)

> Base operacional da Luna. Sincronizada com: WhatsApp, Notion, GitHub.

## EMPRESA

**Nome:** NEXO DIGITAL  
**Localização:** Sabadell, Espanha  
**Responsável:** Jhin  
**Equipe:** Elias, Jhin, Enoque  

## PROJETOS ATIVOS

| Projeto | Stack | Status | Responsável |
|---------|-------|--------|-------------|
| TPV_SORVETERIA | React+Vite+Tailwind+Supabase+Capacitor | Demo funcional, orçamento aprovado, aguardando fechamento | Elias, Jhin, Enoque |
| KOVA_VAULT | React+Supabase+Capacitor | Backend integrado, pagamento desativado | Jhin |
| SITEPULSE_QA | Electron+React+Node.js | Em desenvolvimento, bug detector CSS | Jhin |
| LUNA_SYNC | React Native/Flutter | Conceito inicial | — |
| VERIFACTUS | Node.js+React | Pesquisa fiscal (TicketBAI) | — |

## STACK PADRÃO

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Mobile:** Capacitor (Android) / PWA
- **Deploy:** Vercel (frontend) + GitHub (repo)
- **Desktop:** Electron
- **Automação:** PowerShell + GitHub Actions
- **Design:** Glassmorphism + Dark Mode + Space Grotesk + Inter

## PIPELINE CLIENTE

```
Formulário → Detecta cliente (novo/recorrente) → Classifica problema
→ Gera Prompt MASTER (.brain + segurança impenetrável + não genérico)
→ Atribui à equipe → Acompanha até entrega
```

## REGRAS .BRAIN

1. **NUNCA** entregue código quebrado ou incompleto
2. **NUNCA** use placeholders genéricos — use dados REAIS da memória
3. **NUNCA** simplifique a estética .brain sem permissão explícita
4. **NUNCA** ignore o contexto do projeto atual
5. **NUNCA** critique sem propor solução
6. **NUNCA** prometa o que não pode entregar
7. **SEMPRE** auto-critique antes de entregar
8. **SEMPRE** busque melhorias mesmo quando ninguém pede
9. **SEMPRE** documente decisões no .brain
10. **SEMPRE** aprenda com feedback e atualize regras

## PASTAS DOCUMENTOS (POR CLIENTE)

```
C:\Users\Administrator\Documents\NEXO DIGITAL\
├── CLIENTES\                              → Um folder POR CLIENTE
│   └── [NOME_CLIENTE]\                    → Ex: SORVETERIA_SABADELL
│       ├── DADOS\                         → Ficha, contrato, dados do cliente
│       │   └── FICHA.md                  → Ficha completa do cliente
│       ├── OPINIOES\                     → Feedback, reviews, sentimentos
│       ├── CHAT\                         → Interpretações de conversas
│       ├── RELATORIOS\                   → Relatórios deste cliente
│       └── PROJETOS\                     → Cada projeto deste cliente
│           └── [NOME_PROJETO]\            → Ex: TPV_SORVETERIA
│               ├── PROMPTS\              → Prompts MASTER deste projeto
│               ├── DEMOS\                → Protótipos/deliverables
│               ├── CODIGO\               → Código/repos do projeto
│               └── ENTREGAS\             → Versões entregues ao cliente
│
├── GITHUB_LEADS\                          → Leads detectados via formulário
├── RELATORIOS_GERAIS\                    → Relatórios da empresa (global)
├── novo_cliente.ps1                      → Script: criar novo cliente
└── .brain\README.md                       → Base operacional central
```

### Criar Novo Cliente
Execute o script `novo_cliente.ps1`:
```powershell
.\novo_cliente.ps1 -Nome "NOME_DO_CLIENTE"
```

---

_Atualizado: 2026-04-28_  
_Luna v1.0 — Sem desculpas. Sem atalhos. Apenas evolução constante._
