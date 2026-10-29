# Padrão de código do nextflow-front (React)

> Formato do `aura-front/docs/engineering-guidelines.md`. Os princípios comuns aos repositórios estão em
> `../nextflow-docs/docs/engineering-guidelines/README.md`. Atualizado em 28/10/2026 para a nova API (ADR 0010) e para a
> skill do shadcn (`.agents/skills/shadcn/`). Telas antigas são migradas módulo a módulo, junto com a API.

## Stack

React 19, TypeScript, Vite, React Router, Tailwind 4, componentes shadcn (Radix, estilo new-york, tokens em CSS variables),
React Hook Form com Zod, TanStack Table, Recharts, Sonner para avisos, date-fns. Acesso à API pelo `ApiService`. Alias `@` → `src/`.

## Estrutura de pastas

| Pasta | Conteúdo |
| --- | --- |
| `src/pages/` | Uma tela por recurso; formulário em subpasta (`Product/Create.tsx`, `Product/Edit.tsx`, `Product/View.tsx`) |
| `src/components/ui/` | Componentes base do shadcn, instalados pela CLI. Sem regra de negócio e sem edição de estilo |
| `src/components/app/` | Componentes do produto compostos com os do shadcn (tabela, seletor com busca, seletor de loja, badges de status) |
| `src/components/forms/` | Formulários, um por recurso (`product-form.tsx`), divididos em seções quando grandes |
| `src/components/layouts/` | Layouts de página privada, de listagem e de formulário |
| `src/services/` | Um serviço por recurso, herdando `BaseService` (index, show, store, update, delete, reactivate, options) |
| `src/contexts/` e `src/providers/` | Um contexto e um provider por recurso, montados na página |
| `src/hooks/` | Hook por recurso (`use-products`) e genéricos (`use-index-search`, `use-debounce`, `use-api-form`) |
| `src/schemas/` | Schemas Zod dos formulários, espelhando os validators da API |
| `src/interfaces/` | Tipos dos DTOs da API, com os mesmos nomes (`ProductRequestDto`, `ProductResponseDto`, `ProductListItemDto`) |
| `src/types/` | `enums.ts` (chaves iguais ao `GetApiName()` da API + label pt-BR) e tipos de tela |
| `src/utils/` | Formatação (moeda, quantidade, data no fuso de São Paulo), avisos, validadores |
| `src/configs/` | Endereço da API (vem de `VITE_*`) |

## Camadas e o que cada uma pode fazer

| Camada | Pode | Não pode |
| --- | --- | --- |
| `services/` | chamar a API, montar query (`offset`, `limit`, `filters` em JSON, `sort`, `order`), devolver o DTO tipado | estado de tela, toast, regra de negócio |
| `providers/` + `hooks/` | guardar a lista, o item e o carregamento; chamar o service; repassar o erro ao chamador | montar JSX, calcular preço, total ou saldo |
| `components/forms/` | React Hook Form + Zod, mapear `fieldErrors` da API para os campos, abrir a confirmação de aviso | chamar `ApiService` direto, decidir regra que a API decide |
| `pages/` | compor layout, provider, tabela e formulário; navegar | lógica de dados além de chamar o hook |
| `components/ui/` | o que a CLI do shadcn instalou | ser editado para mudar cor ou tipografia |

## Contrato com a API

A API segue o padrão do `atrena-api` (`../nextflow/docs/C_SHARP_ARCHITECTURE_RULES.md`):

- **Sucesso:** o corpo é o próprio DTO (sem envelope).
- **Listagem:** `{ items: T[], total: number }` (`PaginationDto<T>`).
- **Erro:** `ResultDto` → `{ isSuccess: false, errors: string[], fieldErrors?: Record<string, string[]>, errorCode, message }`.
  - 422 com `fieldErrors`: o `ApiService` entrega ao formulário, que chama `setError(campo, …)` em cada um; `message` vai para o toast só se nenhum campo casar.
  - 422 com `fieldErrors.confirm`: o formulário abre um `AlertDialog` com a mensagem e reenvia com `confirmWarnings: true` (RN-VD13).
  - 409: "Este registro foi alterado por outra pessoa"; o formulário oferece recarregar.
  - 400 e 404: `message` no toast.
- **Enums** chegam como string (`"Paid"`); o label pt-BR vem de `src/types/enums.ts`.
- Documento editável traz `version`; o update envia a mesma `version`.
- Inativar é `DELETE /{id}`; reativar é `PATCH /{id}/reactivate`.
- Os DTOs de cada tela estão no `contract.md` do módulo em `../nextflow-docs/docs/architecture/modules/`.

## Padrão de tela

1. O componente exportado envolve a tela no provider do recurso (`<ProductsProvider>`).
2. A tela usa o hook do recurso, que lê o contexto e chama o serviço.
3. Listagem com o layout de listagem, `DataTable` e `useIndexSearch` (filtros, paginação, ordenação, busca rápida); a loja
   selecionada no topo entra como filtro `storeId`.
4. Formulário com React Hook Form, `zodResolver` e o schema de `src/schemas/`, montado com `FieldGroup` + `Field` +
   `Controller` (ver regras do shadcn abaixo).
5. Sucesso e erro com `handleSuccess` e `handleError` (`src/utils/toast.helpers.ts`), que usam `toast()` do Sonner.
6. Valor calculado (preço efetivo, disponível, total, margem, status de promoção) vem pronto da API; o front só formata.

## Regras do shadcn (resumo da skill `.agents/skills/shadcn/`)

Leia a `SKILL.md` e o arquivo de regra do assunto antes de mexer em UI. As regras críticas:

- **Componente antes de markup.** Procure no projeto e no registro (`npx shadcn@latest search`, MCP do `.mcp.json`) antes de
  escrever um `div` estilizado. Aviso = `Alert`, vazio = `Empty`, carregando = `Skeleton`, separador = `Separator`, etiqueta = `Badge`.
- **Cores semânticas.** `bg-primary`, `text-muted-foreground`, `bg-destructive`; nunca `text-red-500`, nunca `dark:` manual.
  Status de negócio usam variantes de `Badge` ou os tokens `success`/`warning` definidos em `src/index.css`.
- **`className` é para layout**, não para mudar cor ou tipografia de componente.
- **Espaço com `gap`.** `flex flex-col gap-4`, nunca `space-y-*`/`space-x-*`. `size-*` quando largura = altura. `truncate`.
- **Formulários com `FieldGroup` + `Field`** (`FieldLabel`, `FieldDescription`, `FieldError`); `data-invalid` no `Field` e
  `aria-invalid` no controle; `FieldSet` + `FieldLegend` para agrupar; `ToggleGroup` para 2–7 opções; `InputGroup` +
  `InputGroupInput`/`InputGroupAddon` para botão ou prefixo dentro do campo (R$, unidade).
- **Botão sem `isLoading`.** `Button` + `Spinner` com `data-icon` + `disabled`.
- **Ícones** com `data-icon="inline-start"`/`"inline-end"` dentro do botão, sem classe de tamanho; passados como componente.
- **Composição completa:** itens dentro do grupo (`SelectGroup`, `DropdownMenuGroup`, `CommandGroup`); `Card` com
  `CardHeader`/`CardTitle`/`CardContent`/`CardFooter`; `TabsTrigger` dentro de `TabsList`; `Dialog`, `Sheet` e `Drawer`
  sempre com título (use `sr-only` se for escondido); `asChild` para gatilho customizado; `Avatar` com `AvatarFallback`.
- **Sem `z-index` manual** em overlays.
- Componente novo: `npx shadcn@latest add <nome>` em `components/ui/`, composto em `components/app/`.

## Regras gerais

- Nomes em camelCase, iguais aos DTOs da API. `filters` vai como texto JSON (o `BaseService` faz).
- Enum alterado na API muda junto em `src/types/enums.ts`.
- Rotas novas em `src/routes/AppRoutes.tsx`, dentro de `PrivateRoutes`.
- Variáveis `VITE_*` são fixadas no build; mudar exige novo build.
- Telas em pt-BR; responsivas (mobile) e com tema claro/escuro pelos tokens. Consistência vence originalidade: tela nova
  parece irmã das existentes.
- Ao migrar uma tela para a API nova, migre também a UI para as regras do shadcn; não deixe tela com metade de cada padrão.

## Desenvolvimento com agentes de IA

1. Uma tela por vez, depois que o endpoint novo existe na API.
2. Antes de escrever: este guia, a skill do shadcn, o `contract.md` da tela e uma tela já migrada para copiar a forma.
3. Sem padrão novo e sem regra inventada: dúvida vira pergunta ao Daniel, com recomendação.
4. Entrega verificada: `npm run lint`, `npm run build` e a tela aberta no navegador (claro, escuro e mobile).
5. Commit, push e merge só com aprovação do Daniel.

## Formatação e validação

- Prettier (`.prettierrc`) com `npm run format`; ESLint com `npm run lint`; `npm run build` sem erro.

## Testes

| Camada | Ferramentas | Prioridade |
| --- | --- | --- |
| hooks, services, formulários | Vitest + Testing Library + MSW | formulários de pedido e produto, mapeamento de `fieldErrors` |
| E2E | `@playwright/test` | login, orçamento → venda, recebimento de compra, previsão |

Casos de teste levam no nome o ID da regra de negócio (`RN-*`) que verificam.

## Checklist antes do commit

- [ ] Tipos de `src/interfaces/` iguais aos DTOs do `contract.md`; enums com chave string.
- [ ] Service sem estado; hook sem JSX; formulário sem chamada direta à API.
- [ ] Erros 422 por campo aparecem no `Field` certo; aviso de confirmação funciona; 409 tratado.
- [ ] Nenhuma cor crua, `dark:`, `space-*`, `w-N h-N` iguais ou `isLoading` em botão.
- [ ] Formulário com `FieldGroup`/`Field`; overlays com título; itens dentro dos grupos.
- [ ] Nada calculado no front que a API já devolve.
- [ ] `npm run lint` e `npm run build` limpos; tela conferida em claro, escuro e mobile.
