---
meta:
  title: Executar a stack completa com Docker
  navLabel: Docker
  category: Operação
  contentType: How-to
goal: Construir e operar os três containers do sistema.
audience: Desenvolvedores, homologadores e operadores do ambiente local.
---

# Executar a stack completa com Docker

O Compose constrói o frontend e a API, inicia o PostgreSQL e aplica migration e seed antes de liberar a aplicação. Os containers usam nomes fixos para facilitar inspeção e suporte.

## Serviços e portas

| Serviço | Container | Porta local | Função |
| --- | --- | ---: | --- |
| `web` | `SistemaCampanha_Web` | `8080` | React compilado servido por Nginx |
| `api` | `SistemaCampanha_Api` | `3333` | API Express e regras de negócio |
| `postgres` | `SistemaCampanha_Postgree` | `5432` | PostgreSQL persistido |

## Iniciar o ambiente

Execute na raiz do projeto:

```bash
docker compose up --build
```

O serviço `api` espera o healthcheck do PostgreSQL. O entrypoint executa `prisma migrate deploy`, roda o seed idempotente e inicia o servidor na porta `3333`. O serviço `web` espera a API ficar saudável.

## Verificar os containers

Use estes comandos para conferir estado e logs:

```bash
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 web
```

Considere o ambiente pronto quando os três serviços exibirem `healthy` ou `Up` com o healthcheck aprovado. A API responde em `http://localhost:3333/health`, e o Nginx responde em `http://localhost:8080/health`.

## Variáveis específicas do Compose

O Compose lê `.env` e oferece valores padrão para desenvolvimento. Use `DOCKER_CORS_ORIGIN` para o endereço do frontend em containers; `VITE_API_URL` é embutido durante o build da imagem web. Você pode trocar portas sem editar os Dockerfiles:

```dotenv
WEB_PORT=8080
API_PORT=3333
POSTGRES_PORT=5432
DOCKER_CORS_ORIGIN=http://localhost:8080
VITE_API_URL=http://localhost:3333/api
```

## Persistência e encerramento

O volume `sistema-campanha_campanha_postgres_data` preserva os dados entre reinícios. Pare a stack sem remover dados:

```bash
docker compose down
```

Use `docker compose down -v` somente para recriar o banco do zero. Essa ação remove o volume PostgreSQL e os dados locais.

## Build sem cache

Use o build sem cache quando alterar dependências, Dockerfiles ou arquivos de migration:

```bash
docker compose build --no-cache web api
docker compose up -d
```
