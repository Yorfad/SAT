# ============================================
# Dockerfile para SAT Frontend (React + Vite)
# ============================================

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Argumentos de build (se pasan desde docker-compose)
# Usamos /api como ruta relativa para que nginx haga proxy al backend
ARG VITE_API_URL=/api

# Crear archivo .env para build
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env

# Construir la aplicación
RUN npm run build

# ============================================
# Etapa 2: Nginx para servir archivos estáticos
FROM nginx:alpine AS production

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados desde builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Nginx se inicia automáticamente
CMD ["nginx", "-g", "daemon off;"]
