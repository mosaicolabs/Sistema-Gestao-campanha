---
meta:
  title: Normalizar localidades e consultar a visão macro
  navLabel: Normalização de localidades
  category: Dados
  contentType: Runbook
goal: Executar a normalização rastreável das cidades da campanha sem perder a origem.
audience: Desenvolvedores, analistas e gestores que revisam a importação.
---

# Normalização de localidades e visão macro

O fluxo transforma nomes de cidades em uma chave determinística, preserva o valor bruto da ocorrência e alimenta a visão macro agrupada por `Locality.id`. A fonte versionada é `packages/database/prisma/data/campanha-ea-2026-locality-manifest.json`, derivada exclusivamente das linhas 273–344 do relatório `Campanha_EA_2026_articuladores_por_cidade.md`.

## Regra aprovada

`normalizeLocalityKey` aplica NFD, remove marcas diacríticas, colapsa espaços, remove espaços nas extremidades e converte para maiúsculas. A regra serve para comparação; não corrige letras trocadas por aproximação.

O gestor confirmou a DP-021 em 10/09/2026:

- variações somente de caixa, acento e espaço viram aliases `ACTIVE` automaticamente;
- os seis pares do relatório são associados ao nome canônico correto da cidade;
- as grafias originais continuam em `SourceOccurrence` e em `LocalityAlias.value`;
- grafias de nomes de articuladores não são fundidas por este fluxo;
- o indicador primário da tela é a quantidade de relações articulador–cidade únicas.

Os seis mapeamentos aprovados são Cachoeira de Macacu → Cachoeiras de Macacu, Campos dos Goytacazes, Casemiro de Abreu, Comendador Levy Gasparian, Engenheiro Paulo de Frontin e Paty do Alferes. A tabela completa, com a grafia observada, está em [decisoes-pendentes.md](decisoes-pendentes.md).

## Proveniência e integridade

O manifesto registra o hash SHA-256 do relatório de origem:

```text
edb5c2cbfb2449b0f5280f7d452d2e1e722e9f2302996b0c218dc0ab5676c260
```

Confira o arquivo recebido antes de gerar outro manifesto:

```bash
shasum -a 256 "/Users/joaomvalente/Downloads/Campanha_EA_2026_articuladores_por_cidade.md"
```

Se o hash mudar, interrompa a carga e abra uma revisão do manifesto. Não substitua o JSON silenciosamente.

## Preparar o banco

Na raiz do monorepo, gere o cliente e aplique apenas migrations versionadas:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

A migration `20260910150000_locality_alias_normalization` adiciona `valueNormalized`, `status`, índice de busca e unicidade por localidade. Ela preenche aliases existentes sem apagar linhas. O seed registra DP-021 como `CONFIRMED` e continua idempotente.

## Executar por lote

Sempre comece com dry-run:

```bash
npm run normalize:localities -w @campanha/api -- \
  --batch-id "id-do-lote" \
  --manifest packages/database/prisma/data/campanha-ea-2026-locality-manifest.json \
  --dry-run
```

Revise `manifestSha256`, `canonicalMatches`, `safeAliases`, `manualCandidates`, `unmatched` e `openIssueIds`. O dry-run não chama `create`, `update`, `upsert` ou `delete`.

Depois, aplique somente com o lote e o manifesto conferidos:

```bash
npm run normalize:localities -w @campanha/api -- \
  --batch-id "id-do-lote" \
  --manifest packages/database/prisma/data/campanha-ea-2026-locality-manifest.json \
  --apply
```

Uma segunda execução é idempotente: aliases, vínculos de origem e pendências existentes não são duplicados. Toda escrita é transacional e gera `AuditLog`.

## O que entra em revisão

Uma grafia fora do manifesto ou uma colisão de chave abre `ImportIssue` do tipo `LOCALITY_ALIAS`. O detalhe inclui grafia bruta, chave, linha do relatório quando disponível, similaridade, cidade candidata, lote, aba, linha e hash da ocorrência. A decisão é registrada em `/api/reconciliation-issues/:id/decisions` com `targetEntityType=Locality` quando houver cidade alvo.

`CORRECT` e `MERGE` exigem uma cidade `CITY` ativa. `KEEP`, `SPLIT` e `REJECT` encerram a pendência sem fundir localidades. Pessoas, aliases de pessoas e os quatro blocos de 37 linhas não são alterados por essa decisão.

## Visão macro

`GET /api/coverage/macro` exige `coverage:read` e aceita `regionId`. Cada cidade aparece uma vez, por `Locality.id`, com:

- `articulatorCityRelations`: métrica principal, relações únicas entre pessoa com papel `ARTICULATOR` e cidade;
- `uniqueArticulators`: pessoas articuladoras distintas;
- `uniqueAssignments`: atribuições ativas distintas;
- `uniqueAlliances`: vínculos de dobrada distintos;
- `observedVariants`: grafias registradas;
- `pendingAliasCount`: aliases que ainda exigem revisão.

Os valores 148, 672, 591, 681 e 739 continuam controles históricos da importação. A normalização não reconcilia esses números nem transforma ocorrências em pessoas únicas.

## Rollback

Não use `prisma migrate reset` em ambiente com dados. Para desfazer um alias aprovado, registre uma decisão reversa e altere seu `status` para `INACTIVE`, mantendo a ocorrência e o log. Para desfazer uma migration em um ambiente descartável, restaure o backup e reaplique as migrations até a versão anterior; não edite o SQL já aplicado.

Após rollback, valide a quantidade de cidades na macro, as variantes exibidas e a presença do valor bruto na ocorrência de origem. Se o relatório de entrada tiver sido substituído, restaure o manifesto pelo hash anterior antes de reprocessar.
