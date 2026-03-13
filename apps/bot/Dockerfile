FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
COPY apps/bot/package.json ./apps/bot/
COPY apps/bot/tsconfig.json ./apps/bot/

RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

COPY apps/bot/ ./apps/bot/
COPY data/ ./data/

RUN cd apps/bot && pnpm build

WORKDIR /app/apps/bot

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
