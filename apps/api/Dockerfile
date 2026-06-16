# Smeta AI — Backend (Express + Prisma)
FROM node:20-slim
WORKDIR /app

# Prisma uchun openssl kerak
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY . .
RUN npm install \
 && npm run build -w @smeta/shared \
 && npm run db:generate -w @smeta/api \
 && npm run build -w @smeta/api

ENV NODE_ENV=production
ENV API_PORT=4000
EXPOSE 4000

# Migratsiya + idempotent bootstrap (admin + global katalog) + start
CMD ["sh", "-c", "npm run db:deploy -w @smeta/api && npm run db:bootstrap -w @smeta/api && npm run start -w @smeta/api"]
