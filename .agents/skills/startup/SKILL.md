---
name: startup
description: Prepara uma sessão de trabalho no repositório nextflow-front (Front do Nextflow) - contexto do produto, estado do git e ambiente local; use no início de qualquer tarefa neste repositório.
---

# Início de sessão — Front

1. **Contexto do produto** (leia só o que a tarefa pede):
   - `../nextflow-docs/docs/product-overview.md` (o que é, escopo, módulos).
   - `../nextflow-docs/docs/architecture/modules/<módulo>/overview.md` e `business-rules.md` do módulo da tarefa.
   - Lembre: tudo marcado "rascunho / a validar" não é verdade definitiva; na dúvida, pergunte ao Daniel.
2. **Repositório**: leia o `CLAUDE.md` daqui e a seção relevante de `docs/PROJECT.md`.
3. **Estado do git**: `git status`, branch atual e últimos commits. Há trabalho não commitado (branch `task-17` em out/2026):
   não descarte nada e não faça commit sem o ok do Daniel.
4. **Ambiente** (só se a tarefa precisar rodar algo): Front: `docker compose -f compose.development.yaml up -d --build` ou `npm run dev` (precisa da API em `:8080`); abra `http://localhost:5173`.
5. **Padrões**: carregue a skill `engineering-guidelines` antes de escrever código.
6. Resuma em 3 linhas o que entendeu da tarefa e o plano antes de começar.
