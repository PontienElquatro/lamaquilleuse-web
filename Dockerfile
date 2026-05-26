FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci --quiet

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN npm run build && echo "✅ Build OK" && ls -la dist/

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
