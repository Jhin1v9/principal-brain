FROM node:24-alpine AS build
WORKDIR /app
COPY . .
# deps do atlas + gera data.js + build do front (dist/ single-file)
RUN cd atlas && npm ci && node generate.mjs && npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app ./
# runtime: apenas deps de produção (fastify etc.) — devDeps (vite/ts) ficam de fora
RUN cd atlas && npm ci --omit=dev && rm -rf /root/.npm
ENV PORT=4321
EXPOSE 4321
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
CMD ["/app/docker-entrypoint.sh"]
