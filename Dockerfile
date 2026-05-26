FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci --quiet

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Compilation directe avec tsc (bypass nest CLI)
RUN ./node_modules/.bin/tsc -p tsconfig.json \
  && echo "=== dist/ ===" \
  && ls -la dist/ \
  && echo "=== Build OK ==="

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
