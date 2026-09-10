#!/bin/sh
set -eu

echo "Aplicando migrations do PostgreSQL..."
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

echo "Executando seed idempotente..."
npx tsx packages/database/prisma/seed.ts

echo "Iniciando API na porta ${PORT:-3333}..."
exec node apps/api/dist/server.js
