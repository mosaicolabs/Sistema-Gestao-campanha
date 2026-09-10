FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/validation/package.json packages/validation/package.json

RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3333/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build -w @campanha/types \
  && npm run build -w @campanha/validation \
  && npm run build -w @campanha/web

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=10 CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1
