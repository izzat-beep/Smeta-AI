# Smeta AI — Admin panel (build -> nginx static)
FROM node:20-slim AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build -w @smeta/shared && npm run build -w @smeta/admin

FROM nginx:alpine
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
