---
meta:
  title: Diagnosticar falhas do ambiente
  navLabel: Operação e troubleshooting
  category: Operação
  contentType: Troubleshooting
goal: Identificar e corrigir falhas comuns de Docker, API, banco e frontend.
audience: Desenvolvedores e operadores do ambiente local.
---

# Diagnosticar falhas do ambiente

Comece pelo status dos containers e pelos logs do serviço que falhou. Preserve o volume PostgreSQL até confirmar que o problema não é apenas uma migration ou configuração.

## Ver o estado atual

```bash
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 web
docker compose logs --tail=100 postgres
```

O PostgreSQL deve estar `healthy` antes da API. A API deve responder `http://localhost:3333/health`, e o frontend deve responder `http://localhost:8080/health` quando a stack usa Docker.

## Porta já ocupada

Se o Compose informar que `3333`, `8080` ou `5432` está em uso, identifique o processo antes de pará-lo:

```bash
lsof -nP -iTCP:3333 -sTCP:LISTEN
lsof -nP -iTCP:8080 -sTCP:LISTEN
lsof -nP -iTCP:5432 -sTCP:LISTEN
```

Você pode trocar a porta publicada com `API_PORT`, `WEB_PORT` ou `POSTGRES_PORT`. A porta interna dos containers continua `3333`, `80` ou `5432`.

## API unhealthy após alteração de código

Leia os logs e confirme se o processo chegou a `Iniciando API`. Erros de módulo após build normalmente indicam `dist` ausente; use `docker compose build --no-cache api` para reconstruir a imagem sem caches.

Se o erro for de conexão, confirme `DATABASE_URL` dentro do Compose. O host do banco entre containers é `postgres`, não `localhost`.

## Migration falhou

Não remova o volume como primeira tentativa. Confirme o nome da migration e a causa no log, corrija o SQL ou a imagem, reconstrua a API e use o comando de recuperação do Prisma somente para uma tentativa reconhecidamente revertida:

```bash
docker compose run --rm --no-deps --entrypoint npx api \
  prisma migrate resolve --rolled-back 20260910120000_init \
  --schema=packages/database/prisma/schema.prisma
```

Depois, inicie a stack novamente e confirme `All migrations have been successfully applied`. Não marque como revertida uma migration que já alterou dados de forma parcial sem revisar o banco.

## Frontend abre, mas chamadas falham

Verifique `VITE_API_URL` no build da imagem web e `DOCKER_CORS_ORIGIN` no serviço API. O navegador acessa a API por `http://localhost:3333/api`, mesmo que a API use `postgres` para acessar o banco.

## Recriar o banco local

Este comando apaga o volume e todos os dados locais. Use-o apenas quando a finalidade for começar com banco vazio:

```bash
docker compose down -v
docker compose up --build
```

## Falha de login

Confirme o usuário e a senha definidos por `SEED_ADMIN_USERNAME` e `SEED_ADMIN_PASSWORD`. Se a conta exigir troca, acesse `/trocar-senha`; rotas operacionais retornam `PASSWORD_CHANGE_REQUIRED` até a troca terminar.
