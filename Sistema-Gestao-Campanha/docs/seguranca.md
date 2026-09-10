---
meta:
  title: Aplicar controles de segurança
  navLabel: Segurança
  category: Segurança
  contentType: Reference
goal: Aplicar os controles de sessão, entrada, dados e operação segura.
audience: Desenvolvedores, administradores e revisores de segurança.
---

# Aplicar controles de segurança

Os controles principais vivem na API: autenticação, autorização, validação, limite de login, cabeçalhos HTTP e auditoria. A interface complementa esses controles, mas não decide se uma operação pode ocorrer.

## Controles implementados

- Helmet adiciona cabeçalhos de proteção HTTP
- CORS restringe origens permitidas por `CORS_ORIGIN`
- O login aceita no máximo 20 tentativas por janela de 15 minutos
- Multer limita importação a `.xlsx` com 25 MB
- Zod valida corpo e query antes do service
- Prisma usa parâmetros e evita SQL montado manualmente
- JWT expira em 15 minutos
- Bcrypt usa entre 10 e 12 rounds
- Contas suspensas não autenticam
- Mutações protegidas escrevem `AuditLog`

## Dados de sessão

O JWT carrega sujeito, nome de usuário, permissões e indicação de troca pendente. O frontend guarda o token no store de autenticação; um `401` limpa a sessão. Não inclua senha, hash, dados sensíveis ou valores de planilha no token.

## Segredos

Mantenha `.env` fora do Git. Troque `JWT_SECRET`, `SEED_ADMIN_PASSWORD` e credenciais PostgreSQL em ambientes compartilhados. Use um gerenciador de segredos no ambiente de produção e nunca cole tokens ou senhas em logs, fixtures ou screenshots.

## Dados pessoais

O cadastro armazena nome e contatos para a operação da campanha. Use somente os dados necessários, restrinja permissões por papel, preserve origem para auditoria e siga a política definida em DP-015 e DP-020 quando ela for confirmada.

## Uploads

O servidor mantém o arquivo em memória durante o processamento e guarda ocorrências estruturadas, não um diretório público de arquivos. Valide extensão, tamanho, hash e conteúdo antes de aceitar novos formatos. Se o parser mudar, adicione teste para arquivo malformado e limite de memória.

## Dependências

Execute `npm audit` antes de publicar uma imagem. A instalação atual ainda apresenta alertas upstream em Prisma, Vitest, ExcelJS e dependências transitivas; não aplique `npm audit fix --force` sem revisar mudanças de versão e compatibilidade.

## Revisão de segurança

Antes de um ambiente compartilhado, confirme segredo exclusivo, CORS restrito, portas necessárias, backup, retenção, recuperação de acesso e política de exportação. DP-010 e DP-020 permanecem como fonte para decisões de sessão e ciclo de vida dos dados.
