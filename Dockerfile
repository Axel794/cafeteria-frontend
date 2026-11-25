# ---- Etapa 1: compilar Angular (configuracion production: usa environment.prod.ts) ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production

# ---- Etapa 2: servir los archivos estaticos con nginx ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/cafeteria-frontend/browser /usr/share/nginx/html
EXPOSE 80
