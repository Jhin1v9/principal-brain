## Relatório — Catálogo SaaS (relatório genérico, 17 sistemas)

**O que são.** Dezessete sistemas SaaS verticalizados em `/saas/<nome>/`: Citas Médicas, Academia, Bótica, Clínica, Colegio, Ferretería, Gimnasio, Hospedaje, Minimarket, Odontología, Restaurante, Taller Automotriz, Taller Textil, Tienda Moda, Ventas e Inventarios, Veterinaria e Préstamos y Cobranza.

**Arquitetura.** Containers `nexo_saas_*` (portas 16001–16017) com Caddy por subpath; MySQL dedicado `nexo_mysql_saas` (127.0.0.1:3309). Cada app tem Dockerfile próprio gerado no padrão Laravel (+ `.dockerignore`).

**Segurança (10/09/2026).** 17 senhas de banco rotacionadas, fail2ban com jail `web-login-bruteforce` (5 tentativas em 5 min → 1h de ban) cobrindo SaaS + TPV.

**Estado (14/09/2026).** Todos no ar. Repositórios na org `EEA-Ops-Master` (um repo por sistema).
