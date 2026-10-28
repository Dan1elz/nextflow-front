# Nextflow Front — instruções para o Claude

SPA do ERP Nextflow (TCC). Padrão esperado: código de dev pleno em projeto real.
Responda e documente em português; código em inglês, como já está. Textos de interface em pt-BR.

## Antes de mexer
- Mapa completo do projeto: `docs/PROJECT.md`. Diagramas: `docs/diagramas.md`.
- Contrato da API de previsão de demanda (IA): `../nextflow/docs/AI_FORECAST_SPEC.md`.
- A API fica em `../nextflow` (veja o `CLAUDE.md` de lá). Enums em `src/types/enums.ts` espelham o backend.

## Stack
React 19, TypeScript 5.9, Vite 7, Tailwind 4 (`@tailwindcss/vite`), shadcn/ui (estilo new-york) + Radix,
React Hook Form + Zod, React Router 6, TanStack Table, Recharts 2, Sonner, date-fns. Alias `@` → `src/`.

## Padrões do projeto (siga-os, não invente outros)
- Estado por entidade: `contexts/<entidade>.context.tsx` → `providers/<entidade>.provider.tsx` → `hooks/use-<entidade>.tsx` → componente.
  Providers de entidade são montados dentro das páginas, não na raiz.
- Acesso à API só pelos services: `ApiService` → `BaseService<T>` → `<entidade>.service.ts`. Nada de `fetch` solto em componente.
- Formulários: schema Zod em `schemas/`, componente em `components/forms/<entidade>-form.tsx`, modos `create | edit | view`.
- Listagens: `components/app/entity-index-page.tsx` + `data-table.tsx`.
- Erros e avisos ao usuário: `handleError`/`handleSuccess` de `utils/toast.helpers.ts`.
- Preço efetivo (`effectivePrice`) vem da API; o front nunca recalcula.
- Ações de Admin: esconder com `isAdmin(user)`.

## UI e design
- Reutilize os componentes de `src/components/ui` (shadcn) e os tokens/classes Tailwind existentes antes de criar algo novo.
  Componente shadcn que ainda não existe: adicione com `npx shadcn@latest add <nome>` (o MCP do shadcn ajuda a achar).
- Num ERP, consistência vale mais que originalidade: novas telas devem parecer irmãs das existentes
  (mesmo layout de página, espaçamentos, tipografia e padrão de botões). Ao usar a skill `frontend-design`, aplique-a
  dentro dessa identidade visual, sem trocar fontes, paleta ou estilo geral.
- Suporte a tema claro/escuro e a telas pequenas (`use-mobile`).
- Para conferir uma tela no navegador (Playwright), o dev server roda em `http://localhost:5173` e precisa da API rodando.

## Comandos
```
npm run dev
npm run build        # tsc -b + vite build: precisa passar
npm run lint
npm run format:check
```

## Testes
Ainda não existem. Ao criar, seguir: Vitest + Testing Library + MSW (mock da API) para hooks, services e formulários;
`@playwright/test` para poucos fluxos E2E críticos (login, orçamento → venda, previsão).

## Ao terminar uma tarefa
- `npm run build` e `npm run lint` sem erros.
- Atualize `docs/PROJECT.md` quando mudar estrutura, rotas, services ou padrões.
