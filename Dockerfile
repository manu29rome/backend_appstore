# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: production ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV JWT_SECRET=suitextech-jwt-s3cr3t-2024-railway-prod-k9mXpQwRvLnZ
ENV JWT_EXPIRES_IN=15m
ENV JWT_REFRESH_SECRET=suitextech-refresh-s3cr3t-2024-railway-prod-hT7yBdNcFjW2
ENV JWT_REFRESH_EXPIRES_IN=7d
ENV DATABASE_URL=postgresql://postgres:xxskSlvEtkHkTjkIonpWyOMVxdpczGBs@interchange.proxy.rlwy.net:36498/railway
ENV FRONTEND_URL=https://www.suitextech.store,https://suitextech.store,https://frontendappstore-store.up.railway.app
ENV CLOUDINARY_CLOUD_NAME=dv95y9iii
ENV CLOUDINARY_API_KEY=775585293291746
ENV CLOUDINARY_API_SECRET=Y-yNeIHM0UjSoSMCq-hjZCz9R9E

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
