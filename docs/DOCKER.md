# Documentação de Execução: Frontend Docker

### 🚨 Pré-requisito Global (Executar na primeira vez)

Antes de rodar qualquer outro comando, é necessário verificar a existência da rede externa compartilhada entre os projetos, a qual permite a comunicação entre Backend e Frontend.

```bash
# Para ambiente de Desenvolvimento
docker network inspect nextflow-development-network >/dev/null 2>&1 || docker network create nextflow-development-network 

# Para ambiente de Homologação
docker network inspect nextflow-staging-network >/dev/null 2>&1 || docker network create nextflow-staging-network 
```

---

## 🏛 Motivação da Arquitetura

A arquitetura foi definida com o objetivo de atribuir à própria aplicação a responsabilidade sobre como ela é entregue (build e deploy). Isso garante que mudanças no código ou nas dependências reflitam diretamente na estrutura do container, sem depender de orquestradores externos complexos.

A estrutura baseia-se nos seguintes arquivos:

* **Dockerfile:** Gerencia a criação da imagem da aplicação (base para produção).
* **Dockerfile.development:** Gerencia a criação da imagem com dependências e ferramentas úteis para o estágio de desenvolvimento.
* **docker-compose.staging.yml:** Orquestrador do container frontend para ambientes de homologação/produção.
* **docker-compose.development.yml:** Orquestrador do container frontend para ambiente de desenvolvimento.

---

### 1. Ambiente de Desenvolvimento (Local)

Este ambiente habilita:

* **Vite Server** na porta `5173`.
* **Hot Reload** (HMR).
* Leitura do arquivo `.env` local.

**Pré-requisito:** Certifique-se de ter um arquivo `.env` na raiz do projeto (copie do `.env.example`).

Para iniciar:

```bash
docker compose -f docker-compose.development.yml up -d --build
```

> **Acesso:** [http://localhost:5173](http://localhost:5173)

### 2. Ambiente de Homologação

Por se tratar de um ambiente idêntico ao de produção, o servidor Nginx serve os arquivos estáticos compilados. Isso exige o build manual com a injeção da URL da API (simulando um pipeline de CI/CD).

```bash
# 1. Buildar a imagem injetando a variável de ambiente (Build Args)
docker build --build-arg VITE_API_URL=http://localhost:8000 -t aura-front:staging .

# 2. Subir o ambiente
docker compose -f docker-compose.staging.yml up -d
```

> **Acesso:** [http://localhost:80](http://localhost:80)

---

## 🔧 Gerenciamento e Debug

### Visualizar Logs

Útil para diagnosticar erros de build ou monitorar requisições no Nginx:

```bash
# Para Dev (Logs do Vite)
docker compose -f docker-compose.development.yml logs -f front

# Para Homolog (Logs do Nginx)
docker compose -f docker-compose.staging.yml logs -f front
```

### Acessar o Terminal do Container

Caso precise inspecionar a pasta `node_modules` ou testar comandos internos:

```bash
# Para Dev
docker exec -it -e TERM=xterm nextflow-development-front-1 sh

# Para Homolog
docker exec -it -e TERM=xterm nextflow-staging-front-1 sh
```

### Parar o Ambiente

```bash
docker compose -f docker-compose.development.yml down
```

*(Nota: O nome do container pode variar dependendo do nome da pasta raiz. Se falhar, verifique o nome correto com `docker ps` ou execute dentro da raiz do frontend)*