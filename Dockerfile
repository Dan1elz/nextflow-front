# Estágio de Build
FROM node:20-alpine AS build
WORKDIR /app

# Argumentos que serão passados pelo Pipeline ou Compose para o build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./

# Instalar dependências (incluindo devDependencies necessárias para build)
RUN npm ci

# Copiar todo o código fonte para o container
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de Produção (Nginx)
FROM nginx:stable-alpine AS runtime
WORKDIR /usr/share/nginx/html

# Instalar wget para healthcheck e limpar o diretório de arquivos
RUN apk add --no-cache wget && rm -rf ./*

# Copia arquivos de build
COPY --from=build /app/dist .

# Copia configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80 (evita passar porta ao acessar pelo navegador)
EXPOSE 80

# Healthcheck para verificar se o servidor está online
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Comando para iniciar o servidor nginx
CMD ["nginx", "-g", "daemon off;"]