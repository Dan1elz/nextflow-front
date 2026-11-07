# Setup local — Front

> Só este repositório. Para subir o produto inteiro (API + front) numa máquina nova, veja
> `../nextflow-docs/docs/process/local-setup.md` e `../nextflow-docs/docs/HANDOFF.md`.
> Detalhes de homologação: `docs/DOCKER.md`. Conferido contra `compose.development.yaml`, `.env.example` e
> `Dockerfile.development` em 07/11/2026.

## Pré-requisitos
- API rodando em `http://localhost:8081` (compose de dev do back, veja `../nextflow/docs/local-setup.md`) ou em
  `http://localhost:5145` (`dotnet run`).
- Docker Desktop (com integração WSL, repo clonado dentro do Linux) ou Node.js (o container usa Node 20).

## Subir (hot reload)
```
docker compose -f compose.development.yaml up -d --build
```
Acesse `http://localhost:5174` (porta `FRONT_PORT`, padrão 5174; dentro do container o Vite usa 5173). O `.env` é
opcional: sem ele, `VITE_API_URL` vale `http://localhost:8081`. Para apontar para o `dotnet run`, crie o `.env` a partir
do `.env.example` com `VITE_API_URL=http://localhost:5145`.

Sem Docker: `npm install` e `npm run dev` (Vite em `http://localhost:5173`; o `VITE_API_URL` vem do `.env`).

Build de produção servido pelo nginx: suba pelo compose do back com `--profile front` (`http://localhost:8082`). A URL
da API entra no build: mudou, rode com `--build`.

## Comandos úteis
```
npm run build         # tsc -b + vite build: precisa passar
npm run lint          # os erros em .agents/skills/shadcn/assets são pré-existentes, não são do app
npm run format:check
docker compose -f compose.development.yaml logs -f
```
