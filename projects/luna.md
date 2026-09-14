## Relatório — Luna (IA da casa)

**O que é.** A assistente de IA da Nexo Digital. Vive no chat do workspace do cliente: tira dúvidas, guia o wizard de novas solicitações, cobra 1 crédito por mensagem (clientes não-staff) e sabe pedir ajuda humana (handoff) quando precisa.

**Arquitetura.** API de chat `POST /api/chat/ai` (workspace-cliente) usando DeepSeek (`deepseek-chat`). Conversas persistidas em `AiConversation`/`AiMessage`; o admin revisa e apaga em `/nexo/es/chat-revision`. Uploads da IA em `/data/uploads/chat`. Rate limit de 20 mensagens/hora por usuário, bloqueio de prompt injection. Repositórios: `brain-luna` (base operacional/consciência compartilhada), `luna-dashboard` e `luna-bridge` (org).

**Operação.** Alertas de nova solicitação e handoff chegam no grupo do Telegram (`@lunanexobot`).
