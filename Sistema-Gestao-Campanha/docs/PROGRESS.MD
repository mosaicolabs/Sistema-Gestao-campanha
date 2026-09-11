# Progresso do Sistema de Gestão da Campanha

Última atualização: 10/09/2026  
Branch de trabalho: `normalizacao-localidades`  
Commit da implementação do plan 004: `2ed09db feat: carregar dados da planilha na visao macro`
Branch publicada: `origin/normalizacao-localidades`

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
| UI de visão macro hierárquica | Implementada | `CoverageNavigation`, acordeão de regiões/cidades e seção de dobradores na sidebar desktop e mobile |
| Modal de pessoas por cidade | Implementada | `CoverageCityDialog`, tabela responsiva e consulta sob demanda por cidade |
| Visão por dobrador | Implementada | `CoverageAllianceView`, agrupamento por região/cidade/papel e retorno para a árvore |
| Carga da visão macro (plan 004) | Implementada e publicada | Lote `cmtvnvn9j0046sg36jjbrsn1o`, 1.420 ocorrências, materialização transacional concluída |

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

- Estado: implementado e commitado localmente em `bc6e848`.
- Entregas: contratos compartilhados e schemas Zod; rotas protegidas para árvore, detalhe de cidade e detalhe de dobrador; queries Prisma com cadastro único; acordeão mobile-first na sidebar; diálogo acessível com papéis, contatos e dobradas; visão agrupada por dobrador; documentação de API e fluxo atualizada.
- Validação: `docker compose build api` e `docker compose build web` concluídos; containers PostgreSQL, API e web saudáveis; `/health` `200`; árvore autenticada `200`; rota sem JWT `401`; token sem `coverage:read` `403`; cidade inválida `422`; cidade válida `200`; dobrador inexistente `404`.
- Pendências: as seis suposições de apresentação continuam explicitamente marcadas no plano para confirmação do gestor; nenhuma decisão histórica da base foi resolvida.

### Plan 004 — Carga de dados da planilha na visão macro

- Estado: implementado, validado, commitado e publicado na branch `normalizacao-localidades` (`2ed09db`).
- Entregas: fingerprint semântico versionado; migration aditiva para artefatos, controles e estado de materialização; parser nomeado para abas, índices e colunas; detector de divergências sem hash fixo; persistência de 1.420 `SourceOccurrence`; dry-run e aplicação transacional; CLI e runbook; prévia de materialização na tela de Importações.
- Lote validado: 80 abas, 681 ocorrências territoriais, 739 ocorrências de dobradas, índices manuais 672/591, 148 duplicidades preservadas e um bloco adicional identificado; 80 controles de índice com observado/diferença; status `COMPLETED` após aplicação.
- Materialização atual: 843 pessoas e 843 atribuições vinculadas ao lote no primeiro apply; 30 entidades de dobrador observadas foram materializadas, enquanto nomes fora das 17 abas conhecidas permanecem como candidatos `PENDING_REVIEW`. A base global contém registros adicionais de tentativas anteriores e deve ser revisada antes de produção.
- Validação: `docker compose build api`, `docker compose build web`, migration aplicada, seed idempotente, healthchecks saudáveis, dry-run e apply autenticados executados no container; smoke HTTP confirmou prévia e cobertura. A geração local do Prisma/TypeScript foi substituída pela validação no Docker por lentidão do CLI no host.
- Observação: a aplicação foi corrigida para reutilizar a pessoa já ligada à ocorrência e ao papel. Não executar novas cargas em produção antes de revisar os candidatos criados no ensaio local.

## Decisões confirmadas

- DP-021: diferenças de maiúsculas, acentos e espaços são aliases seguros; os seis pares de cidade usam o nome canônico correto; métrica principal é relação articulador–cidade.
- DP-001: as 148 ocorrências são mantidas como evidência.
- DP-002: índices manuais e contagens observadas são armazenados e exibidos juntos.
- DP-005: a mesma pessoa pode ter múltiplos papéis, cidades e vínculos conforme a origem.
- DP-007: grafias/identidades de dobradores e casos Paraty/Serfiotis/Barra do Piraí foram confirmados.
- DP-015: religião permanece somente como evidência de origem restrita.

## Decisões ainda abertas

- DP-003, DP-004, DP-006, DP-008 a DP-014 e DP-016 a DP-020 continuam pendentes conforme `docs/decisoes-pendentes.md`.
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

Para importar a planilha e revisar a materialização:

```bash
npm run import:campaign -w @campanha/api -- --file "/caminho/Campanha_EA_2026_REV-006.xlsx" --dry-run
npm run import:campaign -w @campanha/api -- --batch-id "id-do-lote" --apply --acknowledge-pending --actor-user-id "id-do-usuario"
```

Antes de concluir o plan 003, validar manualmente em 375px e desktop: sidebar → Cobertura → Região → Cidade → diálogo com pessoas → dobrador → retorno à árvore.

## Handoff

Origem: planejamento Superpowers + documentação do projeto  
Destino: Product manager, arquiteto, frontend, backend, QA e redator técnico  
Objetivo: executar `plan-004-carga-dados-planilha-visao-macro.md` em etapas revisáveis  
Evidências: builds Docker da API/web concluídos; migration e seed aplicados; lote com 1.420 ocorrências e materialização `COMPLETED`; dry-run/apply executados no container.  
Pendências: revisar candidatos fora das 17 abas de dobradores, decidir DP-006/RBAC e executar revisão final de idempotência em banco limpo.  
Próximo passo: revisar este diff, executar smoke HTTP das rotas de materialização e fazer o commit da carga sem incluir o arquivo XLSX.
