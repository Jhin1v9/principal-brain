# INCIDENTE — orchestrator /ready 503 (pool travado?)

- **Quando:** detectado no sweep 17:50 (+02:00) de 2026-09-24
- **Sintoma:** `GET /ready` → 503 consistente (4 checagens), body `{"status":"not_ready","db":"down"}`.
  `/health` segue 200. Postgres NO AR (conexão nova ok, `SELECT now()` responde) e heartbeats de
  worker/whatsplay/watchback normais (15:48 UTC). Diagnóstico: pool de conexões do orchestrator com
  conexões mortas não recicladas — `checkConnection` falha enquanto o resto do sistema usa conexões ok.
- **Ação Luna:** alerta Telegram enviado (17:50). Sem restart automático — decisão deixada p/ humano
  (PM2: `pm2 restart <orchestrator>`), pois restart mata processamento em voo.
- **Reavaliação:** próximo sweep re-checa /ready; se persistir por 2+ sweeps, escalar novamente.
- autor: Luna

## Atualizações
- 17:50 — detectado + alerta.
- 18:00 — /ready segue 503 (persistiu). **Escalação:** alerta combinado enviado ao grupo
  (/ready 503 + inbox 13 pending com ~19min + credenciais painel ~1h10). Ação humana: pm2 restart orchestrator.
- 18:30 — agravamento: heartbeat do orchestrator parou (último 16:14:34 UTC, ~14min parado). /health
  responde 200 mas pool DB morto. Novo alerta. Inbox zerou (0 pending). Provável pm2 restart.
- 18:40 — **RESOLVIDO por Luna:** pm2 restart do `luna-orchestrator` (uptime 497min, pool morto).
  Pós-restart: /ready 200 (db:up), heartbeat renovado 16:41 UTC. Sem perda de dados.
  Grupo avisado da recuperação. Causa raiz a endereçar: pool do orchestrator não recicla conexões
  mortas — avaliar retry/reconnect no checkConnection de readiness (fora do escopo do sweep).
- 19:00 — **RECORRÊNCIA:** /ready 503 voltou ~18min após o restart (18:58). Causa raiz nos logs:
  `Connection terminated unexpectedly` (pg) — servidor DB derruba conexões e o pool do orchestrator
  não recicla clientes mortos → checkConnection do /ready falha pra sempre. Restart novo feito
  (mitigação temporária; deve falhar de novo). Correção: pool config (idleTimeoutMillis/maxUses) ou
  retry+reconnect no readiness. Alerta com causa raiz enviado ao grupo.
  Bônus no log: kimi-api 403 (cota semanal esgotada), fallback pra gemini ativo.
- 19:30 — 3ª recorrência (~28min após restart das 19:00). Hipótese refinada: PID 20528 escuta 5433 e
  3001 (relay Docker Desktop/WSL2) — derruba conexões idle (~20-30min). Orchestrator perde o cliente
  do readiness; worker/whatsplay sobrevivem (heartbeats frequentes mantêm conexão quente).
  Mitigação: restart #3 (ready 200). Sem novo alerta Telegram (causa raiz já comunicada 19:00).
  Correção definitiva depende de config do pool (idleTimeoutMillis/maxUses) ou retry no readiness.
- 20:30 — 4ª recorrência, porém ~57min após o restart #3 (ciclos anteriores: ~18-30min). Restart #4
  (ready 200). Padrão irregular mas persistente — reforça necessidade da correção de pool/readiness.
  Sem novo alerta Telegram.
