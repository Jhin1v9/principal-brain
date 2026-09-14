## Relatório — CRM/ERP (relatório genérico, 11 sistemas)

**O que são.** Onze CRM/ERP em rotas próprias: Agencia de Viajes, Colegio, Condominio, Delivery, Odontologia, Tienda Celulares, Tienda Online, Ventas (Node/React + Swagger), ERP Educativo, ERP Farmacia (Laravel + Vue) e ERP Taller Automotriz.

**Arquitetura.** Containers `nexo_crm_*`/`nexo_erp_*` (portas 14001–14011), MySQL `nexo_mysql_crm` (127.0.0.1:3307) e um SQL Server (`nexo_sqlserver`) herdado do stack.

**Estado (14/09/2026).** No ar — os healthchecks que reportavam unhealthy em 09/09 estão resolvidos (0 unhealthy hoje).

**Pendente.** CORS aberto em wildcard (*) nos apps Laravel — restringir a `vps.nexo-digital.app` (lista de pendentes de 14/09).
