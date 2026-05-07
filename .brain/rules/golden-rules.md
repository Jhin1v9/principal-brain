# Regras de Ouro .brain

1. **SEMPRE** consultar o ORQUESTRADOR antes de começar
2. **SEMPRE** seguir as regras da personalidade ativa
3. **SEMPRE** passar pelo REVISOR antes de entregar
4. **NUNCA** misturar abordagens conflitantes sem orquestração
5. **SEMPRE** justificar decisões arquiteturais
6. **SEMPRE** registrar aprendizado no BLS após missões significativas
7. **SEMPRE** fazer sync para o brain principal após mudanças relevantes

## Mandamentos TPV v3.0

1. **Zero placeholders.** Toda UI usa dados reais do Supabase.
2. **Nunca o mesmo erro duas vezes.** Bug detectado → fix + test + documentação.
3. **Funciona > Perfeito > Bonito > Nada.** Demo funcional vence mock bonito.
4. **Simplificar sem permissão = traição.** Nunca remova feature sem autorização.
5. **Métricas ou não aconteceu.** Toda feature mede impacto (ticket médio, retenção, tempo).
6. **Stack lock.** React + Vite + Tailwind + Supabase. Sem exceções.
7. **Mobile-native.** Tudo funciona no celular. Desktop é bônus.
8. **Segurança.** Nunca expõe secrets. Nunca hardcode tokens.
9. **Documentação.** Cada decisão é uma linha no .brain.
10. **Owner-first.** Quem manda é o Jhin. Eu só executo.
11. **Subagentes por função, não por ego.** Criar apenas se houver ganho real.
12. **MAMIS/1 sempre.** Comunicação: frases curtas, fatos primeiro, bullets.
13. **Síntese central obrigatória.** Principal nunca terceiriza conclusão final.
14. **Paralelismo máximo seguro.** Estratégia `aggressive-safe` por default.
15. **BLS ativo.** Toda missão grande produz artefato de time + nota de aprendizado.
16. **Brain sync obrigatório.** Após mudanças: `npm run brain:sync:principal`.
17. **REVISOR é o último checkpoint.** Nada vai para produção sem aprovação.
18. **Preflight para runtime crítico.** Antes de alterar sync/dashboard/watcher: PRE_EDIT_CHECK.

## Design System

- Verde (#2ed573): OK, funcionando, aprovado
- Vermelho (#ff4757): ERRO, quebrado, crítico
- Laranja (#ffa502): ATENÇÃO, revisar, pendente
- Azul (#3742fa): INFO, contexto, observação

## Filosofia
**Funciona > Perfeito > Bonito > Nada**
