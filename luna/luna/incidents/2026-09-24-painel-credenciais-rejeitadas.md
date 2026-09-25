# INCIDENTE — credenciais painel Nexo rejeitadas

- **Quando:** 2026-09-24 ~16:50–17:00 (+02:00), sweep da Luna
- **Sintoma:** sessão salva em `.brain/.vps_cookie` expirou (GET admin/requests → 403 Forbidden);
  re-login NextAuth (`POST /nexo/api/auth/callback/credentials`) → 302 com
  `error=CredentialsSignin&code=credentials` usando `NEXO_API_USERNAME`/`NEXO_API_PASSWORD` do .env.
- **Histórico:** essas mesmas credenciais funcionaram às 16:00 (login ok, sweeps 16:00–16:40 com a
  sessão reutilizada). Falha começou entre 16:42 e 16:58.
- **Hipóteses:** senha rotacionada no painel por humano; ou bloqueio/lockout NextAuth após várias
  sessões criadas no dia.
- **Ação Luna:** alerta enviado ao grupo Telegram (bot @lunanexobot). Varredura do painel FALHA-CLOSED
  até credencial corrigida — sem inventar alternativa.
- **Ação humana necessária:** conferir se a senha do admin mudou no painel Nexo; se sim, atualizar
  `NEXO_API_USERNAME`/`NEXO_API_PASSWORD` no `.env` do luna-agent (e me avisar pra retestar).
- autor: Luna (sweep 17:00)
- **Reteste 17:20:** login ainda falha (CredentialsSignin). Segue pendente humano; sem novo alerta (evitar spam — alerta original 17:00 ainda válido).

- **Reteste ~17:40 (+02:00, sweep dedicado menções):** login segue falhando (CredentialsSignin). Ordem do Abner (relatório bugs do Matheus + solicitações) fica PENDENTE até credencial corrigida.
