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

# Xavfsizlik: root'da ishlamaymiz. node:20-slim'da tayyor 'node' (uid 1000)
# foydalanuvchisi bor. Ilova fayllari egaligini unga o'tkazamiz (Prisma
# generate qilgan client va build natijasi o'qilishi uchun) va shu user'ga
# o'tamiz — konteyner kompromiss bo'lsa privilegiya kengayishi cheklanadi.
RUN chown -R node:node /app
USER node

# Migratsiya + idempotent bootstrap (admin + global katalog) + start
CMD ["sh", "-c", "npm run db:deploy -w @smeta/api && npm run db:bootstrap -w @smeta/api && npm run start -w @smeta/api"]
