# Setup local — Front

> Só este repositório. Para subir o produto inteiro (API + front), veja `../nextflow-docs/docs/process/local-setup.md`.
> Detalhes de homologação: `docs/DOCKER.md`.

## Pré-requisitos
API rodando em `http://localhost:8080` (veja `../nextflow/docs/local-setup.md`). Docker Desktop ou Node.js.

## Subir
```
cp .env.example .env          # VITE_API_URL=http://localhost:8080
docker compose -f compose.development.yaml up -d --build
```
ou, sem Docker: `npm install` e `npm run dev`. Acesse `http://localhost:5173`.

## Comandos úteis
```
npm run build         # tsc -b + vite build: precisa passar
npm run lint
npm run format:check
docker compose -f compose.development.yaml logs -f
```
