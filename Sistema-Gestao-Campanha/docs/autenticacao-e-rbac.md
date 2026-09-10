---
meta:
  title: Operar autenticação, RBAC e auditoria
  navLabel: Autenticação e RBAC
  category: Segurança
  contentType: Reference
goal: Entender o ciclo de sessão, as permissões e os registros de auditoria.
audience: Desenvolvedores e administradores de acesso.
---

# Operar autenticação, RBAC e auditoria

O backend controla acesso com JSON Web Token (JWT), bcrypt e RBAC, sigla para controle de acesso baseado em papéis. A verificação ocorre na API, portanto esconder uma ação na interface nunca substitui a autorização do servidor.

## Ciclo de sessão

1. `POST /api/auth/login` valida usuário ativo e senha
2. A API emite JWT com sujeito, permissões e validade de 15 minutos
3. O frontend guarda a sessão em Zustand e Axios envia o token
4. `authenticate` valida assinatura e expiração em cada rota protegida
5. `requirePasswordChanged` bloqueia contas com troca pendente
6. Um `401` limpa a sessão no frontend e pede novo login

O token atual é um token de acesso. A política de token de renovação (refresh token), recuperação, autenticação multifator (MFA) e encerramento de sessões permanece na decisão DP-010.

## Senhas

Use bcrypt com `BCRYPT_ROUNDS` entre 10 e 12. A política de senha exige pelo menos 10 caracteres, uma letra minúscula, uma maiúscula e um número. A troca rejeita a reutilização da senha temporária.

## Papéis e permissões

Uma permissão combina `resource` e `action`, como `people:read` ou `users:manage`. Um papel agrupa permissões, e uma conta pode receber mais de um papel com escopo global ou específico. O seed cria o papel `ADMIN` com as permissões do MVP.

| Recurso | Ações seed |
| --- | --- |
| `dashboard` | `read` |
| `people` | `read`, `create`, `update` |
| `coverage` | `read` |
| `tasks` | `read`, `create`, `update` |
| `calendar` | `read`, `create`, `update` |
| `deliveries` | `read`, `create`, `update` |
| `imports` | `read`, `create`, `reconcile` |
| `users` | `manage` |
| `audit` | `read` |

## Usuários habilitados

Administradores criam contas em `POST /api/users` e escolhem papel de acesso. A API cria a conta com `mustChangePassword = true`; o administrador pode suspender ou reativar contas, mas não pode suspender a própria conta.

## Auditoria

Criações, mudanças de status, movimentações de tarefas, alterações de agenda, importações, conciliações e troca de senha escrevem `AuditLog`. Consulte `GET /api/audit-logs` para ver ação, entidade, autor, data e dados antes e depois quando disponíveis.

## Segredos e ambientes

Mantenha `.env` fora do versionamento. Troque `JWT_SECRET` e `SEED_ADMIN_PASSWORD` em qualquer ambiente compartilhado. O Docker fornece valores de desenvolvimento; eles não são credenciais de produção.
