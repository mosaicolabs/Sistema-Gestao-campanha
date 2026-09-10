---
meta:
  title: Configurar o ambiente de desenvolvimento
  navLabel: Ambiente local
  category: Engenharia
  contentType: How-to
goal: Configurar dependências, banco, seed e servidores locais.
audience: Desenvolvedores em onboarding ou manutenção local.
---

# Configurar o ambiente de desenvolvimento

Este guia inicia o PostgreSQL, aplica o schema, carrega o seed e executa API e frontend fora dos containers. Use [Docker](docker.md) quando quiser validar a stack completa em imagens.

## Pré-requisitos

Instale Node.js 22 ou superior, npm, Docker Desktop e Git. O projeto usa a porta `3333` para a API, `5173` para o Vite e `5432` para o PostgreSQL local.

## Preparar variáveis

Copie o exemplo e revise os valores:

```bash
cp .env.example .env
```

Não publique `.env`. Use um `JWT_SECRET` com pelo menos 32 caracteres e troque a senha seed antes de compartilhar um ambiente.

## Instalar e preparar o banco

Execute os comandos na raiz `Sistema-Gestao-Campanha`:

```bash
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
```

O seed cria o papel administrador, o usuário configurado, localidades, papéis de negócio, materiais, decisões pendentes e o snapshot diagnóstico. Ele usa `upsert`, portanto pode ser executado novamente.

## Iniciar API e web

Use dois terminais ou o script paralelo:

```bash
npm run dev
```

Abra `http://localhost:5173` para a interface. Consulte `http://localhost:3333/health` e `http://localhost:3333/api/docs` para verificar a API.

## Credencial inicial

O seed usa `SEED_ADMIN_USERNAME` e `SEED_ADMIN_PASSWORD`. O usuário começa com `mustChangePassword = true`; após o login, a API exige a troca antes de liberar rotas protegidas.

## Encerrar o ambiente

Pare os processos de desenvolvimento e desligue apenas o serviço de banco:

```bash
docker compose stop postgres
```

Use `docker compose down` para remover containers e a rede. Não use `docker compose down -v` se precisar preservar o volume de dados.
