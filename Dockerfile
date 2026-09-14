FROM node:24-alpine AS build
WORKDIR /app
COPY . .
# deps do atlas + gera data.js + build do front (dist/ single-file)
RUN cd atlas && npm ci && node generate.mjs && npm run build

FROM node:24-alpine
WORKDIR /app
COPY --from=build /app ./
RUN rm -rf atlas/node_modules
ENV PORT=4321
EXPOSE 4321
CMD ["node", "atlas/server.mjs"]
