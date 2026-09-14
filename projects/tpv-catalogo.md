## Relatório — Catálogo TPV (relatório genérico, 11 apps)

**O que são.** Onze pontos de venda (TPV) verticalizados, todos Laravel + Vite com subpath próprio em `/tpv/<nome>/`: Cafetería, Copas, Estética y SPA, Fastfood, Hostelería, Joyería y Relojería, Minimarket, Panadería, Papelería y Librería, Peluquería y Zapatería.

**Arquitetura.** Cada app é um container `nexo_tpv_*` (portas 14050–14060, só localhost) atrás do Caddy com strip de prefixo. Banco MySQL dedicado `nexo_mysql_tpv` (127.0.0.1:3308). Build em dois Dockerfiles (`Dockerfile.laravel` + `Dockerfile.laravel-vite`) com entrypoint próprio e gerador de URL com subpath (`FixSubpathUrlGenerator`).

**Segurança (reforço de 10/09/2026).** Credenciais padrão removidas das telas de login (11 apps), 14 seeders passaram a usar `env('NEXO_SAAS_PASSWORD')`, containers reconstruídos com código limpo e 11 arquivos "Credenciales del Sistema.txt" apagados do source.

**Estado (14/09/2026).** Os 11 no ar e saudáveis (0 containers unhealthy na VPS). Repositórios na org `EEA-Ops-Master`.
