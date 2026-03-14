FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm typescript

COPY package.json pnpm-workspace.yaml ./
COPY apps/bot/package.json ./apps/bot/package.json
COPY apps/bot/tsconfig.json ./apps/bot/tsconfig.json

RUN pnpm install --filter bot

COPY apps/bot/src ./apps/bot/src
COPY data ./data

RUN cd apps/bot && npx tsc --project tsconfig.json

RUN ls -la apps/bot/dist/ || echo "dist folder missing!"

WORKDIR /app/apps/bot

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
