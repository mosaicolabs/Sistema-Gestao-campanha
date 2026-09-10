# Progresso do Sistema de Gestão da Campanha

Última atualização: 10/09/2026  
Branch de trabalho: `normalizacao-localidades`  
Último commit publicado localmente: `98d3b37 feat: normalizar localidades e exibir cobertura macro`

## Como usar este arquivo

Este é o ponto de retomada do projeto. Depois de cada plano implementado, registre aqui o commit, as validações executadas, as telas afetadas, as decisões confirmadas e o próximo plano. Não coloque senhas, tokens, telefones ou outros dados pessoais neste arquivo.

## Estado atual

| Área | Estado | Evidência |
| --- | --- | --- |
| Documentação base e agentes | Concluída | `docs/README.md` e `agents/README.md` |
| Docker Compose | Concluída | API, web e PostgreSQL saudáveis; API `3333`, web `8080`, PostgreSQL `5432` |
| Login e paleta do rebrand | Implementada localmente | `apps/web/src/features/auth/auth-pages.tsx`, `apps/web/src/index.css`; alterações anteriores ainda não estão no commit de normalização |
| Manifesto de localidades | Concluída | Commits `45e5c45` e `d1836e0`; hash do relatório preservado |
| Normalização e aliases | Concluída | Commit `98d3b37`; migration `20260910150000_locality_alias_normalization` |
| API de cobertura macro | Concluída | `GET /api/coverage/macro`, RBAC `coverage:read`, métrica principal articulador–cidade |
| UI de visão macro hierárquica | Planejada | [plan-003-visao-macro-cobertura-regioes-pessoas.md](../plans/plan-003-visao-macro-cobertura-regioes-pessoas.md) |
| Modal de pessoas por cidade | Planejada | Task 4 do plano 003 |
| Visão por dobrador | Planejada | Task 5 do plano 003 |

## Planos e commits

### Plan 001 — Rebrand da tela de login e paleta

- Estado: implementação existente no working tree.
- Entregas: paleta `#013F71`, `#013968`, `#FFFFFF`; logo `logoherosection.svg`; fundo `fundodegrade.png`; login responsivo.
- Pendência: criar commit próprio sem misturar a normalização de localidades.

### Plan 002 — Normalização de dados de localidades

- Estado: implementado e validado.
- Entregas: manifesto versionado, chave determinística, aliases com estado, seis mapeamentos canônicos aprovados, fila de revisão, dry-run/apply, API macro e documentação.
- Validação: build Docker da API/web, migration aplicada, seed idempotente, healthcheck `200`, macro autenticada `200`, ausência de JWT `401`, parâmetro inválido `422`, 12 testes direcionados aprovados e fixture de dry-run/apply limpa.

### Plan 003 — Visão macro de cobertura, regiões, cidades e pessoas

- Estado: planejamento criado; implementação ainda não iniciada.
- Objetivo: substituir a navegação da grande planilha por árvore de regiões/cidades, detalhe de pessoas por cidade e visão individual por dobrador.
- Próximo passo: confirmar as seis decisões de produto listadas no plano ou registrar as escolhas do gestor; depois executar Tasks 1–6 com testes por etapa.

## Decisões confirmadas

- DP-021: diferenças de maiúsculas, acentos e espaços são aliases seguros; os seis pares de cidade usam o nome canônico correto; métrica principal é relação articulador–cidade.

## Decisões ainda abertas

- DP-001 a DP-020 continuam pendentes conforme `docs/decisoes-pendentes.md`.
- O plano 003 adiciona decisões de apresentação e escopo da árvore, contatos, dobradores e vínculos sem localidade. Elas devem ser confirmadas antes do aceite final.

## Validações e comandos de retomada

Na raiz `Sistema-Gestao-Campanha/`:

```bash
npm run build
npm run typecheck
npm test
docker compose build api web
docker compose up -d postgres api web
docker compose ps
```

Para normalização de um lote:

```bash
npm run normalize:localities -w @campanha/api -- --batch-id "id-do-lote" --manifest packages/database/prisma/data/campanha-ea-2026-locality-manifest.json --dry-run
```

Antes de concluir o plan 003, validar manualmente em 375px e desktop: sidebar → Cobertura → Região → Cidade → diálogo com pessoas → dobrador → retorno à árvore.

## Handoff

Origem: planejamento Superpowers + documentação do projeto  
Destino: Product manager, arquiteto, frontend, backend, QA e redator técnico  
Objetivo: executar `plan-003-visao-macro-cobertura-regioes-pessoas.md` em etapas revisáveis  
Evidências: commit `98d3b37`, Docker saudável, testes direcionados aprovados  
Pendências: decisões de raiz geográfica, rótulo Alliance/Dobrador, vínculos sem cidade, linhas por papel, política de contatos e posição do acordeão de dobradores  
Próximo passo: confirmar as pendências e iniciar a Task 1 do plano 003
