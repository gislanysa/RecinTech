# Etapa 1: build
# Usa Node para instalar dependências e gerar os arquivos estáticos
FROM docker.io/node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: produção
# Copia apenas os arquivos gerados para um Nginx leve
FROM docker.io/nginx:alpine AS runner

# Remove a config padrão do Nginx e usa a nossa
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos gerados pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
