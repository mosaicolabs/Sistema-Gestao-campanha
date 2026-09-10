---
meta:
  title: Verificar uma mudança antes de entregar
  navLabel: Testes e qualidade
  category: Engenharia
  contentType: How-to
goal: Executar os checks do monorepo e interpretar seus resultados.
audience: Qualquer pessoa que altere código, schema ou configuração.
---

# Verificar uma mudança antes de entregar

O projeto usa TypeScript para checagem estática, Vitest para testes da API, build do Vite para o frontend e Compose para validar imagens. Rode os checks da raiz para cobrir os pacotes na ordem correta.

## Checklist padrão

```bash
npm run typecheck
npm test
npm run build
```

`typecheck` verifica todos os workspaces com script disponível. `test` compila os pacotes compartilhados e executa os testes da API. `build` gera os artefatos de produção de tipos, database, API e web.

## Testes existentes

Os testes em `apps/api/src` cobrem healthcheck, rejeição de rota protegida sem JWT e análise de um workbook sintético. O teste do parser verifica separação entre índice, territorial e dobrada, índices manuais e hash de ocorrência.

O parser também foi validado contra a planilha de origem e reproduziu 80 abas, 681 ocorrências territoriais, 739 ocorrências de dobradas e os índices 672 e 591.

## Testar API com banco

Suba o PostgreSQL e prepare o schema antes de exercitar uma rota que usa Prisma:

```bash
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm run dev -w @campanha/api
```

Use `curl` para healthcheck e `apps/api/src/app.test.ts` como referência para testes HTTP. Não coloque tokens reais nos testes; use fixtures ou credenciais locais descartáveis.

## Testar interface

Abra `http://localhost:5173` e verifique login, troca inicial de senha, navegação, estados de loading, vazio e erro. Teste pelo menos uma largura mobile, uma largura desktop, teclado e foco visível.

Quando alterar uma rota protegida, confirme que um usuário sem a permissão recebe `403`. Quando alterar agenda, confirme conflito de versão com dois payloads usando a mesma versão.

## Critérios para aceitar uma mudança

- O comportamento está ligado a um requisito do documento de requisitos do produto (PRD) ou a uma decisão confirmada
- O schema Zod e a validação da API cobrem entradas inválidas
- A mutação registra auditoria quando altera dados de domínio
- A tela apresenta carregamento, vazio, erro e sucesso quando aplicável
- O build não depende de `dist` ou cache gerado fora do comando
- A documentação correspondente foi atualizada
