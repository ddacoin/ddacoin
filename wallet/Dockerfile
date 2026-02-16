# DDACOIN wallet – Node + Express + TypeScript.
# Connects to DDACOIN node RPC. Requires node with --addrindex for balance/history.
# Build and run in Docker: docker compose up -d

FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY tsconfig.json ./
COPY src ./src
COPY public ./public
RUN npm run build

# Production image: only runtime deps + built app
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

ENV PORT=3080
EXPOSE 3080
ENV WALLET_DATA_DIR=/data
VOLUME ["/data"]

CMD ["node", "dist/server.js"]
