# Carga dos dados da planilha na visão macro Implementation Plan

> **Status de execução (10/09/2026):** Tasks 1–8 implementadas na branch `normalizacao-localidades`. A migration foi aplicada no PostgreSQL local, o lote da revisão foi carregado com 1.420 ocorrências e a materialização transacional foi concluída. A documentação e a revisão final de candidatos permanecem como fechamento operacional da Task 9.

### Evidência da execução

- `docker compose build api web` concluído com Prisma Client regenerado no container.
- `docker compose up -d postgres api web` concluído; os três serviços ficaram saudáveis.
- Dry-run: 80 abas, 681 territoriais, 739 de dobradas, 1.420 ocorrências, índices manuais 672/591.
- Apply: `materializationStatus=COMPLETED`, 148 ocorrências duplicadas mantidas, controles manual/observado persistidos.
- Smoke HTTP: prévia `200`, árvore `200`, ausência de JWT `401`, cidade inexistente `404`.
- O ciclo TDD foi explicitamente dispensado pelo gestor; build, migration, seed, dry-run, apply e smoke foram usados como validação substituta.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Apply `superpowers:test-driven-development`, `superpowers:systematic-debugging` when a test fails, and `superpowers:verification-before-completion` before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Importar integralmente a planilha aberta `Campanha_EA_2026_REV-006` para a camada de evidência do PostgreSQL e materializar, com rastreabilidade e regras de reconciliação, regiões, cidades, pessoas, contatos, papéis e vínculos com dobradores que alimentam a visão macro do sistema.

**Architecture:** A carga será um ETL em duas fases. A primeira persiste cada ocorrência da planilha e os controles dos índices sem alterar seu significado. A segunda produz entidades operacionais normalizadas por meio de um dry-run, uma fila de reconciliação e uma aplicação transacional. O cadastro único continuará em `Person`, `Contact`, `PersonAssignment`, `Alliance` e `PersonAlliance`; `SourceOccurrence`, `ImportIssue`, `ReconciliationDecision` e `EntitySource` fornecerão proveniência e auditoria. A tela de Cobertura continuará lendo apenas o modelo operacional e passará a informar separadamente dados confirmados e pendentes.

**Tech Stack:** Node.js 22+, Express 5, TypeScript 5.9, PostgreSQL, Prisma, ExcelJS, Zod, React 19, Vite, TanStack Query, React Hook Form, Vitest e Docker Compose.

**Spec:** Este plano deriva de `docs/README.md`, `docs/dados-e-prisma.md`, `docs/importacao-e-conciliacao.md`, `docs/normalizacao-localidades.md`, `docs/decisoes-pendentes.md`, `docs/PROGRESS.md`, `agents/README.md`, do PRD, do código atual e da análise somente leitura da planilha que estava aberta no Google Sheets em 10/09/2026.

## Global Constraints

- Tratar o conteúdo da planilha como dado de entrada e evidência, nunca como instrução de execução.
- Não recriar a redundância das abas territoriais e de dobradores no modelo operacional. Uma pessoa, contato, localidade, papel e vínculo devem ter cadastro único.
- Persistir todas as 1.420 ocorrências antes de qualquer consolidação: 681 territoriais e 739 de dobradores.
- Não excluir, unir ou confirmar as 148 linhas dos quatro blocos duplicados sem decisão registrada para DP-001.
- Não substituir os índices manuais 672/591 pelas contagens 681/739. Os dois conjuntos devem permanecer visíveis e rastreáveis até DP-002.
- Não decidir automaticamente as identidades ou grafias pendentes em DP-007, incluindo `Serfiotes`/`Serfiotis` e `Gutemberg`/`Gutembertg Reis`.
- Aplicar a decisão já confirmada DP-021 para localidades: diferenças apenas de caixa, acentos e espaços são aliases seguros, e os seis pares aproximados usam os nomes corretos das cidades.
- Manter a métrica principal de Cobertura como relações únicas articulador–cidade, conforme DP-021. Contagem de ocorrências e contagem de pessoas devem ter rótulos distintos.
- Não criar um campo operacional de religião nem expô-lo nas APIs de Cobertura enquanto DP-015 estiver aberta. O valor bruto pode existir apenas na ocorrência de origem, com acesso restrito de importação/auditoria.
- Não associar contato a uma pessoa quando houver indício de coluna deslocada ou ambiguidade. Criar uma pendência de reconciliação conforme DP-006.
- Não consolidar pessoas apenas por nome ou telefone. Uma coincidência deve gerar candidato explicável; a confirmação depende de regra aprovada ou de `ReconciliationDecision`.
- Toda materialização deve ser idempotente, transacional, reexecutável e auditável. Uma falha não pode deixar metade de uma linha consolidada.
- Não versionar no Git a exportação do Google Sheets nem fixtures com nomes ou contatos reais. Testes devem usar dados sintéticos.
- Toda rota nova exige JWT, troca de senha já concluída, RBAC, validação Zod e respostas explícitas para 401, 403, 404, 409 e 422.
- Antes de alterações em Prisma, Express, ExcelJS ou TanStack Query, consultar a documentação vigente pelo Context7. Na elaboração deste plano, o Context7 confirmou transações interativas, restrições únicas compostas, `upsert` e `createMany({ skipDuplicates: true })` como padrões compatíveis para idempotência; a regra de negócio continua sob responsabilidade do projeto.
- Atualizar `docs/PROGRESS.md` somente depois que o plano for implementado, testado e aplicado com sucesso. Não marcar este plano como concluído durante a fase de planejamento.

---

## 1. Evidência obtida da aba aberta

### 1.1 Identificação da fonte

| Item | Valor observado |
| --- | --- |
| Documento aberto | `Campanha_EA_2026_REV-006 - Google Sheets` |
| URL analisada | `https://docs.google.com/spreadsheets/d/1kiOXmyCeTEWqZLhWQFfCXP8khl3F-72TNPHWlub00BI/edit` |
| Modo de acesso | Somente leitura |
| Abas totais | 80 |
| Índices | 9: um geral e oito regionais |
| Abas territoriais/cidades | 54 |
| Abas de dobradores | 17 |
| SHA-256 binário da exportação aberta | `5e64594ae4033f50fa65bf581c8420b1d9d2a3849f35bfb631ed3561927a1262` |
| SHA-256 binário do arquivo local conhecido | `a04f4117cb5fcf07cb2f5bd4a8cdefd17fe58ef2c0bfcd06afc487b1ea9534f0` |
| Impressão semântica comum aos dois arquivos | `d83aa3b24bf2bef09166f632f7463950a1ce6749f6b0c5cf724e9f30f568b5e1` |

Os hashes binários diferem porque uma exportação do Google Sheets pode reorganizar o pacote XLSX sem alterar as células. A impressão semântica, calculada com nomes das abas, posições, índices e primeiras oito células normalizadas das linhas, é idêntica. A importação deve usar `fileHash` para identificar o artefato e `semanticHash` para identificar a revisão lógica; assim, os dois arquivos não criam duas campanhas ou duas materializações.

### 1.2 Controles gerais

| Controle | Índice manual | Ocorrências reais | Diferença |
| --- | ---: | ---: | ---: |
| Territorial | 672 | 681 | +9 |
| Dobradores | 591 | 739 | +148 |
| Total de linhas de dados | 1.263 | 1.420 | +157 |

Esses números descrevem linhas de origem. Eles não são contagens de pessoas únicas, contatos únicos nem relações articulador–cidade.

### 1.3 Regiões e cidades

Após aplicar somente os aliases de localidade aprovados na DP-021, inclusive `Casemiro de Abreu`, a distribuição territorial observada é:

| Região | Índice manual | Linhas territoriais | Diferença |
| --- | ---: | ---: | ---: |
| Região dos Lagos | 25 | 25 | 0 |
| Centro Sul | 66 | 71 | +5 |
| Costa Verde | 13 | 13 | 0 |
| Sul Fluminense | 365 | 368 | +3 |
| Metropolitana | 185 | 185 | 0 |
| Noroeste Fluminense | 0 | 0 | 0 |
| Norte Fluminense | 5 | 5 | 0 |
| Serrana | 13 | 14 | +1 |
| **Total** | **672** | **681** | **+9** |

As diferenças localizadas entre índice regional e aba territorial são:

| Cidade | Índice manual | Linhas da aba | Diferença |
| --- | ---: | ---: | ---: |
| Angra dos Reis | 9 | 8 | -1 |
| Itaguaí | 0 | 1 | +1 |
| Casemiro de Abreu | não casou pela grafia do índice | 1 | resolvido como alias pela DP-021 |
| Paty do Alferes | 1 | 6 | +5 |
| Teresópolis | 0 | 1 | +1 |
| Volta Redonda | 161 | 164 | +3 |

O índice manual deve permanecer armazenado por região e cidade. O sistema pode recalcular as ocorrências, mas não pode tratar o número calculado como correção do índice.

### 1.4 Dobradores

| Dobrador no índice | Índice manual | Aba correspondente | Linhas da aba | Diferença |
| --- | ---: | --- | ---: | ---: |
| Dani Cunha | 377 | Dani Cunha | 377 | 0 |
| Coronel Henrique | 5 | Coronel Henrique | 5 | 0 |
| Hugo Leal | 2 | Hugo Leal | 2 | 0 |
| Wellington José | 18 | Wellington José | 18 | 0 |
| Eloi Ramalho | 4 | Eloi Ramalho | 4 | 0 |
| Áureo Ribeiro | 78 | Áureo Ribeiro | 78 | 0 |
| Júnior Trovão | 1 | Júnior Trovão | 1 | 0 |
| Serfiotes | 22 | Serfiotis | 22 | 0 |
| Vinicius Farah | 56 | Vinicius Farah | 56 | 0 |
| Marta Rocha | 11 | Marta Rocha | 48 | +37 |
| Sostenes | 6 | Sostenes | 43 | +37 |
| Abraão | 1 | Abraão | 38 | +37 |
| Luciano Vieira | 2 | Luciano Vieira | 39 | +37 |
| Talita Galhardo | 1 | Talita Galhardo | 1 | 0 |
| Altineu Côrtes | 1 | Altineu Côrtes | 1 | 0 |
| Gutemberg | 2 | Gutembertg Reis | 2 | 0 |
| Luizinho | 4 | Luizinho | 4 | 0 |
| **Total** | **591** |  | **739** | **+148** |

A inspeção encontrou 149 ocorrências duplicadas por assinatura exata, distribuídas em 38 assinaturas repetidas. Elas devem permanecer divididas em dois controles:

- 148 ocorrências pertencem aos quatro blocos de 37 linhas já documentados em DP-001.
- Uma ocorrência adicional é o par repetido já documentado na aba `Wellington José`.

Nenhuma das duas categorias pode ser removida automaticamente. O fato de uma linha ser idêntica é evidência de repetição, não autorização para apagá-la.

### 1.5 Estrutura das colunas

#### Abas territoriais

| Coluna | Cabeçalho observado | Destino proposto |
| --- | --- | --- |
| A | Articulador | `Person` + `PersonAssignment(ARTICULATOR, cidade da aba)` |
| B | Coordenador | `Person` + `PersonAssignment(COORDINATOR, cidade da aba)` |
| C | Contato | `Contact` do coordenador apenas quando a linha for consistente |
| D | Liderança | `Person` + `PersonAssignment(LEADERSHIP, cidade da aba)` |
| E | Região | Contexto/localidade interna bruta; não é a macrorregião estadual |
| F | Contato | `Contact` da liderança apenas quando a linha for consistente |
| G | Dep Federal | `Alliance` e relação da liderança com o dobrador |
| H | Religião | Somente `SourceOccurrence.rawValues` com acesso restrito enquanto DP-015 estiver aberta |

#### Abas de dobradores

| Coluna | Cabeçalho observado | Destino proposto |
| --- | --- | --- |
| Nome da aba | Dobrador | `Alliance`; divergências de grafia ficam `PENDING_REVIEW` |
| A | Cidade | `Locality(CITY)` canônica e sua macrorregião por `parentId` |
| B | Articulador | `PersonAssignment(ARTICULATOR, cidade)` e vínculo contextual com o dobrador |
| C | Coordenador | `PersonAssignment(COORDINATOR, cidade)` e vínculo contextual com o dobrador |
| D | Contato | `Contact` do coordenador apenas quando a linha for consistente |
| E | Liderança | `PersonAssignment(LEADERSHIP, cidade)` e vínculo de apoio ao dobrador |
| F | Região | Contexto/localidade interna bruta; não é a macrorregião estadual |
| G | Contato | `Contact` da liderança apenas quando a linha for consistente |
| H | Religião | Somente ocorrência restrita enquanto DP-015 estiver aberta |

O campo chamado `Região` dentro das abas contém bairros, áreas locais, números de pessoas e nomes de organizações. A macrorregião deve vir exclusivamente da relação `CITY -> REGION`. O valor da coluna deve ser preservado como evidência e só pode criar `Locality(type=LOCAL_AREA)` depois de classificado ou confirmado.

### 1.6 Completude observada nas 681 linhas territoriais

| Campo esperado | Linhas vazias |
| --- | ---: |
| Articulador | 2 |
| Coordenador | 366 |
| Contato do coordenador | 681 |
| Liderança | 5 |
| Contexto/localidade interna | 319 |
| Contato da liderança | 522 |
| Deputado federal/dobrador | 41 |
| Religião | 495 |

Campo vazio significa “não informado na origem”. Não significa que a pessoa, o contato ou o vínculo não exista. A UI deve usar esse vocabulário.

---

## 2. Diagnóstico do banco e do código atuais

- O seed contém um `ImportBatch` diagnóstico com os contadores 80/681/739/672/591, mas sem `SourceOccurrence` e sem `EntitySource`.
- O banco consultado tem apenas um cadastro de demonstração: 1 pessoa, 1 contato e 1 atribuição; não há `Alliance` nem `PersonAlliance` materializadas.
- `import.service.ts` já lê as 17 abas de dobradores e conta 681/739, porém usa somente o SHA-256 binário para idempotência.
- As pendências conhecidas só são criadas quando o hash binário é igual ao arquivo local. A exportação da aba aberta possui outro hash e perderia essas pendências.
- A normalização de localidades cria e vincula aliases, mas ainda não transforma as colunas de pessoa, contato, papel e dobrador em entidades operacionais.
- A tela de Cobertura e seus endpoints já leem o modelo normalizado. Ela permanece vazia porque o ETL não materializa as entidades exigidas.

---

## 3. Abordagens consideradas

### A. Ler diretamente `SourceOccurrence` na tela de Cobertura

Entregaria dados rapidamente, mas reproduziria a planilha dentro da aplicação, duplicaria regras de pessoa e contato no frontend e misturaria linhas suspeitas com vínculos confirmados. Não atende ao cadastro único do PRD.

### B. Executar um seed ou SQL direto com todas as células

Criaria registros operacionais sem proveniência, sem decisões e sem reprocessamento seguro. Também tornaria difícil desfazer apenas uma revisão da planilha. Não é aceitável para esta base.

### C. ETL em duas fases com staging nas ocorrências e materialização rastreável — recomendada

Primeiro, todas as linhas são persistidas e classificadas. Depois, regras determinísticas produzem um relatório de candidatos, pendências e alterações. A aplicação usa transação, chaves idempotentes e `EntitySource`. Essa abordagem preenche a visão macro sem apagar as divergências que o gestor ainda precisa decidir.

---

## 4. Modelo de dados proposto

### 4.1 Revisão lógica e artefatos recebidos

Adicionar:

```prisma
enum MaterializationStatus {
  NOT_STARTED
  READY
  RUNNING
  REVIEW_REQUIRED
  COMPLETED
  FAILED
}

model ImportBatch {
  // campos existentes
  semanticHash          String?               @unique
  parserVersion         String?
  materializationStatus MaterializationStatus @default(NOT_STARTED)
  materializedAt        DateTime?
  materializationError  String?
  artifacts             ImportArtifact[]
}

model ImportArtifact {
  id            String      @id @default(cuid())
  importBatchId String
  filename      String
  fileHash      String      @unique
  observedAt    DateTime    @default(now())
  importBatch   ImportBatch @relation(fields: [importBatchId], references: [id], onDelete: Cascade)

  @@index([importBatchId, observedAt])
}
```

`ImportArtifact.fileHash` identifica cada binário recebido e `ImportBatch.semanticHash` identifica o conteúdo lógico. Durante a migration, o `fileHash` atual deve ser copiado para `ImportArtifact`; o campo legado em `ImportBatch` só pode ser removido depois da compatibilidade de leitura e do backfill serem verificados. O serviço busca o artefato por `fileHash`, calcula a revisão lógica quando necessário e associa novos binários equivalentes ao mesmo lote. Quando encontrar o lote diagnóstico vazio da mesma revisão, deve enriquecê-lo em vez de criar uma segunda revisão.

### 4.2 Controles de índice

Os totais gerais existentes não registram a origem por região, cidade e dobrador. Criar um modelo de controle, sem tratá-lo como entidade operacional:

```prisma
enum IndexControlScope {
  TERRITORIAL_TOTAL
  REGION
  CITY
  ALLIANCE_TOTAL
  ALLIANCE
}

model ImportIndexControl {
  id             String       @id @default(cuid())
  importBatchId  String
  scope          IndexControlScope
  sourceSheet    String
  sourceCell     String
  sourceLabel    String
  normalizedKey  String
  manualCount    Int
  observedCount  Int?
  difference     Int?
  importBatch    ImportBatch  @relation(fields: [importBatchId], references: [id], onDelete: Cascade)

  @@unique([importBatchId, scope, sourceSheet, sourceCell])
  @@index([importBatchId, normalizedKey])
}
```

Esse modelo preserva 672/591 e cada subtotal sem sobrescrever a origem.

### 4.3 Semântica dos vínculos com dobradores

Uma liderança apoia o dobrador; articulador e coordenador trabalham no contexto da aba dele. Essas relações não devem receber o mesmo significado. Acrescentar:

```prisma
enum AllianceRelationType {
  SUPPORTS
  ARTICULATES_FOR
  COORDINATES_FOR
}

model PersonAlliance {
  // campos existentes
  relationType AllianceRelationType
  relationKey  String               @unique
}
```

`relationKey` deve ser calculada a partir de pessoa, dobrador, cidade ou ausência de cidade e tipo de relação. Várias ocorrências podem apontar para o mesmo vínculo por `EntitySource`; reimportar uma revisão não cria outra relação operacional.

### 4.4 Rastreabilidade

Usar `EntitySource` para cada entidade materializada:

- `Person`: colunas A/B/D territoriais ou B/C/E dos dobradores.
- `Contact`: coluna de contato e a pessoa proprietária inferida.
- `PersonAssignment`: pessoa + papel + cidade.
- `Alliance`: nome da aba ou coluna `Dep Federal`.
- `PersonAlliance`: pessoa + dobrador + cidade + tipo de relação.
- `LocalityAlias`: grafia observada e cidade canônica.

`fieldMapping` deve registrar apenas metadados de origem, por exemplo `{ "sourceField": "leadership", "sourceColumn": "E" }`, sem copiar telefone ou religião para logs.

### 4.5 Identidade de pessoas

O pipeline deve separar quatro resultados:

1. **Entidade já vinculada:** existe `EntitySource` ou uma decisão anterior aponta a ocorrência para uma pessoa.
2. **Correspondência determinística aprovada:** regra versionada aceita pelo gestor, com todos os campos exigidos.
3. **Candidato:** nomes/contatos/contextos semelhantes; cria `ImportIssue(DUPLICATE_CANDIDATE)` e não une automaticamente.
4. **Nova pessoa:** nenhuma candidata razoável; cria `Person(PENDING_REVIEW)` com proveniência.

O dry-run deve mostrar por regra quantas pessoas seriam reutilizadas, criadas e enviadas para revisão. A contagem final de pessoas não deve ser escrita no plano, porque depende das decisões de identidade.

---

## 5. Fluxo de carga e reconciliação

1. Receber `.xlsx`, calcular `fileHash` e validar tamanho/formato.
2. Ler todas as abas, os índices e as primeiras oito colunas de cada linha.
3. Calcular `semanticHash` com uma serialização estável e versionada.
4. Localizar ou criar o lote lógico; preservar todos os hashes binários observados no `AuditLog` ou metadado do lote.
5. Persistir 1.420 `SourceOccurrence` e os controles de índice em transação.
6. Detectar divergências estruturalmente, sem depender de um hash constante no código.
7. Aplicar aliases de localidade confirmados e associar cada ocorrência a uma cidade canônica.
8. Produzir dry-run de alianças, pessoas, contatos, atribuições e relações.
9. Bloquear somente as entidades afetadas por pendências críticas; permitir que linhas independentes avancem como `PENDING_REVIEW` ou `ACTIVE`, conforme política confirmada.
10. Registrar decisões humanas em `ReconciliationDecision`.
11. Materializar com `upsert`, chaves únicas e uma transação por lote ou por unidade reiniciável.
12. Atualizar os contadores consolidados com resultados calculados, nunca com índices manuais.
13. Recalcular a Cobertura e expor a data/revisão da fonte e o número de pendências.

---

## 6. Decisões obrigatórias antes da aplicação operacional

Estas perguntas devem ser feitas ao gestor durante a implementação, quando o dry-run já trouxer números e exemplos concretos. Não pedir confirmação genérica antes de preparar o relatório.

- **DP-001:** manter, rejeitar ou reconciliar individualmente as 148 ocorrências dos quatro blocos de 37 linhas.
- **DP-002:** definir qual total é referência de gestão e como exibir 672/681 e 591/739.
- **DP-005:** confirmar cardinalidade de papéis e vínculos para a mesma pessoa, cidade e dobrador.
- **DP-006:** confirmar a propriedade de contatos nas linhas deslocadas e a política de exibição por RBAC.
- **DP-007:** confirmar grafias/identidades de dobradores e casos Paraty/Serfiotis/Barra do Piraí.
- **DP-015:** decidir se religião será descartada, mantida somente em evidência restrita ou modelada com base legal e permissão própria.
- **[suposição — validar com o gestor]** Pessoas novas e relações não ambíguas podem entrar como `PENDING_REVIEW` e aparecer na macro em uma contagem separada.
- **[suposição — validar com o gestor]** Igualdade de nome canônico + mesmo contato normalizado + mesma cidade + mesmo papel pode ser aprovada como regra automática para revisões futuras.
- **[suposição — validar com o gestor]** A relação de articulador/coordenador registrada em uma aba de dobrador significa `ARTICULATES_FOR`/`COORDINATES_FOR`, enquanto somente a liderança recebe `SUPPORTS`.
- **[suposição — validar com o gestor]** O valor heterogêneo da coluna `Região` permanece apenas como contexto bruto nesta entrega; o cadastro de bairros e áreas locais será um plano posterior.

---

## 7. Plano de implementação

### Task 1: Fixar o contrato da revisão lógica e as fixtures sintéticas

**Arquivos:**
- Modify: `apps/api/src/services/import.service.ts`
- Modify: `apps/api/src/services/import.service.test.ts`
- Create: `apps/api/src/services/workbook-fingerprint.ts`
- Create: `apps/api/src/services/workbook-fingerprint.test.ts`
- Create: `apps/api/src/services/__fixtures__/campaign-workbook.fixture.ts`

**Resultado:** o parser identifica a mesma revisão por conteúdo, mesmo quando o pacote XLSX muda.

- [ ] **Step 1: Escrever testes que gerem dois XLSX sintéticos semanticamente iguais e binariamente diferentes.** O primeiro teste deve falhar porque hoje só existe `fileHash`.
- [ ] **Step 2: Definir uma serialização estável.** Incluir ordem e nome das 80 abas, posição das células relevantes, categorias, índices e valores normalizados; excluir metadados voláteis do arquivo.
- [ ] **Step 3: Versionar o algoritmo.** Usar uma constante como `WORKBOOK_PARSER_VERSION = 'campaign-v2'` e incluir a versão no cálculo para permitir mudanças controladas.
- [ ] **Step 4: Testar que qualquer mudança de valor, aba, linha ou índice muda o `semanticHash`.** Mudanças apenas no empacotamento XLSX não podem mudar o hash.
- [ ] **Step 5: Manter `fileHash` no retorno de importação e adicionar `semanticHash` e `parserVersion`.** Não remover compatibilidade com lotes existentes.
- [ ] **Step 6: Executar `npm test -w @campanha/api -- src/services/workbook-fingerprint.test.ts src/services/import.service.test.ts`.**
- [ ] **Step 7: Commitar.** `git commit -m "feat: identificar revisoes semanticas da planilha"`.

### Task 2: Evoluir o schema para materialização idempotente

**Arquivos:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/20260910_import_materialization/migration.sql`
- Modify: `packages/database/prisma/seed.ts`
- Create: `apps/api/src/services/import-materialization-schema.contract.test.ts`

**Resultado:** o banco diferencia artefato, revisão lógica, controles manuais, estado de materialização e tipo de vínculo com dobrador.

- [ ] **Step 1: Criar um teste de contrato que exija `semanticHash`, `parserVersion`, `materializationStatus`, `ImportArtifact`, `ImportIndexControl`, `AllianceRelationType` e `relationKey`.**
- [ ] **Step 2: Adicionar enums, campos, relações e índices propostos na seção 4.** Nomear constraints para facilitar diagnóstico de conflito.
- [ ] **Step 3: Escrever uma migration aditiva.** Popular lotes antigos com `NOT_STARTED`, copiar cada `ImportBatch.fileHash` para `ImportArtifact` e manter leitura compatível durante a transição; não apagar nem recriar tabelas existentes.
- [ ] **Step 4: Adaptar o seed.** O lote diagnóstico pode permanecer, mas deve aceitar enriquecimento pela revisão semântica e nunca mascarar a ausência de ocorrências.
- [ ] **Step 5: Gerar o Prisma Client e validar a migration num banco limpo e num banco com o seed atual.** Rodar `npm run db:generate`, `npm run build -w @campanha/database` e os testes de contrato.
- [ ] **Step 6: Commitar.** `git commit -m "feat: preparar banco para materializacao da planilha"`.

### Task 3: Parsear índices e colunas com nomes de domínio

**Arquivos:**
- Create: `apps/api/src/services/campaign-workbook-parser.ts`
- Create: `apps/api/src/services/campaign-workbook-parser.test.ts`
- Modify: `apps/api/src/services/import.service.ts`
- Modify: `packages/types/src/index.ts`
- Modify: `packages/validation/src/index.ts`

**Interfaces principais:**

```ts
type ParsedTerritorialRow = {
  citySourceName: string
  articulator?: SourceField
  coordinator?: SourceField
  coordinatorContact?: SourceField
  leadership?: SourceField
  localAreaContext?: SourceField
  leadershipContact?: SourceField
  federalDeputy?: SourceField
  sensitiveReligion?: SourceField
}

type ParsedAllianceRow = {
  allianceSourceName: string
  city?: SourceField
  articulator?: SourceField
  coordinator?: SourceField
  coordinatorContact?: SourceField
  leadership?: SourceField
  localAreaContext?: SourceField
  leadershipContact?: SourceField
  sensitiveReligion?: SourceField
}
```

- [ ] **Step 1: Escrever fixtures sintéticas para índice geral, índice regional, aba territorial e aba de dobrador.** Cobrir vazio, fórmula, acento, espaços, linha deslocada e linha repetida.
- [ ] **Step 2: Separar classificação de aba, extração de índice e extração de ocorrência.** A lista de 17 dobradores deve ser um contrato testado e não um efeito implícito de nomes livres.
- [ ] **Step 3: Gravar em `normalizedValues` um objeto nomeado, além das células normalizadas.** Exemplo: `kind`, `cityKey`, `roles`, `contacts`, `allianceKey`, `localAreaRawPresent` e `sensitiveFieldsPresent`; não duplicar valores sensíveis desnecessariamente.
- [ ] **Step 4: Extrair `ImportIndexControl` do índice geral e dos oito índices regionais.** Registrar célula e texto da origem.
- [ ] **Step 5: Derivar macrorregião da cidade canônica.** Nunca usar diretamente a coluna interna `Região` como uma das oito regiões.
- [ ] **Step 6: Executar testes direcionados e `npm run typecheck`.**
- [ ] **Step 7: Commitar.** `git commit -m "feat: estruturar colunas e indices da campanha"`.

### Task 4: Detectar divergências por conteúdo e persistir todas as ocorrências

**Arquivos:**
- Modify: `apps/api/src/repositories/import.repository.ts`
- Modify: `apps/api/src/services/import.service.ts`
- Modify: `apps/api/src/services/import.service.test.ts`
- Create: `apps/api/src/services/import-issue-detector.ts`
- Create: `apps/api/src/services/import-issue-detector.test.ts`

**Resultado:** a exportação atual cria 1.420 ocorrências, controles e pendências, independentemente de seu hash binário.

- [ ] **Step 1: Escrever testes para buscar artefato por `fileHash`, lote por `semanticHash` e enriquecer um lote diagnóstico sem ocorrências.** Uma segunda importação deve retornar `idempotent: true`; outro binário equivalente deve criar somente `ImportArtifact`.
- [ ] **Step 2: Remover a dependência de `KNOWN_FILE_HASH` para criar pendências.** Detectar blocos duplicados, repetição exata, total divergente, campos deslocados, vazios e aliases pela estrutura da revisão.
- [ ] **Step 3: Persistir ocorrências e controles em transação.** Usar constraints e `createMany({ skipDuplicates: true })` somente para colisões já cobertas por chaves de domínio; não usar `skipDuplicates` para esconder conflitos inesperados.
- [ ] **Step 4: Criar issues específicas para 148 ocorrências de blocos, para o par Wellington e para cada controle divergente.** Relacionar a ocorrência quando aplicável.
- [ ] **Step 5: Sanitizar logs e respostas.** Não imprimir células, telefones ou religião; retornar apenas IDs, categorias e contadores.
- [ ] **Step 6: Confirmar por teste os invariantes 80 abas, 54 cidades, 17 dobradores, 681 territoriais, 739 de dobradores, 672 e 591 manuais.** O teste de integração real deve rodar localmente com arquivo ignorado pelo Git; CI usa fixture sintética.
- [ ] **Step 7: Commitar.** `git commit -m "feat: persistir evidencias e divergencias da planilha"`.

### Task 5: Criar dry-run e relatório de reconciliação

**Arquivos:**
- Create: `apps/api/src/services/import-materialization.service.ts`
- Create: `apps/api/src/services/import-materialization.service.test.ts`
- Create: `apps/api/src/repositories/import-materialization.repository.ts`
- Modify: `apps/api/src/controllers/import.controller.ts`
- Modify: `apps/api/src/routes/protected.routes.ts`
- Modify: `packages/types/src/index.ts`
- Modify: `packages/validation/src/index.ts`
- Modify: `apps/web/src/features/imports/imports-page.tsx`
- Modify: `apps/web/src/lib/types.ts`

**Rotas:**

- `POST /imports/:batchId/materialization/preview`
- `GET /imports/:batchId/materialization/preview`
- `POST /imports/:batchId/materialization/apply`

**Resultado:** antes de gravar entidades operacionais, o gestor vê o impacto real e as decisões bloqueadoras.

- [ ] **Step 1: Definir o contrato `MaterializationPreview`.** Incluir source rows, eligible rows, blocked rows, pessoas novas/reutilizadas/candidatas, contatos válidos/bloqueados, atribuições, alianças, relações, controles divergentes e issues por severidade.
- [ ] **Step 2: Implementar resolução de cidade e dobrador.** Cidades usam DP-021; dobradores com divergência de grafia entram como candidatos `PENDING_REVIEW` e preservam os dois nomes de origem.
- [ ] **Step 3: Implementar candidatos de pessoa explicáveis.** Cada candidato deve expor os critérios que coincidiram, sem devolver dados sensíveis além do permitido pelo RBAC.
- [ ] **Step 4: Classificar cada linha como `ELIGIBLE`, `PARTIAL`, `BLOCKED` ou `REJECTED_BY_DECISION`.** Uma linha parcial pode gerar papel sem contato; nunca inventar o campo ausente.
- [ ] **Step 5: Criar a tela de prévia mobile-first na seção Importações.** Mostrar cards de controle, tabela resumida, filtros por aba/cidade/dobrador/status e links para registrar decisões existentes.
- [ ] **Step 6: Exigir `imports:read` para a prévia e `imports:reconcile` para aplicar.** Retornar 409 quando há bloqueios obrigatórios não resolvidos.
- [ ] **Step 7: Apresentar o dry-run concreto ao gestor e registrar as respostas da seção 6.** Não chamar `/apply` antes desse gate.
- [ ] **Step 8: Commitar.** `git commit -m "feat: revisar materializacao antes da carga"`.

### Task 6: Materializar o cadastro único de forma transacional

**Arquivos:**
- Modify: `apps/api/src/services/import-materialization.service.ts`
- Modify: `apps/api/src/services/import-materialization.service.test.ts`
- Modify: `apps/api/src/repositories/import-materialization.repository.ts`
- Modify: `apps/api/src/repositories/audit.repository.ts`
- Modify: `apps/api/src/services/people.service.ts`

**Resultado:** os dados elegíveis passam a alimentar o modelo operacional sem duplicação e com proveniência por ocorrência.

- [ ] **Step 1: Escrever testes de idempotência.** Aplicar o mesmo lote duas vezes deve manter os mesmos IDs e contagens de pessoas, contatos, atribuições, alianças e relações.
- [ ] **Step 2: Materializar as 17 alianças.** Nomes não confirmados permanecem `PENDING_REVIEW`; `EntitySource` liga todas as grafias observadas à entidade provisória ou issue correspondente.
- [ ] **Step 3: Materializar pessoas.** Reutilizar somente vínculo anterior ou regra aprovada; criar novos registros como `PENDING_REVIEW` quando a política permitir.
- [ ] **Step 4: Materializar contatos.** Normalizar telefone sem perder `valueRaw`; não atribuir campo deslocado; impedir cópia do mesmo contato para pessoas diferentes sem issue/decisão.
- [ ] **Step 5: Materializar `PersonAssignment`.** A chave de domínio é pessoa + papel + cidade + período; várias ocorrências apontam para a mesma atribuição por `EntitySource`.
- [ ] **Step 6: Materializar `PersonAlliance`.** Usar `SUPPORTS` para liderança, `ARTICULATES_FOR` para articulador e `COORDINATES_FOR` para coordenador, desde que a decisão correspondente esteja confirmada.
- [ ] **Step 7: Atualizar `consolidatedPeople`, `consolidatedAssignments`, `consolidatedAlliances`, status e data.** Os contadores devem refletir entidades únicas materializadas pelo lote.
- [ ] **Step 8: Registrar `AuditLog` com lote, versão, contadores e autor.** Não incluir nomes, contatos ou religião no payload de auditoria.
- [ ] **Step 9: Testar rollback provocado no meio da transação.** Nenhuma entidade ou `EntitySource` parcial deve permanecer.
- [ ] **Step 10: Commitar.** `git commit -m "feat: materializar cadastro unico da campanha"`.

### Task 7: Integrar estado de carga à visão macro

**Arquivos:**
- Modify: `apps/api/src/repositories/coverage.repository.ts`
- Modify: `apps/api/src/repositories/coverage.repository.test.ts`
- Modify: `packages/types/src/index.ts`
- Modify: `apps/web/src/features/people/coverage-page.tsx`
- Modify: `apps/web/src/features/people/coverage-city-dialog.tsx`
- Modify: `apps/web/src/features/people/coverage-alliance-view.tsx`
- Modify: `apps/web/src/features/people/coverage-navigation.tsx`
- Modify: `apps/web/src/index.css`

**Resultado:** a macro visão exibe as pessoas e dobradores consolidados e deixa claro o que ainda está pendente.

- [ ] **Step 1: Estender os contratos sem mudar a métrica principal.** Adicionar `sourceRevision`, `lastMaterializedAt`, `pendingReviewCount` e, se aprovado, `confirmedCount`/`pendingCount`.
- [ ] **Step 2: Garantir que `articulatorCityRelations` conte a chave única pessoa + cidade.** Linhas repetidas e duas fontes para a mesma relação não podem inflar o indicador.
- [ ] **Step 3: Exibir as oito regiões e as 54 cidades mesmo quando uma cidade não possui linha elegível.** Estado vazio deve dizer “Sem informação consolidada”.
- [ ] **Step 4: Exibir dobradores e seus articuladores, coordenadores e lideranças agrupados por cidade.** O rótulo de cada relação deve respeitar `AllianceRelationType`.
- [ ] **Step 5: Sinalizar dados `PENDING_REVIEW` sem misturá-los ao total confirmado.** A visualização de contatos continua sujeita ao RBAC definido em DP-006/DP-009.
- [ ] **Step 6: Validar em 375 px, 768 px e desktop.** Testar acordeão, modal, foco de teclado, rolagem horizontal da tabela, estado vazio, erro e carregamento.
- [ ] **Step 7: Executar testes da API/web, `npm run typecheck` e `npm run build`.**
- [ ] **Step 8: Commitar.** `git commit -m "feat: preencher cobertura com dados materializados"`.

### Task 8: Ensaiar e executar a carga da aba aberta

**Arquivos:**
- Create: `apps/api/src/scripts/import-campaign-workbook.ts`
- Create: `apps/api/src/scripts/import-campaign-workbook.test.ts`
- Modify: `apps/api/package.json`
- Modify: `.gitignore`
- Create: `docs/runbook-carga-planilha.md`

**Resultado:** a revisão aberta é importada com procedimento reproduzível, backup e relatório de verificação.

- [ ] **Step 1: Criar CLI com `--file`, `--dry-run`, `--apply`, `--batch-id` e `--actor-user-id`.** `--apply` exige usuário válido e decisões necessárias registradas; não aceitar credencial em argumento ou log.
- [ ] **Step 2: Documentar backup e restauração do PostgreSQL antes da primeira aplicação.** O backup deve ficar fora do Git e ter verificação de integridade.
- [ ] **Step 3: Executar dry-run com a exportação da aba aberta.** Confirmar os invariantes da seção 1 e anexar ao lote apenas o resumo sem PII.
- [ ] **Step 4: Resolver com o gestor as decisões bloqueadoras usando o relatório concreto.** Registrar cada decisão na aplicação.
- [ ] **Step 5: Aplicar em ambiente local/staging.** Não executar em produção sem autorização específica e backup validado.
- [ ] **Step 6: Reexecutar a mesma revisão.** O resultado deve ser idempotente; nenhuma contagem operacional pode aumentar.
- [ ] **Step 7: Importar o binário local equivalente.** Deve apontar para o mesmo `semanticHash` e não criar nova materialização.
- [ ] **Step 8: Verificar SQL/Prisma sem exibir PII.** Conferir 1 lote lógico, 1.420 ocorrências, 17 alianças ou candidatas, 54 cidades, oito regiões, relações por papel e total de issues.
- [ ] **Step 9: Executar smoke HTTP autenticado.** Cobrir 200, 401, 403, 404, 409 e 422 nas rotas novas e existentes.
- [ ] **Step 10: Commitar script e runbook.** `git commit -m "docs: documentar carga da planilha da campanha"`.

### Task 9: Fechar documentação, progresso e revisão técnica

**Arquivos:**
- Modify: `docs/README.md`
- Modify: `docs/dados-e-prisma.md`
- Modify: `docs/importacao-e-conciliacao.md`
- Modify: `docs/api.md`
- Modify: `docs/decisoes-pendentes.md`
- Modify: `docs/PROGRESS.md`
- Modify: `README.md`

- [ ] **Step 1: Documentar modelo, fluxo, estados e contratos.** Incluir distinção entre ocorrência, entidade pendente e entidade confirmada.
- [ ] **Step 2: Atualizar decisões.** Marcar somente decisões realmente confirmadas pelo gestor e preservar as demais.
- [ ] **Step 3: Atualizar `PROGRESS.md`.** Registrar commits, migrations, contadores do lote, comandos de validação, decisões e próximo passo.
- [ ] **Step 4: Rodar validação completa.** `npm test`, `npm run typecheck`, `npm run build`, `docker compose build api web`, `docker compose up -d postgres api web`, `docker compose ps` e smoke tests.
- [ ] **Step 5: Revisar segurança e privacidade.** Confirmar que logs, testes, documentação e Git não contêm contatos nem religião.
- [ ] **Step 6: Solicitar code review com os agentes de arquitetura, banco, backend, frontend, migração, QA e documentação definidos em `agents/README.md`.** Corrigir achados antes do fechamento.
- [ ] **Step 7: Executar `git diff --check` e revisar `git status --short`.** Não incluir alterações anteriores do rebrand em commits desta carga.
- [ ] **Step 8: Commitar documentação final.** `git commit -m "docs: registrar carga da visao macro"`.

---

## 8. Critérios de aceite

### Fonte e idempotência

- [ ] A importação registra exatamente 80 abas, 54 territoriais, 17 de dobradores e nove índices.
- [ ] O lote contém exatamente 681 ocorrências territoriais e 739 de dobradores.
- [ ] Os índices manuais 672 e 591 permanecem gravados como controles de origem.
- [ ] A exportação aberta e o arquivo local conhecido produzem o mesmo `semanticHash` e uma única materialização lógica.
- [ ] Reexecutar o mesmo lote não cria ocorrências, pessoas, contatos, atribuições, alianças ou vínculos adicionais.

### Qualidade e reconciliação

- [ ] As 148 ocorrências dos quatro blocos e a repetição adicional de Wellington permanecem distinguíveis e ligadas a issues.
- [ ] As divergências regionais e das seis cidades listadas aparecem no relatório com índice, observado e diferença.
- [ ] DP-021 normaliza as cidades aprovadas sem apagar as grafias observadas.
- [ ] `Serfiotes`/`Serfiotis`, `Gutemberg`/`Gutembertg Reis` e casos deslocados permanecem pendentes até decisão explícita.
- [ ] Nenhuma pessoa é consolidada somente por coincidência de nome ou telefone.
- [ ] Contatos ambíguos ou deslocados não são atribuídos automaticamente.
- [ ] Religião não aparece em `Person`, respostas de Cobertura, logs, testes ou documentação.

### Modelo operacional

- [ ] As 17 abas de dobradores produzem alianças ativas ou provisórias, cada uma com origem rastreável.
- [ ] Pessoas, contatos, atribuições e relações possuem `EntitySource` até a linha da planilha.
- [ ] Uma pessoa repetida em abas distintas pode apontar para o mesmo `Person` depois de regra/decisão aprovada.
- [ ] Uma atribuição pessoa–papel–cidade aparece uma única vez na visão operacional, ainda que possua várias ocorrências de origem.
- [ ] Lideranças, articuladores e coordenadores têm tipos de relação com dobrador semanticamente distintos.
- [ ] Uma falha de aplicação reverte a unidade transacional completa.

### Visão macro

- [ ] Cobertura exibe Estado → oito regiões → 54 cidades.
- [ ] O indicador principal permanece “relações articulador–cidade”.
- [ ] O modal da cidade lista articuladores, coordenadores, lideranças, contatos permitidos e dobradores.
- [ ] A visão do dobrador agrupa cidades, articuladores, coordenadores e lideranças.
- [ ] Dados confirmados e pendentes possuem contagens e aparência distintas, se essa suposição for aprovada.
- [ ] A interface funciona em 375 px, tablet e desktop e mantém navegação por teclado.

### Operação e segurança

- [ ] Rotas de importação e aplicação respeitam RBAC e cobrem 401/403/404/409/422.
- [ ] A aplicação grava `AuditLog` sem PII.
- [ ] Existe runbook de dry-run, backup, aplicação, verificação, reexecução e recuperação.
- [ ] `npm test`, `npm run typecheck`, `npm run build` e os builds Docker terminam com sucesso.
- [ ] `docs/PROGRESS.md` registra o estado real somente após a execução concluída.

---

## 9. Riscos e mitigações

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Hash binário diferente para o mesmo conteúdo | Lotes e pessoas duplicados | `semanticHash` versionado + constraint única + teste com dois XLSX equivalentes |
| Remoção indevida dos 148 registros | Perda de informação política | Preservar ocorrências; bloquear materialização afetada até DP-001 |
| Índice manual usado como verdade automática | Totais incorretos ou linhas ignoradas | `ImportIndexControl` mantém índice e observado lado a lado |
| Nome igual representar pessoas diferentes | Fusão indevida de cadastros | Candidate matching explicável; decisão ou regra aprovada antes do merge |
| Grafias diferentes representarem a mesma pessoa/dobrador | Fragmentação da macro visão | Alias/provisório + fila de reconciliação + `EntitySource` |
| Contato deslocado ser atribuído à pessoa errada | Exposição e operação incorreta | Bloquear linha/campo, exigir DP-006 e testar casos deslocados |
| Coluna `Região` virar macrorregião incorreta | Hierarquia geográfica corrompida | Derivar região de `CITY.parentId`; preservar coluna apenas como contexto bruto |
| Religião aparecer em telas ou logs | Exposição de dado sensível | Campo restrito na ocorrência, exclusão explícita dos DTOs e testes de contrato |
| Aplicação parcial | Banco inconsistente | Transação, status do lote, idempotência e teste de rollback |
| Reimportação alterar contadores | Visão macro inflada | Chaves de domínio, `upsert`, `EntitySource` e teste de segunda execução |
| Payload de Cobertura crescer demais | Lentidão no celular | Árvore resumida, detalhe sob demanda, paginação/filtro no servidor quando necessário |
| Mudanças anteriores entrarem no commit | Histórico difícil de revisar | Stage explícito por task e verificação final do diff |

---

## 10. Estratégia de rollback

- Fazer backup verificado antes da primeira aplicação fora do banco descartável de testes.
- Nunca apagar `SourceOccurrence`, `ImportIssue` ou `ReconciliationDecision` para desfazer uma materialização.
- Marcar o lote como `FAILED` quando a transação falhar e manter `materializationError` sanitizado.
- Para reversão lógica, localizar entidades por `EntitySource`; desativar apenas registros criados exclusivamente pelo lote e preservar entidades compartilhadas com outros lotes.
- Registrar toda reversão em `AuditLog` e atualizar os contadores consolidados.
- Restaurar backup apenas quando a reversão lógica não for suficiente; validar healthcheck, migrations e contagens depois da restauração.

---

## 11. Handoff por agente especializado

| Agente de `agents/README.md` | Responsabilidade neste plano |
| --- | --- |
| Product Manager | Preparar e registrar as decisões da seção 6 com o gestor |
| Arquiteto de Software | Validar ETL em duas fases, fronteiras e idempotência semântica |
| Engenheiro de Banco de Dados | Schema, migration aditiva, constraints, transações, backup e rollback |
| Engenheiro de Migração de Dados | Parser, controles, detecção de issues, dry-run e reconciliação |
| Engenheiro Backend | Serviços, repositórios, rotas, RBAC, auditoria e contratos |
| Engenheiro Frontend | Prévia de carga e estados confirmados/pendentes na Cobertura |
| QA | Fixtures sintéticas, idempotência, rollback, contratos HTTP e smoke tests |
| Redator Técnico | Runbook, API, decisões e atualização do `PROGRESS.md` |

O próximo passo após a aprovação deste plano é executar a Task 1 e preparar o dry-run. A primeira decisão do gestor só deve ser solicitada quando o relatório da Task 5 mostrar exatamente quais registros e contagens cada opção afetará.
