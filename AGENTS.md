# Instruções para agentes de IA (nextflow-front)

Este é o repositório do front do Nextflow (React). A documentação do produto fica em `../nextflow-docs`.
Leia o `../nextflow-docs/AGENTS.md` antes de mudar regra de negócio.

## Antes de mexer
1. Identifique o módulo em `../nextflow-docs/docs/architecture/modules/` e leia o `overview.md` e o `business-rules.md`.
   O que estiver marcado "rascunho / a validar" ainda não é regra fechada: na dúvida, pergunte.
2. Leia `docs/engineering-guidelines.md` e o `contract.md` da tela no módulo. Copie a forma de uma tela já migrada.
3. Para componentes de interface, use a skill em `.agents/skills/shadcn/` (leia a `SKILL.md` e a regra do assunto),
   o MCP do shadcn (`.mcp.json`) e os componentes de `src/components/ui`.
4. `features/` no docs é histórico, não regra atual.

> **Em transição (desde 28/10/2026):** a API está sendo reescrita (ADR 0010) e o front migra tela a tela para o envelope
> novo e para as regras do shadcn. Tela antiga é referência de fluxo, não de padrão.

## Regras deste repositório
- Trabalhe no branch atual (`task-NN`). Não crie branch com nome próprio sem perguntar.
- Commit, push, pull, merge e deploy só com aprovação do Daniel.
- O front não recalcula regra de negócio: preço efetivo, totais e permissões vêm da API.
- Enums em `src/types/enums.ts` espelham a API (`../nextflow`); mude os dois lados juntos.
- Nunca copie valores do `.env`/`.env.example` para código ou documentação.
- Mudou fluxo ou regra visível: atualize o módulo no docs; mudou rota ou estrutura: `docs/PROJECT.md`.

## Mapa rápido
| Assunto | Onde |
|--|--|
| Rotas | `src/routes/AppRoutes.tsx` |
| Estado por entidade | `src/contexts/` → `src/providers/` → `src/hooks/` |
| Chamadas à API | `src/services/` (sobre `api.service.ts` e `base.service.ts`) |
| Formulários e validação | `src/components/forms/`, `src/schemas/` |
| Telas | `src/pages/` |
| Mapa detalhado e diagramas | `docs/PROJECT.md`, `docs/diagramas.md` |
| Subir localmente | `docs/local-setup.md` |
