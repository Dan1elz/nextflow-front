FROM node:20-alpine AS build
WORKDIR /app

# Argumento de build para VITE_API_URL
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

# Copiar arquivos de dependências primeiro (otimização de cache)
COPY package.json package-lock.json ./

# Instalar dependências (incluindo devDependencies necessárias para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação (VITE_API_URL será injetado no build)
RUN npm run build

FROM nginx:stable-alpine AS runtime
WORKDIR /usr/share/nginx/html

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Remover conteúdo padrão do nginx
RUN rm -rf ./*

# Copiar arquivos buildados
COPY --from=build /app/dist .

# Copiar configuração do nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck para verificar se o nginx está respondendo
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]