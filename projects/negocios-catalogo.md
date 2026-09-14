## Relatório — Negocios (relatório genérico, 10 sistemas)

**O que são.** Dez sistemas de gestão: AlmacénPro, LexDoc (abogados), ContaDoc (contable), Contabilidad Perú, Gestor Municipal, MediCare (consultório), Control de Asistencia (Node + React), EnvíosPro (encomiendas), NegPlanilla (.NET 10 Blazor) e Servicio Técnico.

**Arquitetura.** Containers `neg_*` (portas 15001–15010), majoritariamente Django 5 + MySQL; planilla em C#/.NET; asistencia em Node + React 18.

**Estado (14/09/2026).** No ar (0 unhealthy).

**Pendentes (da lista de 14/09).** `DEBUG=True` em produção, `SECRET_KEY` hardcoded no compose e `ALLOWED_HOSTS="*"` — os três devem ir pra `.env` quando houver janela de manutenção.
