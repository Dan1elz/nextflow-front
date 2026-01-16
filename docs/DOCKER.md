### 🚨 Pré-requisito Global (Executar na primeira vez)

Antes de rodar qualquer outro comando, é necessario verificar a existencia da rede externa compartilhada entre os projetros que permite a comunicação entre Backend e Frontend.

```bash
# Para ambiente de Desenvolvimento
docker network inspect nextflow-development-network || docker network create nextflow-development-network

# Para ambiente de Homogação
docker network inspect  nextflow-staging-network || docker network create nextflow-staging-network
```

---

# Documentação de execução docker frontend.

Primeiro e mais importante é o motivo de tal arquitetura.
Conforme estudos/projetos, percebi que uma aplicação deve ter na necessidade de saber como ela é entregue ao cliente. para que caso o desenvolvedor faça alguma mudança, também sejá alterada somente o projeto que teve essa alteração.

Por isso, decidi escolher por uma arquitetura mais simples onde eu tiro a responsabilidade de criar um projeto orquestrador, e atribuo ela a própria aplicação, se baseando nos seguintes arquivos:

- **Dockerfile** Gerenciador da criação da imagem da aplicação.

- **Dockerfile.development** Gerenciador da criação da imagem da aplicação com dependencias uteis para o estagio de desenvolvimento.

- **docker-compose.staging.yml** orquestrador do container frontend docker para ambientes de homologação/produção.

- **docker-compose.development.yml** orquestrador do container frontend docker para ambiente de desenvolvimento.

### 1. Ambiente de Desenvolvimento (Local)

Este ambiente habilita:

- **Vite Server** na porta 5173.
- **Hot Reload** (HMR).
- Leitura do arquivo `.env` local.

**Pré-requisito:** Certifique-se de ter um arquivo `.env` na raiz (copie do `.env.example`).

Para iniciar:

```bash
docker compose -f docker-compose.development.yml up -d --build
```

> Acesse em: `http://localhost:5173`

### 2. Ambiente de Homologação

Por se tratar de um ambiente identico ao de produção, o servidor Nginx serve os arquivos estaticos compilados. Por isso exige o build manual com a injeção da url da API(simula um pipeline da aplicação).

```bash
# 1. Buildar a imagem injetando a variável de ambiente (Build Args)
docker build --build-arg VITE_API_URL=http://localhost:8000 -t aura-front:staging .

# 2. Subir o ambiente
docker compose -f docker-compose.staging.yml up -d

```

> Acesse em: `http://localhost:80`

---

## 🔧 Gerenciamento e Debug

### Visualizar Logs

Útil para ver erros de build ou requisições no Nginx:

```bash
# Para Dev (Logs do Vite)
docker compose -f docker-compose.development.yml logs -f front

# Para Homolog (Logs do Nginx)
docker compose -f docker-compose.staging.yml logs -f front

```

### Acessar o Terminal do Container

Caso precise inspecionar a pasta `node_modules` ou testar comandos:

```bash
# Em ambiente DEV (tem bash/sh instalado)
docker compose -f docker-compose.development.yml exec front sh

```
