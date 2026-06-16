# Smeta AI — Mijoz ilovasi (build -> nginx static)
FROM node:20-slim AS build
WORKDIR /app
COPY . .
# VITE_API_URL bo'sh -> ilova bir xil domendagi /api ga murojaat qiladi (Caddy proxy qiladi)
RUN npm install && npm run build -w @smeta/shared && npm run build -w @smeta/web

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
