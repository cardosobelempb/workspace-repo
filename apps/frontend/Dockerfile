FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install

RUN cd apps/frontend && pnpm build

EXPOSE 3000

CMD ["sh", "-c", "cd apps/frontend && pnpm start"]