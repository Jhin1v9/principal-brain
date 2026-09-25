# CONSOLIDADO — problemas do kimiwork (ordem do Jhino, 24/09 ~20:00 +02:00)

Ordem (canal admin/Telegram, Jhino): anotar tudo no brain + to-do list de consertos;
pedir no grupo o que precisar. Acesso VPS: Noke, Elias, Jhino (fora).

## Problema 1 — Live brain: timeout do adapter em massa (GRAVE)

- **Evidência:** 138 turnos `kimiwork_llm_turns` com `error='timeout do adapter'` nas últimas 24h;
  de 158 turnos channel='geral', 132 falharam. Todo turno gerado pelo roteador morre no adapter.
- **Impacto:** o caminho "live brain" está fora do ar; quem salva a operação é a execução dedicada
  (varredura manual da inbox). Risco de mensagem de cliente ficar sem resposta se a dedicada não rodar.
- **Causa REAL (diagnosticada 24/09 ~20:20 +02:00 pela Luna):** NÃO é o endpoint LLM.
  O `KimiWorkAdapter` (packages/agent/src/kimiwork.ts) enfileira o turno e faz poll por 180s
  (KIMIWORK_LLM_TIMEOUT_MS); "timeout do adapter" = **a varredura dedicada não respondeu o turno
  em 180s**. Duas causas combinadas: (1) roteamento duplicado — a msg também vira inbox event e
  a resposta sai por lá, sobrando o turno órfão; (2) cadência da varredura (>3 min entre runs)
  maior que o timeout. Contexto: Kimi Code está sem quota (403 "weekly usage limit" testado ao
  vivo — é o motivo do modo kimiwork estar ativo, ADR-040), então o caminho automático depende
  da varredura.
- **Ação já tomada:** `KIMIWORK_LLM_TIMEOUT_MS=1200000` (20 min) no `.env` — efetivo no próximo
  restart do orchestrator (não reiniciei serviços daqui pra não derrubar voz/outros).
- **To-do restante:** (a) fix no roteador: não gerar turno quando já existe inbox event para a
  mesma mensagem (ou consumidor ignorar duplicata por correlation_id); (b) restart do orchestrator
  pra aplicar o timeout novo (janela segura, com alguém de olho na voz); (c) monitorar se o
  re-enfileiramento de turnos antigos continua.

## Problema 2 — Roteamento duplicado: inbox event + turno geral = double-send

- **Evidência:** mesma mensagem de WhatsApp gera DOIS itens: `kimiwork_inbox` (kind=whatsapp.message)
  e `kimiwork_llm_turns` (channel=geral). Responder os dois envia a mesma msg 2x
  (ex.: "Por nada, Enoque!..." apareceu duplicada no painel; 4+ casos em 24h).
- **Mitigação atual (Luna dedicada):** tratar a inbox como canal canônico; turno duplicado é finalizado
  como `failed` com motivo dedup. Funciona, mas é remendo.
- **To-do:** corrigir no roteador para NÃO gerar turno geral quando já gerou inbox event (ou marcar
  o par com a mesma correlation_id e o consumidor ignorar duplicata).

## Problema 3 — Credenciais do painel Nexo rejeitadas

- **Evidência:** incidente próprio (`2026-09-24-painel-credenciais-rejeitadas.md`): login NextAuth
  retorna `CredentialsSignin` desde ~16:45 +02:00 (funcionava 16:00). Retestes 17:20 e ~17:40 falhos.
- **Impacto:** bloqueia ordem do Abner (seção "bugs e consertos" no relatório do Matheus + solicitações
  dos bugs reportados pelo Noke — o chat do workspace só é legível com login admin).
- **To-do (HUMANO):** conferir se a senha do admin mudou no painel; atualizar
  `NEXO_API_USERNAME`/`NEXO_API_PASSWORD` no `.env` do luna-agent e avisar a Luna pra retestar.

## O que a Luna precisa do grupo

1. Senha nova do painel (ou confirmação de que não mudou → investigar lockout NextAuth).
2. Alguém com acesso VPS (Noke ou Elias) puxar os logs do live brain pra diagnosticar o timeout.
3. Decisão: corrigir o roteador duplicado agora ou manter a mitigação por dedup.

## RESOLUÇÃO 2026-09-24 ~19:00 +02:00 (ordens Jhino, commit c4e8b2d)

1. **Adapter sem hard-fail** (decreto Jhino "tira esse timeout"): poll com progresso a cada 2 min
   (onProgress + log); cap de 12h só anti-lock eterno. Orchestrator reiniciado via pm2,
   health/ready OK. `.env`: KIMIWORK_LLM_TIMEOUT_MS=43200000 (cap), KIMIWORK_LLM_PROGRESS_MS (default 120000).
2. **Anti double-send no código**: handler.ts — whatsapp.message.received com ponte na
   kimiwork_inbox (mesma correlation_id) NÃO passa pelo model router; exceção §8.1
   (pedido explícito de humano) nunca skipada. Evidência ao vivo 19:01: log
   "ponte Kimi Work: mensagem já na inbox dedicada".
3. Testes: 56/56 unit (packages/agent) + 13/13 integração (f14 ajustado + f21 novo, 3 cenários).
4. **Fica pendente:** senha do painel (ordem Abner — bugs do Noke no relatório + solicitações).
