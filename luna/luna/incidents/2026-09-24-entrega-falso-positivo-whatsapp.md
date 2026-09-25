# Incidente 2026-09-24 — Duplicata no Production + lições de paciência

**Detectado por:** Abner (screenshot 21:56 — "vc só acha que respondeu"; depois 22:07 — "AGR RESPONDEU 2X").

## ⚠️ DIAGNÓSTICO CORRIGIDO (22:10)
A conclusão original de "falso positivo" estava **ERRADA**. Fatos reais, confirmados por screenshots do owner:

- O screenshot das 21:56 foi tirado **antes** das entregas (que aconteceram 21:58 e 22:00). Não era falso positivo — era mensagem ainda em voo.
- As duas cópias no grupo vieram de: (1) o fluxo original do NOTIFY das 19:56, que travou ~2 min na citação (lupa) e depois **caiu sozinho para envio sem citação**, entregando 21:58; (2) **um dos meus re-notify manuais** (21:57 ou 22:00) — a duplicata foi erro OPERACIONAL MEU.
- O LISTEN **não** estava morto: meus NOTIFYs foram processados normalmente (por isso cada um gerou uma entrega). As quedas de Postgres/voice no log eram de janelas anteriores.
- O `resposta entregue` no log era verdadeiro nas duas vezes.

## O que aconteceu (timeline corrigida)
- 19:56: Luna responde no Production (`3507c3d7`), queued + NOTIFY, com `reply_to_query`.
- 19:56:10: citação não achou a msg → "usando a lupa" → **travado ~2 min** no fluxo de busca.
- 21:56: Abner screenshota o grupo vazio e reclama (mensagem ainda em voo desde 19:56).
- 21:57–22:00: Luna entra em pânico operacional: remove citação, re-notifica, reseta p/ queued, re-notifica de novo, restarta o whatsplay.
- 21:58 e 22:00: **duas entregas reais** acontecem (cópias idênticas no grupo).
- 22:06: mensagem da pesquisa de preços (`f561937a`) entregue normalmente.

## Lições (regra operacional nova)
1. **Paciência antes de intervenção:** o fluxo de citação trava ~2 min mas se recupera sozinho (fallback sem citação). Screenshot vazio ≠ falha — verificar `send_state` + logs e ESPERAR antes de re-notificar.
2. **Nunca resetar `queued` + re-notify sem confirmar que não há tentativa em voo** — cada NOTIFY gera uma entrega; re-notify = duplicata garantida.
3. **Re-notify manual só se:** `send_state='failed'` explícito OU >10 min sem `resposta entregue` no log.
4. Screenshot do owner é ground truth; log também; cruzar os dois antes de concluir.

## Fix estrutural PENDENTE (apps/whatsplay) — reescopo após correção
1. Citação (lupa): reduzir o hang de ~2 min (timeout explícito curto) e logar o fallback "citação falhou → envio sem citação".
2. Proteção contra duplicata: `deliverOne` já filtra `send_state='queued'` no SELECT, mas um NOTIFY duplo em voo passa — considerar lock por message_id (advisory lock) ou checar estado imediatamente antes do Enter.
3. (Observação, não confirmado como causa de hoje) Isolar crash do voice fastpath — crash-loop 77x segue sendo problema real a tratar na automação de voz.
4. ~~falso positivo de confirmação~~ — descartado; a confirmação por compositor esvaziado funcionou.
5. ~~LISTEN morto~~ — descartado como causa deste incidente.
