# Incidente 2026-09-25 — Fluxo de chamada de voz não atende

## Relato (Abner, DM WhatsApp, 05:41–05:45)

"FLUXO DE CHAMADA NO KIMI WORK FUNCIONAVA MAS AGORA TO TENTANDO LIGAR E VC NÃO ATENDE NÃO FAZ NADA — REPORTA ISSO" (ordem direta: reportar pro Kimi CLI).

## Contexto

- Chamadas de voz têm automação própria (fora da varredura geral — decreto do sweep).
- Em 24/09 o Kimi Code (brain primário) estava com quota semanal estourada (403), motivo do modo kimiwork/reserva.
- Hipótese forte: o fluxo de chamadas depende do brain primário (Kimi CLI / kimi-api); com a quota esgotada, a chamada não é atendida nem processada ("não atende, não faz nada").
- Antes funcionava no Kimi Work — possível regressão ou o fluxo de chamada foi movido pro brain primário.

## Ações tomadas pela varredura (Luna)

1. Incidente registrado neste arquivo.
2. Outcome negativo no brain remoto.
3. Reporte enviado no grupo do Telegram do time (canal visível ao time e ao Kimi CLI se monitorado).
4. DM do Abner respondido com explicação e oferta de alternativa.

## Atualização 06:50 — diagnóstico completo (Luna)

1. **Nova API key REST: INVÁLIDA.** `LLM_API_KEY` e `KIMI_API_KEY_2` dão 401 em api.moonshot.ai E api.moonshot.cn. A troca de login matou a key antiga; a "nova api" no .env não está autenticando.
2. **Kimi Web local: SAÚVEL.** Servidor kimi-code 2.1.1 em 127.0.0.1:58627, auth via `~/.kimi-code/server.token`. Login novo ATIVO (usuário "NexoDigital Systemas", REGION_OVERSEA). **Quota 0% usada** (limit5h e limit7d zerados) — NÃO é quota. Provider `managed:kimi-code` authenticated, models_ready.
3. **Turn via REST funciona e está mapeado:** `POST /api/v1/sessions/{id}/prompts` com `{content:[{type:'text',text}]}`. WS `/api/v1/ws` é protocolo v2 (client_hello/subscribe/abort/ping — só eventos e controle; turn NÃO vai por WS).
4. **O reporte já chegou no Kimi CLI:** sessão `session_bac9fffb` busy desde 06:40 editando `detectIncomingCall`/`getStatus` no repo — o brain primário está resolvendo o fluxo de chamadas AGORA.
5. Ressalva: sessões criadas via API pura (permission manual) tiveram turn fail silencioso (`last_turn_reason: failed`); sessão criada pela UI com permission auto funciona. Causa em aberto — possível single-flight enquanto a sessão principal está busy.

## Pendente (humano / Kimi CLI)

- Gerar API key da conta nova (NexoDigital Systemas) e atualizar `LLM_API_KEY` no .env se quiser o modo kimi-api de volta.
- Kimi CLI: continuar o fix do fluxo de chamadas (já em andamento na sessão dele) + validar com ligação de teste.
- Fix futuro no adapter KimiWebAdapter do luna-agent: implementar `sendTurn` via POST /prompts + poll de mensagens (hoje lança KimiWebTurnError — ADR-015 desatualizado, protocolo agora é conhecido).
