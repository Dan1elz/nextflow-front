---
name: engineering-guidelines
description: Padrões de código do front Nextflow (React 19, shadcn/ui, Context-Provider-Hook); use antes de criar ou alterar telas, componentes, services ou formulários, ou ao revisar um diff.
---

# Padrões de engenharia — Front

A fonte é a documentação do produto, não esta skill. Leia, nesta ordem e só o necessário:
1. `../nextflow-docs/docs/engineering-guidelines/README.md` (princípios comuns e definição de pronto).
2. `../nextflow-docs/docs/engineering-guidelines/frontend.md` (padrões, UI, comandos).
3. `../nextflow-docs/docs/engineering-guidelines/testing.md` se for escrever teste.
4. Regras do módulo afetado: `../nextflow-docs/docs/architecture/modules/<módulo>/business-rules.md`.

Checklist ao terminar:
- Nenhuma regra de negócio recalculada no front (preço efetivo, totais, permissões vêm da API).
- Padrão Context → Provider → Hook; API só pelos services; formulários com Zod.
- Enums em `src/types/enums.ts` iguais aos do backend.
- `npm run build` e `npm run lint` sem erros; `docs/PROJECT.md` atualizado se mudou estrutura ou rota.
