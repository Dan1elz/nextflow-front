# Fluxo de imagem do produto

Este documento descreve o que implementar no **backend** e no **frontend** para o novo fluxo de imagem do produto: atualização sem remover a imagem atual, rota dedicada para remoção e substituição ao enviar nova imagem.

---

## Regras do fluxo

| Ação do usuário | Comportamento esperado |
|-----------------|------------------------|
| **Editar produto e não mexer na imagem** | Backend mantém a imagem atual. Frontend não envia o campo `image` (ou envia vazio). |
| **Editar produto e selecionar nova imagem** | Backend substitui a imagem antiga pela nova. Frontend envia o novo arquivo no PUT. |
| **Editar produto e clicar em "Remover imagem"** | Frontend chama a nova rota de remoção. Backend remove a imagem do produto (e do armazenamento, se aplicável). |

---

## 1. Backend

### 1.1. Rota PUT de atualização (produto)

- **Comportamento atual a alterar:** não tratar “imagem ausente” como “remover imagem”.
- **Comportamento desejado:**
  - Se o request **não trouxer** o campo `Image` (ou vier null/vazio): **manter a imagem atual** do produto (não apagar, não alterar).
  - Se o request **trouxer** um novo arquivo em `Image`: **substituir** a imagem antiga pela nova (upload + atualizar caminho/URL no banco e no storage, se usar).
- **Onde alterar:** caso de uso de atualização de produto (ex.: `UpdateProductUseCase`) e/ou controller que monta o DTO e chama o use case. Garantir que, quando `Image` não vem no request, o use case não chame lógica de “remover imagem” nem sobrescreva o campo com null.

### 1.2. Nova rota: remover imagem do produto

- **Método e URL sugeridos:** `DELETE /api/products/{id}/image` (ou `POST /api/products/{id}/image/remove` se preferir).
- **Função:** remover a imagem do produto cujo ID é `{id}`:
  - Atualizar o produto no banco (campo de imagem = null ou string vazia, conforme seu modelo).
  - Se a imagem estiver em arquivo (disco, blob, etc.), remover o arquivo também.
- **Autenticação/autorização:** mesma da rota de atualização do produto (ex.: `[Authorize]`).
- **Resposta sugerida:** 200 OK com o produto atualizado (ou 204 No Content), ou 404 se o produto não existir.
- **Implementação sugerida:**
  - Novo use case, ex.: `RemoveProductImageUseCase`, que:
    - Carrega o produto por ID.
    - Remove a imagem (limpa campo no modelo e, se houver, deleta o arquivo no storage).
    - Persiste o produto.
  - Novo endpoint no `ProductsController` que chama esse use case.

---

## 2. Frontend

### 2.1. Serviço (product.service)

- **Atualização (PUT):**
  - Se o usuário **não alterou** a imagem (continua vendo a URL antiga e não escolheu novo arquivo): **não enviar** o campo `image` no body (ou enviar apenas os outros campos). Assim o backend mantém a imagem atual.
  - Se o usuário **escolheu nova imagem** (arquivo no estado do formulário): enviar o novo arquivo no PUT (multipart/form-data ou como o backend esperar).
- **Nova chamada:** método para remover a imagem, por exemplo:
  - `removeImage(id: string, token?: string): Promise<void>` ou `Promise<IProduct>`.
  - Chamar a nova rota do backend, ex.: `DELETE /api/products/{id}/image` (ou a que você definir).

### 2.2. Contexto / Provider (products)

- Expor no contexto do produto uma função que chame o novo método do service, por exemplo:
  - `removeProductImage(id: string): Promise<void>` (ou retornar o produto atualizado, se o backend devolver).

### 2.3. Formulário de produto (product-form) e ImagePicker

- **Estado da imagem no formulário:**
  - Manter a distinção entre:
    - “imagem atual da API” (URL, só leitura para exibição).
    - “usuário escolheu novo arquivo” (File).
    - “usuário clicou em remover” (intenção de remoção).
- **Ao remover no ImagePicker (botão X):**
  - Se estiver em **modo edição** e existir produto com ID:
    - Chamar a nova rota de remoção (ex.: `removeProductImage(id)`).
    - Após sucesso, atualizar o estado local do formulário (limpar preview e o campo de imagem) e, se o contexto guardar o produto atual, atualizar esse produto (sem imagem).
  - Se estiver em **modo criação**: apenas limpar o campo (já é o comportamento atual).
- **Ao enviar o formulário (submit) em edição:**
  - Se a imagem no estado for a **mesma URL** que veio do backend (usuário não escolheu nem removeu): **não incluir** `image` no payload do PUT.
  - Se a imagem no estado for um **novo File**: incluir esse arquivo no PUT (substituir no backend).
  - Se o usuário **removeu** a imagem: a remoção já foi feita na chamada da rota de remoção; no PUT não enviar imagem (e o backend, com a nova regra, não remove de novo, pois a imagem já foi removida).

### 2.4. Fluxo resumido no frontend

1. **Criação:** enviar imagem apenas se houver arquivo selecionado (como hoje).
2. **Edição – usuário não mexe na imagem:** PUT sem campo `image` → backend mantém a atual.
3. **Edição – usuário escolhe nova imagem:** PUT com o novo arquivo → backend substitui.
4. **Edição – usuário clica em “Remover imagem”:**  
   - Chamar `DELETE /api/products/{id}/image` (ou equivalente).  
   - Após sucesso, atualizar UI e estado (sem imagem).  
   - No próximo submit do formulário (se houver), não enviar `image` no PUT.

---

## 3. Checklist de implementação

### Backend

- [ ] Ajustar o caso de uso (e/ou controller) de **atualização de produto** para que, quando `Image` não for enviada, a imagem atual do produto **não** seja removida nem sobrescrita.
- [ ] Criar **nova rota** para remoção da imagem (ex.: `DELETE /api/products/{id}/image`).
- [ ] Implementar use case (ex.: `RemoveProductImageUseCase`) que limpa o campo de imagem no produto e remove o arquivo do storage, se houver.
- [ ] Registrar o novo use case e expor o endpoint no `ProductsController`.

### Frontend

- [ ] No **product.service**: implementar método que chama a nova rota de remoção (ex.: `removeProductImage(id)`).
- [ ] No **products context/provider**: expor função que chama esse método (ex.: `removeProductImage`).
- [ ] No **product-form** (e/ou onde o ImagePicker é usado em edição): ao clicar em “Remover imagem” em modo edição, chamar a rota de remoção e atualizar estado/UI após sucesso.
- [ ] No **submit do formulário** em edição: enviar o campo `image` no PUT **somente** quando houver um **novo File** selecionado; quando for só a URL antiga ou após remoção, não enviar `image`.

---

## 4. Contrato da API (resumo)

| Método | Rota | Corpo | Comportamento |
|--------|------|--------|----------------|
| PUT | `/api/products/{id}` | JSON ou multipart com campos do produto | Se `Image` não for enviada: mantém imagem atual. Se `Image` for enviada: substitui pela nova. |
| DELETE | `/api/products/{id}/image` | — | Remove a imagem do produto (campo + arquivo, se houver). Retorno: 200 com produto ou 204. |

Com isso, o backend deixa de remover a imagem quando “não tem nada” no update, a remoção fica explícita na nova rota e a substituição ocorre apenas quando o frontend envia outra imagem no PUT.
