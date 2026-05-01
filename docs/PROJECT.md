# Nextflow Front — Frontend

> **Última atualização:** 30/04/2026
> **Repositório:** `Dan1elz/nextflow-front`
> **Stack:** React 19 · TypeScript 5.9 · Vite 7 · TailwindCSS 4 · shadcn/ui · Radix UI

---

## 1. Visão Geral

O **Nextflow Front** é a interface web SPA do sistema ERP Nextflow. Consome a API .NET backend via REST. Gerencia clientes, fornecedores, produtos, estoque, pedidos de venda, ordens de compra e vendas.

---

## 2. Stack Tecnológica

| Categoria       | Tecnologia            | Versão                        |
| --------------- | --------------------- | ----------------------------- |
| Framework       | React                 | 19.2                          |
| Linguagem       | TypeScript            | 5.9                           |
| Bundler         | Vite                  | 7.2                           |
| Styling         | TailwindCSS           | 4.1 (via `@tailwindcss/vite`) |
| UI Components   | shadcn/ui + Radix UI  | 20+ primitivos Radix          |
| Formulários     | React Hook Form + Zod | RHF 7.69, Zod 4.2             |
| Roteamento      | React Router DOM      | 6.30                          |
| Tabelas         | TanStack React Table  | 8.21                          |
| Gráficos        | Recharts              | 2.15                          |
| Ícones          | Lucide React          | 0.561                         |
| Notificações    | Sonner                | 2.0                           |
| Datas           | date-fns              | 4.1                           |
| Tema            | next-themes           | 0.4                           |
| Command Palette | cmdk                  | 1.1                           |
| Carousel        | embla-carousel-react  | 8.6                           |

---

## 3. Estrutura do Projeto

```
src/
├── App.tsx                      # Componente raiz (renderiza AppRoutes)
├── main.tsx                     # Entry point (StrictMode > BrowserRouter > ThemeProvider > AuthProvider)
├── index.css                    # Estilos globais TailwindCSS
│
├── configs/
│   └── api.ts                   # API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5144"
│
├── routes/
│   ├── AppRoutes.tsx            # Definição de todas as rotas
│   ├── PrivateRoutes.tsx        # Guard de rotas autenticadas
│   └── PublicRoutes.tsx         # Guard de rotas públicas
│
├── services/                    # Camada de comunicação com API
│   ├── api.service.ts           # HttpClient genérico (fetch wrapper com ApiError)
│   ├── base.service.ts          # CRUD genérico (getAll, getById, create, update, delete)
│   ├── auth.service.ts          # Login
│   ├── viacep.service.ts        # Auto-preenchimento de CEP
│   └── [entity].service.ts      # 14 services específicos
│
├── contexts/                    # React Contexts (16)
│   ├── auth.context.tsx
│   ├── theme.context.tsx
│   └── [entity].context.tsx     # 14 contexts de entidades
│
├── providers/                   # Context Providers (16)
│   ├── auth.provider.tsx        # JWT token management, login/logout, checkAuth
│   ├── theme.provider.tsx       # Dark/light mode
│   └── [entity].provider.tsx    # 14 providers de entidades
│
├── hooks/                       # Custom Hooks (21)
│   ├── use-auth.tsx             # Acesso ao AuthContext
│   ├── use-theme.tsx            # Acesso ao ThemeContext
│   ├── use-debounce.tsx         # Debounce genérico
│   ├── use-mobile.tsx           # Detecção de tela mobile
│   ├── use-breadcrumb-path.tsx  # Breadcrumbs automáticos por rota
│   ├── use-index-search.ts      # Lógica de busca/filtro para páginas de listagem
│   ├── use-search-options.tsx   # Busca com debounce para SearchSelect (combos)
│   └── use-[entity].tsx         # 14 hooks de acesso aos contexts
│
├── interfaces/                  # TypeScript Interfaces (14)
│   ├── api.interface.ts         # IApiResponse, IApiResponseError, IBaseService, IIndexParams, IOption
│   └── [entity].interface.ts    # 13 interfaces de entidades
│
├── schemas/                     # Schemas de validação Zod (13)
│   └── [entity].schema.ts      # Schema + tipo inferido para cada formulário
│
├── types/
│   ├── enums.ts                 # Enums espelhados do backend (valores + labels)
│   ├── general.ts               # Tipos utilitários
│   └── theme.ts                 # Tipos de tema
│
├── utils/
│   ├── index.ts                 # Barrel exports
│   ├── base64.helpers.ts        # convertToBase64, revertFromBase64, base64ToBlob
│   ├── crypto.helpers.ts        # generateUUID (com fallback para HTTP)
│   ├── date.helpers.ts          # dateOnlyOptionalSchema
│   ├── format.helpers.ts        # formatCpfCnpj, formatCep, formatPhone, formatCurrency, etc.
│   ├── toast.helpers.ts         # handleError, handleSuccess, handleWarning, handleInfo
│   └── validators.ts            # validateCpf, validateCnpj, validateEmail, etc.
│
├── components/
│   ├── ui/                      # 53 componentes shadcn/ui (Radix primitives)
│   ├── app/                     # 12 componentes customizados da aplicação
│   ├── forms/                   # 14 formulários de entidades
│   └── layouts/                 # 3 componentes de layout
│
├── pages/                       # Páginas por módulo
│   ├── Auth/                    # Login
│   ├── Home.tsx                 # Dashboard
│   └── [Entity]/                # Create, Edit, View por entidade
│
├── lib/
│   └── utils.ts                 # cn() helper (clsx + tailwind-merge)
│
└── assets/                      # Assets estáticos
```

---

## 4. Padrões e Convenções

### 4.1 Arquitetura de Estado

```
Context → Provider → Hook → Component
```

Cada entidade segue o ciclo:

1. **Context** (`contexts/[entity].context.tsx`) — Define o shape do contexto
2. **Provider** (`providers/[entity].provider.tsx`) — Implementa a lógica, chama services, expõe métodos
3. **Hook** (`hooks/use-[entity].tsx`) — `useContext()` tipado com validação
4. **Component** — Consome via hook

### 4.2 Camada de Services

```
ApiService (HTTP genérico)
    └── BaseService<T> (CRUD genérico)
        └── [Entity]Service (específico)
```

**`ApiService`** — Wrapper do `fetch`:

- Headers automáticos (JSON, Bearer token)
- Suporte a FormData (uploads)
- Tratamento de erro padronizado via `ApiError`
- Métodos: `get`, `post`, `put`, `patch`, `delete`

**`BaseService<T>`** — Implementa `IBaseService<T>`:

- `getAll(params)` → GET com paginação (`offset`, `limit`) e filtros (`filters` como JSON)
- `getById(id)` → GET by ID
- `create(data)` → POST
- `update(id, data)` → PUT
- `delete(id)` → DELETE

### 4.3 Sistema de Filtros

O frontend serializa filtros como JSON na query string:

```ts
query.filters = JSON.stringify(params.filters); // { search: "...", isActive: "true", ... }
```

### 4.4 Formulários

Padrão: `React Hook Form` + `Zod` schema + componente `*-form.tsx`:

1. Schema Zod em `schemas/[entity].schema.ts`
2. Formulário em `components/forms/[entity]-form.tsx`
3. Modes: `create` | `edit` | `view`

### 4.5 Enums (Frontend)

Os enums em `types/enums.ts` **espelham o backend** (`Nextflow.Domain.Enums`). Cada enum tem:

- Objeto `const` com valores numéricos
- Type inferido
- Label map `Record<TEnum, string>` em pt-BR

| Enum Frontend     | Backend          | Valores                                                                |
| ----------------- | ---------------- | ---------------------------------------------------------------------- |
| `TUnitType`       | `UnitType`       | Unit=1, Kilogram=2, Liter=3, Meter=4                                   |
| `TRoleEnum`       | `RoleEnum`       | User=1, Admin=2                                                        |
| `TPaymentMethod`  | `PaymentMethod`  | Cash=1, CreditCard=2, DebitCard=3, BankTransfer=4, Pix=5, Ticket=6     |
| `TOrderType`      | `OrderType`      | Budget=1, Sale=2                                                       |
| `TOrderStatus`    | `OrderStatus`    | Budget=1, PendingPayment=2, PaymentConfirmed=3, Canceled=4, Refunded=5 |
| `TMovementType`   | `MovementType`   | Entry=1, Exit=2, Adjustment=3, Sales=4, Return=5                       |
| `TPurchaseStatus` | `PurchaseStatus` | Budget=1, Pending=2, Received=3, Canceled=4                            |

---

## 5. Componentes Customizados (`components/app/`)

| Componente                  | Descrição                                       |
| --------------------------- | ----------------------------------------------- |
| `NextflowLogo.tsx`          | Logo SVG da aplicação                           |
| `sidebar.tsx`               | Sidebar de navegação principal                  |
| `data-table.tsx`            | Tabela de dados genérica (TanStack Table)       |
| `date-picker.tsx`           | Date picker com calendário                      |
| `entity-index-page.tsx`     | Layout padrão para páginas de listagem          |
| `image-picker.tsx`          | Upload/preview de imagem                        |
| `list-filters-sheet.tsx`    | Sheet lateral com filtros de listagem           |
| `nav-action-column.tsx`     | Coluna de ações (View/Edit/Delete) para tabelas |
| `nav-user.tsx`              | Dropdown do usuário logado                      |
| `sale-checkout-drawer.tsx`  | Drawer de finalização de venda                  |
| `search-select.tsx`         | Select com busca assíncrona e debounce          |
| `stock-movement-drawer.tsx` | Drawer para movimentação de estoque             |

---

## 6. Componentes UI (`components/ui/`) — 53 componentes shadcn/ui

Incluem: `accordion`, `alert-dialog`, `alert`, `avatar`, `badge`, `breadcrumb`, `button`, `button-group`, `button-loader`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `empty`, `field`, `form`, `hover-card`, `input`, `input-group`, `input-otp`, `item`, `kbd`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `spinner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`

---

## 7. Formulários (`components/forms/`) — 14

| Formulário                | Entidade                         |
| ------------------------- | -------------------------------- |
| `login-form.tsx`          | Autenticação                     |
| `user-form.tsx`           | Usuários                         |
| `client-form.tsx`         | Clientes                         |
| `supplier-form.tsx`       | Fornecedores                     |
| `category-form.tsx`       | Categorias                       |
| `product-form.tsx`        | Produtos (com upload de imagem)  |
| `order-form.tsx`          | Pedidos de venda (com carrinho)  |
| `sale-checkout-form.tsx`  | Checkout de venda (pagamentos)   |
| `stock-movement-form.tsx` | Movimentação de estoque          |
| `address-form.tsx`        | Endereços (com auto-fill ViaCEP) |
| `contact-form.tsx`        | Contatos                         |
| `country-form.tsx`        | Países                           |
| `state-form.tsx`          | Estados                          |
| `city-form.tsx`           | Cidades                          |

---

## 8. Layouts (`components/layouts/`)

| Componente             | Descrição                                                   |
| ---------------------- | ----------------------------------------------------------- |
| `PrivateLayout.tsx`    | Layout com Sidebar + área de conteúdo (Outlet)              |
| `EntityTabsLayout.tsx` | Layout com tabs (Dados, Endereços, Contatos) para entidades |
| `ToggleTheme.tsx`      | Switch de tema dark/light                                   |

---

## 9. Rotas

### Públicas

| Rota     | Componente |
| -------- | ---------- |
| `/login` | `Login`    |

### Privadas (dentro de `PrivateLayout`)

| Módulo          | List               | Create               | Edit                   | View                   |
| --------------- | ------------------ | -------------------- | ---------------------- | ---------------------- |
| Home            | `/`                | —                    | —                      | —                      |
| Users           | `/users`           | `/users/create`      | `/users/:id/edit`      | `/users/:id/view`      |
| Clients         | `/clients`         | `/clients/create`    | `/clients/:id/edit`    | `/clients/:id/view`    |
| Suppliers       | `/suppliers`       | `/suppliers/create`  | `/suppliers/:id/edit`  | `/suppliers/:id/view`  |
| Categories      | `/categories`      | `/categories/create` | `/categories/:id/edit` | `/categories/:id/view` |
| Products        | `/products`        | `/products/create`   | `/products/:id/edit`   | `/products/:id/view`   |
| Stock Movements | `/stock-movements` | —                    | —                      | —                      |
| Orders          | `/orders`          | `/orders/create`     | `/orders/:id/edit`     | `/orders/:id/view`     |
| Purchase Orders | `/purchase-orders` | —                    | —                      | —                      |
| Countries       | `/countries`       | `/countries/create`  | `/countries/:id/edit`  | `/countries/:id/view`  |
| States          | `/states`          | `/states/create`     | `/states/:id/edit`     | `/states/:id/view`     |
| Cities          | `/cities`          | `/cities/create`     | `/cities/:id/edit`     | `/cities/:id/view`     |

Rota catch-all `*` → redireciona para `/login`.

---

## 10. Services (18)

| Service                     | Endpoint           | Observações                      |
| --------------------------- | ------------------ | -------------------------------- |
| `api.service.ts`            | —                  | HTTP client base (fetch wrapper) |
| `base.service.ts`           | —                  | CRUD genérico                    |
| `auth.service.ts`           | `/users/login`     | Login                            |
| `user.service.ts`           | `/users`           | CRUD + checkAuth + reativação    |
| `client.service.ts`         | `/clients`         | CRUD + reativação                |
| `supplier.service.ts`       | `/suppliers`       | CRUD + reativação                |
| `category.service.ts`       | `/categories`      | CRUD                             |
| `product.service.ts`        | `/products`        | CRUD + upload imagem (FormData)  |
| `stock-movement.service.ts` | `/stock-movements` | Create + getAll                  |
| `order.service.ts`          | `/orders`          | CRUD + cancel + refund           |
| `sale.service.ts`           | `/sales`           | Create (checkout)                |
| `purchase-order.service.ts` | `/purchase-orders` | CRUD                             |
| `address.service.ts`        | `/addresses`       | CRUD + resolveFromCep            |
| `contact.service.ts`        | `/contacts`        | CRUD                             |
| `country.service.ts`        | `/countries`       | CRUD                             |
| `state.service.ts`          | `/states`          | CRUD                             |
| `city.service.ts`           | `/cities`          | CRUD                             |
| `viacep.service.ts`         | `viacep.com.br`    | Auto-preenchimento de CEP        |

---

## 11. Utils (`src/utils/`)

| Arquivo             | Exports                                                                                                                                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base64.helpers.ts` | `convertToBase64`, `revertFromBase64`, `base64ToBlob`                                                                                                                                                                                                                                                |
| `crypto.helpers.ts` | `generateUUID` (com fallback para HTTP inseguro)                                                                                                                                                                                                                                                     |
| `date.helpers.ts`   | `dateOnlyOptionalSchema`                                                                                                                                                                                                                                                                             |
| `format.helpers.ts` | `formatOnlyNumbers`, `formatCpfCnpj`, `formatCep`, `formatDateOnly`, `formatPhone`, `formatPercentage`, `formatCurrency`, `formatNumber`, `formatDateTime`                                                                                                                                           |
| `toast.helpers.ts`  | `handleError` (extrai erros do `ApiError`), `handleSuccess`, `handleWarning`, `handleInfo`                                                                                                                                                                                                           |
| `validators.ts`     | `validateCpf`, `validateCnpj`, `validateCpfCnpj`, `validateOnlyNumbers`, `validateEmail`, `validatePhone`, `validateCep`, `validateNotEmpty`, `validateMinLength`, `validateMaxLength`, `validateRange`, `validatePassword`, `validateUrl`, `validateDate`, `validateFutureDate`, `validatePastDate` |
| `index.ts`          | Barrel re-exports de todos os helpers acima                                                                                                                                                                                                                                                          |

---

## 12. Configuração

### `vite.config.ts`

- Plugin React + TailwindCSS
- Path alias: `@` → `./src`
- Server: host `0.0.0.0`, porta `5173`, polling para Docker, HMR configurável

### `.env.example`

```
FRONTEND_PORT=80
VITE_API_URL=http://localhost:8080
```

### `components.json` — Configuração shadcn/ui

---

## 13. Docker

- **`Dockerfile`** — Build com Nginx para produção (porta 80)
- **`Dockerfile.development`** — Dev com Vite server (porta 5173)
- **`compose.development.yaml`** — Frontend em rede `nextflow-development-network`
- **`compose.staging.yaml`** — Frontend com Nginx em rede `nextflow-staging-network`
- **`nginx.conf`** — Configuração Nginx com fallback SPA (`try_files $uri /index.html`)

---

## 14. Provider Tree (Entry Point)

```
StrictMode
  └── BrowserRouter
      └── ThemeProvider
          └── AuthProvider
              ├── App (AppRoutes)
              └── Toaster (Sonner)
```

Providers de entidade são montados **dentro dos componentes de página** (não no root).

---

## 15. Git

**Branch principal:** `main` (+ `master` legada)
**Branches remotas:** task-04 a task-11
**Total de commits:** ~50+

### Evolução (mais antigo → mais recente)

1. Estrutura base (routing, auth, sidebar, shadcn/ui)
2. CRUD geográfico (Countries, States, Cities)
3. Clientes e Usuários (formulários, validação, tooltips)
4. Categorias (CRUD completo)
5. Produtos (formulários com upload de imagem)
6. Fornecedores (com endereços auto-fill ViaCEP)
7. Movimentação de Estoque (listagem com drawer)
8. Pedidos de Venda (CRUD com carrinho + checkout)
9. **Mais recente:** Ordens de Compra (CRUD)

---

## 16. Problemas Conhecidos / Notas

- `crypto.randomUUID()` → substituído por `generateUUID()` em `crypto.helpers.ts` para funcionar em contextos HTTP (produção sem HTTPS).
