# Estágio de Build
FROM node:20-alpine AS build
WORKDIR /app

# Argumentos vindos do Pipeline (obrigatório definir aqui para o Vite ler)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
# 'npm ci' é mais rápido e seguro para builds de CI/CD que 'npm install'
RUN npm ci

COPY . .
RUN npm run build

# Estágio de Produção (Nginx)
FROM nginx:stable-alpine AS runtime
WORKDIR /usr/share/nginx/html

# Instala wget (necessário para o healthcheck abaixo)
RUN apk add --no-cache wget

# Remove arquivos padrões do Nginx
RUN rm -rf ./*

# Copia os arquivos compilados do estágio anterior
COPY --from=build /app/dist .

# Copia configuração customizada (se tiver)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]