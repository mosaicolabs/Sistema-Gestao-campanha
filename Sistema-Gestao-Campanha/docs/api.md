---
meta:
  title: Consumir e evoluir a API HTTP
  navLabel: Referência da API
  category: Engenharia
  contentType: Reference
goal: Consultar rotas, autenticação, validação e respostas da API.
audience: Desenvolvedores frontend, backend e integradores autorizados.
---

# Consumir e evoluir a API HTTP

A API Express expõe recursos em `/api` e retorna JSON. As rotas operacionais exigem um JSON Web Token (JWT) válido, uma conta ativa e troca de senha concluída.

## Endereços

| Ambiente | Base |
| --- | --- |
| Desenvolvimento | `http://localhost:3333/api` |
| Docker local | `http://localhost:3333/api` |
| Healthcheck | `http://localhost:3333/health` |
| Documentação resumida | `http://localhost:3333/api/docs` |

## Autenticação

Faça `POST /auth/login` com `username` e `password`. A resposta contém `accessToken`, `expiresIn` e o usuário da sessão. Envie o token em `Authorization: Bearer your_access_token_here`; o token expira em 15 minutos.

O seed marca a conta inicial para troca obrigatória. Enquanto `mustChangePassword` estiver ativo, use `POST /auth/change-password`; a API bloqueia as demais rotas com `403`.

## Rotas disponíveis

| Método | Rota | Permissão |
| --- | --- | --- |
| `POST` | `/auth/login` | Pública, limitada por taxa |
| `GET` | `/auth/me` | Sessão válida |
| `POST` | `/auth/change-password` | Sessão válida |
| `GET` | `/dashboard` | `dashboard:read` |
| `GET` | `/references` | Sessão válida |
| `GET` | `/coverage` | `coverage:read` |
| `GET` | `/people` | `people:read` |
| `GET` | `/people/:id` | `people:read` |
| `POST` | `/people` | `people:create` |
| `GET` | `/boards` | `tasks:read` |
| `POST` | `/tasks` | `tasks:create` |
| `PATCH` | `/tasks/:id/move` | `tasks:update` |
| `GET` | `/calendar-events` | `calendar:read` |
| `POST` | `/calendar-events` | `calendar:create` |
| `PUT` | `/calendar-events/:id` | `calendar:update` |
| `GET` | `/deliveries` | `deliveries:read` |
| `POST` | `/deliveries` | `deliveries:create` |
| `GET` | `/imports` | `imports:read` |
| `POST` | `/imports` | `imports:create` |
| `GET` | `/reconciliation-issues` | `imports:read` |
| `POST` | `/reconciliation-issues/:id/decisions` | `imports:reconcile` |
| `GET` | `/product-decisions` | `imports:read` |
| `GET` | `/audit-logs` | `audit:read` |
| `GET` | `/users` | `users:manage` |
| `POST` | `/users` | `users:manage` |
| `PATCH` | `/users/:id/status` | `users:manage` |

## Consultar pessoas

`GET /people` aceita `search`, `localityId`, `roleId`, `page` e `pageSize`. A resposta retorna `data` e `pagination`; a busca compara nome, nome canônico e telefone.

```http
GET /api/people?search=angra&page=1&pageSize=20
Authorization: Bearer your_access_token_here
```

## Criar uma pessoa

`POST /people` recebe nome, contatos, atribuições de papel e vínculos de dobrada. A API normaliza o nome e o contato, pesquisa candidatos coincidentes e retorna um aviso sem fundir registros automaticamente.

```json
{
  "displayName": "Nome da liderança",
  "contacts": [{
    "type": "WHATSAPP",
    "value": "+55 24 99999-9999",
    "isPrimary": true
  }],
  "assignments": [],
  "alliances": []
}
```

## Agenda e concorrência

`GET /calendar-events` aceita `from` e `to` em formato ISO. `PUT /calendar-events/:id` exige `version`; se outra pessoa salvar antes, a API retorna `409 VERSION_CONFLICT` e você deve recarregar o evento.

## Importação de planilha

Envie a planilha como `multipart/form-data`, no campo `file`. O servidor aceita `.xlsx` de até 25 MB, calcula SHA-256 e retorna o lote; uma reimportação com o mesmo hash é idempotente.

## Formato de erro

Erros retornam `error.code`, `error.message` e, quando disponível, `error.details`. O status `422` indica validação, `401` indica sessão inválida, `403` indica permissão ou troca de senha pendente, `404` indica recurso inexistente e `409` indica conflito.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revise os dados informados.",
    "details": {}
  }
}
```

## Adicionar uma rota

Crie o schema em `packages/validation`, o repository, o service, o controller e a rota nessa ordem. Proteja a rota com `authenticate`, `requirePasswordChanged` e `requirePermission`; registre auditoria em toda mutação de domínio.
