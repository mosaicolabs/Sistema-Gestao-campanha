# Filtros, ordenações e reorganização da tela de cobertura Implementation Plan

> **Status do plano (10/09/2026):** Implementado e validado localmente. A execução usou `superpowers:executing-plans` tarefa por tarefa. TDD foi explicitamente dispensado pelo gestor; a validação foi feita com typecheck, build Docker, smoke HTTP e revisão manual da tela em execução.

**Goal:** Transformar a tela de Cobertura em uma visão macro orientada a consulta, com filtros e ordenações claros, uma tabela estruturada e uma hierarquia visual com menos ruído, removendo os três cards agregados usados apenas como orientação técnica do desenvolvimento.

**Architecture:** A API continuará protegida pela permissão `coverage:read` e ampliará a consulta existente `GET /coverage/macro` com filtros e ordenação validados por Zod. A resposta continuará representando uma linha por cidade canônica, preservando todos os campos já exibidos e acrescentando contagens de coordenadores, lideranças e IDs de dobradas para permitir filtros sem duplicar consultas. O frontend guardará os filtros na URL, usará TanStack Table para a tabela principal e manterá o modal de cidade e a navegação por regiões/dobradores como fluxos de detalhe.

**Tech Stack:** React 19, Vite, TypeScript, TanStack Query, TanStack Table, Radix/shadcn/ui, Phosphor Icons, Axios, Node.js, Express, Zod e Prisma.

**Spec:** `docs/README.md`, `docs/frontend.md`, `docs/api.md`, `docs/fluxos-operacionais.md`, `docs/visao-geral.md`, `agents/README.md`, `agents/03-ux-ui-designer.md`, `agents/04-frontend-engineer.md`, `PRD_sistema_gestao_campanha.md` e a implementação atual em `apps/web/src/features/people/`.

## Global Constraints

- A experiência deve começar em telas pequenas e continuar funcional em desktop, conforme `docs/frontend.md`.
- A tela deve manter a amostragem operacional já disponível por cidade: cidade, região, relações articulador–cidade, articuladores únicos, atribuições, dobradas, variações observadas e aliases pendentes.
- Os três cards agregados `Cidades na seleção`, `Relações articulador–cidade` e `Aliases em revisão` devem ser removidos da tela principal; seus textos e valores não podem continuar como cards de KPI.
- A remoção dos cards agregados não autoriza remover os valores por cidade necessários para consulta, ordenação, filtro ou auditoria.
- A tela deve continuar abrindo o detalhe de cidade com articuladores, coordenadores, lideranças, contatos e dobradas apoiadas.
- A navegação da sidebar por regiões, cidades e dobradores deve continuar funcionando.
- A visão por dobrador deve conservar todas as pessoas e papéis atuais, mas pode trocar cards por tabela agrupada para reduzir a poluição visual.
- Nenhuma alteração deve criar uma fusão de pessoas, localidades, alianças, aliases ou ocorrências da planilha.
- Nenhuma decisão pendente de `docs/decisoes-pendentes.md` pode ser transformada em regra de negócio silenciosa.
- A rota permanece protegida por `authenticate`, `requirePasswordChanged` e `requirePermission('coverage', 'read')`.
- Nenhuma migration Prisma é necessária; os filtros devem usar o modelo operacional existente.
- Não adicionar biblioteca nova para tabela, filtro, estado ou animação; reutilizar TanStack Table, TanStack Query, shadcn/ui, Radix e os tokens existentes.
- Os nomes de filtro destinados ao operador devem descrever o dado da campanha, e não nomes de campos internos.
- TDD está dispensado nesta execução conforme orientação explícita do gestor. A validação ocorrerá após a implementação.

## Fonte, fatos e hipóteses

### Comportamento confirmado no código

- `GET /coverage/macro` hoje aceita apenas `regionId` e retorna uma linha por cidade em ordem alfabética.
- Cada linha já possui `city`, `region`, `uniqueArticulators`, `articulatorCityRelations`, `uniqueAssignments`, `uniqueAlliances`, `observedVariants` e `pendingAliasCount`.
- A tela atual exibe esses dados em cards de cidade, abre `CoverageCityDialog` e mostra uma visão separada em `CoverageAllianceView`.
- A sidebar já possui acordeão de regiões/cidades e de dobradores usando `GET /coverage/tree` e `/references`.
- TanStack Table já está instalado e usado em `apps/web/src/features/people/people-page.tsx`.

### Requisitos explícitos deste pedido

- Adicionar filtros à tela de Cobertura.
- Adicionar ordenações à tela de Cobertura.
- Substituir a composição visual com muitos cards por uma tabela estruturada, usando cards somente onde ainda ajudarem a leitura.
- Manter a amostragem de dados apresentada hoje.
- Remover os três cards agregados citados no pedido.
- Usar a documentação do projeto e os agentes especializados como fonte de trabalho.
- Executar sem TDD.

### Suposições que devem permanecer identificadas

- **[suposição — validar com o gestor]** Os filtros de primeira versão serão: busca por cidade/região, região, papel com atuação informada, dobrador e estado de alias. Esses filtros foram escolhidos porque correspondem aos campos que a API já conhece ou consegue derivar sem alterar o modelo.
- **[suposição — validar com o gestor]** A ordenação padrão continuará sendo cidade de A a Z para preservar a leitura territorial atual.
- **[suposição — validar com o gestor]** Os filtros e a ordenação serão persistidos na query string para permitir recarregar ou compartilhar uma visão sem perder o contexto.
- **[suposição — validar com o gestor]** A primeira versão não terá paginação: a base atual contém 54 cidades e a visão macro deve continuar mostrando todas as linhas que correspondem aos filtros; o scroll ficará dentro da tabela quando necessário.
- **[suposição — validar com o gestor]** O filtro de papel será de presença na cidade, com as opções `Articulador`, `Coordenador` e `Liderança`, sem afirmar que uma pessoa exerce apenas um papel.

## Direção de UX/UI

### Hierarquia da página principal

1. Cabeçalho curto com `Visão macro por cidade` e uma frase que explique a ação principal.
2. Barra de consulta com busca, botão de filtros, seletor de ordenação e ação `Limpar filtros` quando houver estado ativo.
3. Linha discreta de contexto com a quantidade de resultados da tabela, sem transformar esse número em card.
4. Uma única tabela de cobertura ocupando a área principal.
5. Modal existente de cidade como detalhe sob demanda.

Os três cards técnicos não serão substituídos por outros KPIs. A tabela será a fonte de leitura principal; números por cidade continuam visíveis nas colunas correspondentes.

### Filtros da barra

No desktop, busca e ordenação ficam visíveis; os demais filtros podem ficar em uma área expansível para evitar uma fileira de controles comprimidos. No mobile, o botão `Filtros` abre um `Sheet` acessível com os mesmos campos e mostra a quantidade de filtros ativos.

| Rótulo do operador | Campo | Comportamento |
| --- | --- | --- |
| Buscar cidade ou região | `search` | Busca textual por nome da cidade, nome da região e chave canônica; ignora espaços nas extremidades. |
| Região | `regionId` | Todas as regiões ou uma região ativa do estado do Rio de Janeiro. |
| Papel com atuação | `role` | Todos, Articulador, Coordenador ou Liderança; uma cidade entra quando tem pelo menos uma atribuição ativa desse papel. |
| Dobrador | `allianceId` | Todos ou um dobrador existente em `ReferenceData.alliances`; considera apenas vínculos não inativos. |
| Situação dos aliases | `aliasStatus` | Todas, Com alias em revisão ou Sem alias em revisão. |

O botão `Limpar filtros` retorna os valores a `Todos`, esvazia a busca e mantém apenas a ordenação padrão. O estado de filtro não deve ser salvo no `localStorage` nem em Zustand, pois a URL já é a fonte adequada para uma consulta compartilhável.

### Ordenação

O seletor e os cabeçalhos da tabela devem oferecer as mesmas chaves. O cabeçalho ativo deve expor `aria-sort` e direção visual por ícone, sem depender somente de cor.

| Chave | Rótulo | Ordem padrão ao selecionar |
| --- | --- | --- |
| `city` | Cidade | A → Z |
| `region` | Região | A → Z |
| `articulatorCityRelations` | Relações articulador–cidade | Maior → menor |
| `uniqueArticulators` | Articuladores únicos | Maior → menor |
| `uniqueCoordinators` | Coordenadores | Maior → menor |
| `uniqueLeaderships` | Lideranças | Maior → menor |
| `uniqueAssignments` | Atribuições | Maior → menor |
| `uniqueAlliances` | Dobradas | Maior → menor |
| `pendingAliasCount` | Aliases em revisão | Maior → menor |

Um segundo clique no mesmo cabeçalho inverte a direção. Empates usam cidade canônica em ordem crescente para que a lista não salte entre consultas.

### Tabela principal

As colunas da tabela serão:

| Coluna | Conteúdo | Ação ou estado |
| --- | --- | --- |
| Cidade | Nome canônico e região em texto secundário | Clique na linha ou em `Ver pessoas` abre `CoverageCityDialog`. |
| Relações A–C | `articulatorCityRelations` | Métrica principal já confirmada para a cobertura. |
| Articuladores | `uniqueArticulators` | Quantidade única no cadastro. |
| Coordenadores | `uniqueCoordinators` | Quantidade única no cadastro. |
| Lideranças | `uniqueLeaderships` | Quantidade única no cadastro. |
| Atribuições | `uniqueAssignments` | Total de vínculos ativos da cidade. |
| Dobradas | `uniqueAlliances` | Total de dobradas ativas relacionadas. |
| Variações observadas | `observedVariants` | Todas as grafias disponíveis, com quebra de linha e estado vazio explícito. |
| Aliases em revisão | `pendingAliasCount` | Número e badge de revisão quando maior que zero. |
| Ação | `Ver pessoas` | Mantém o caminho atual para o modal. |

No desktop, a primeira coluna fica fixa durante o scroll horizontal. No mobile, a tabela continua semântica: cada cidade mostra uma primeira linha compacta e um controle `Mostrar dados` expande os demais campos com rótulos explícitos. Não ocultar dados por depender de hover. A expansão deve manter os mesmos valores e a mesma ação do desktop.

### Visão por dobrador

`CoverageAllianceView` deixa de renderizar um card por cidade. A visão passa a usar uma tabela agrupada por região e cidade:

- Região e cidade como primeiras colunas.
- Articuladores, coordenadores e lideranças em células com nomes quebráveis e estado `Sem informação` quando a origem não informou o papel.
- Total de atribuições e ação para abrir a cidade quando houver `localityId`.
- Ordenação alfabética por região e cidade como padrão.
- No mobile, cada linha pode expandir os nomes dos papéis; nenhum nome é descartado.

O botão `Voltar para regiões`, o título do dobrador e os estados de carregamento, erro e vazio continuam existentes. A tabela de dobrador não cria novos KPIs.

## Contrato de dados proposto

### Query Zod

Atualizar `coverageMacroQuerySchema` sem remover `regionId`:

```ts
export const coverageMacroQuerySchema = z.object({
  regionId: entityId.optional(),
  search: z.string().trim().max(120).optional(),
  role: z.enum(['ARTICULATOR', 'COORDINATOR', 'LEADERSHIP']).optional(),
  allianceId: entityId.optional(),
  aliasStatus: z.enum(['ALL', 'PENDING', 'CLEAR']).default('ALL'),
  sortBy: z.enum([
    'city',
    'region',
    'articulatorCityRelations',
    'uniqueArticulators',
    'uniqueCoordinators',
    'uniqueLeaderships',
    'uniqueAssignments',
    'uniqueAlliances',
    'pendingAliasCount',
  ]).default('city'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
})
```

O frontend deve omitir valores equivalentes a `all` para manter a URL curta. O backend recebe somente valores já validados pelo middleware.

### Linha de resposta

Ampliar `MacroCoverageRow` preservando os campos atuais:

```ts
export type MacroCoverageRow = {
  id: string
  city: string
  canonicalKey: string
  region: string
  uniqueArticulators: number
  articulatorCityRelations: number
  uniqueCoordinators: number
  uniqueLeaderships: number
  uniqueAssignments: number
  uniqueAlliances: number
  observedVariants: string[]
  pendingAliasCount: number
}
```

O filtro por `allianceId` usa a relação existente em `Locality.alliances`; o ID não precisa ser exposto na tabela. O filtro por papel usa atribuições ativas. Pessoas com mais de um papel continuam contando uma vez por papel e continuam aparecendo no modal conforme cada atribuição existente.

### Consulta e ordenação no repository

Trocar `coverageRepository.listMacro(regionId?: string)` por `coverageRepository.listMacro(filters: CoverageMacroFilters)` e manter o controller sem consulta direta ao Prisma. A implementação deve:

1. Buscar cidades ativas, região, aliases, atribuições ativas e alianças ativas.
2. Derivar conjuntos únicos por pessoa para articuladores, coordenadores e lideranças.
3. Aplicar busca, papel, dobrador e estado de alias sobre os dados derivados.
4. Ordenar por uma chave permitida e aplicar cidade canônica como desempate.
5. Retornar todas as linhas correspondentes, sem substituir contagens por estimativas.

O `operationsController.coverageMacro` deve repassar o objeto validado de `request.query` ao repository. O contrato HTTP continua sendo `200` com array de linhas, `401` sem sessão, `403` sem `coverage:read` e `422` para query inválida.

## Tarefas de implementação

### Task 1: Consolidar o contrato de filtros e ordenações

**Arquivos:**

- Modificar: `Sistema-Gestao-Campanha/packages/validation/src/index.ts`
- Modificar: `Sistema-Gestao-Campanha/packages/types/src/index.ts`
- Modificar: `Sistema-Gestao-Campanha/apps/api/src/controllers/operations.controller.ts`
- Modificar: `Sistema-Gestao-Campanha/apps/api/src/repositories/coverage.repository.ts`
- Modificar: `Sistema-Gestao-Campanha/apps/api/src/repositories/coverage.repository.test.ts`
- Modificar: `Sistema-Gestao-Campanha/apps/api/src/repositories/coverage-macro.contract.test.ts`

**Interfaces:**

- Consome: `coverageMacroQuerySchema`, `Locality` ativa, atribuições, aliases e alianças já persistidas.
- Produz: `CoverageMacroFilters`, query validada e `MacroCoverageRow` com `uniqueCoordinators` e `uniqueLeaderships`.

- [ ] Atualizar o schema Zod com os campos da seção “Query Zod”, mantendo `regionId` opcional e defaults determinísticos.
- [ ] Exportar o tipo inferido `CoverageMacroFilters` para o controller/repository.
- [ ] Atualizar `MacroCoverageRow` e fixtures existentes com as duas novas contagens.
- [ ] Alterar `listMacro` para receber o objeto de filtros, calcular conjuntos únicos e aplicar as regras da seção “Consulta e ordenação no repository”.
- [ ] Garantir que `aliasStatus=CLEAR` exclua cidades com qualquer alias pendente e que `aliasStatus=PENDING` mantenha somente cidades com pendência.
- [ ] Garantir que o filtro de papel considere apenas atribuições não inativas e não altere a contagem de outras colunas.
- [ ] Garantir que a ordenação possua desempate estável por `city` e que valores numéricos respeitem `asc`/`desc`.
- [ ] Repassar o objeto validado no controller sem converter query em string solta.
- [ ] Atualizar os testes de contrato existentes depois da implementação para verificar as novas contagens, filtros e ordenações, sem iniciar o fluxo TDD.

**Validação da tarefa:**

```bash
npm run typecheck -w @campanha/validation
npm run typecheck -w @campanha/api
```

### Task 2: Criar a barra de filtros e o estado persistido na URL

**Arquivos:**

- Criar: `Sistema-Gestao-Campanha/apps/web/src/features/people/coverage-filters.tsx`
- Modificar: `Sistema-Gestao-Campanha/apps/web/src/features/people/coverage-page.tsx`
- Modificar: `Sistema-Gestao-Campanha/apps/web/src/lib/types.ts`
- Consultar: `Sistema-Gestao-Campanha/apps/web/src/components/ui/input.tsx`, `select.tsx`, `sheet.tsx`, `button.tsx` e `badge.tsx`

**Interfaces:**

- Consome: `ReferenceData.localities`, `ReferenceData.alliances`, `useSearchParams` e `coverageMacroQuerySchema`.
- Produz: `CoverageFilters` e handlers `onChange`, `onClear` e `onSortChange` usados pela página.

- [ ] Definir em `coverage-filters.tsx` os tipos de estado para busca, região, papel, dobrador, alias, ordenação e direção.
- [ ] Ler os valores atuais da URL ao montar a página e normalizar ausência de parâmetro para `all`/defaults.
- [ ] Renderizar busca, ordenação visível, botão `Filtros` e botão `Limpar filtros` somente quando houver estado diferente do padrão.
- [ ] Renderizar no `Sheet` mobile os cinco filtros da tabela, com labels associados, opção `Todos` e foco devolvido ao botão após fechar.
- [ ] Usar `ReferenceData` para regiões e dobradores; não criar listas duplicadas em código.
- [ ] Atualizar a URL em uma operação única por mudança, preservando `cityId` ou `allianceId` somente quando o usuário estiver em um detalhe compatível.
- [ ] Incluir uma indicação textual compacta do número de resultados, sem usar card, ícone como único significado ou KPI agregado.
- [ ] Fazer a query do TanStack Query depender do objeto normalizado de filtros, com `placeholderData` para evitar piscar a tabela durante uma mudança de ordenação.
- [ ] Mostrar estado vazio com ação direta `Limpar filtros` quando a combinação não encontrar cidades.

**Validação da tarefa:**

```bash
npm run typecheck -w @campanha/web
```

### Task 3: Substituir os cards de cidade por uma tabela responsiva

**Arquivos:**

- Criar: `Sistema-Gestao-Campanha/apps/web/src/features/people/coverage-table.tsx`
- Modificar: `Sistema-Gestao-Campanha/apps/web/src/features/people/coverage-page.tsx`
- Modificar: `Sistema-Gestao-Campanha/apps/web/src/index.css`
- Reutilizar: `apps/web/src/components/ui/table.tsx`, `badge.tsx` e `button.tsx`

**Interfaces:**

- Consome: `MacroCoverageRow[]`, `CoverageFilters`, `setSearchParams` e callback `onOpenCity(cityId)`.
- Produz: tabela desktop e mobile com colunas, ordenação acessível, expansão de linha e ação de detalhe.

- [ ] Criar colunas TanStack Table para todos os campos listados na seção “Tabela principal”; não eliminar `observedVariants` nem `pendingAliasCount`.
- [ ] Implementar `getCoreRowModel`, estado de sorting controlado e callback que altera `sortBy`/`sortDirection` na URL.
- [ ] Definir `aria-sort` em cada coluna ordenável e rótulos de botão que anunciem a próxima direção.
- [ ] Renderizar cidade e região na primeira coluna, com a cidade fixa durante o scroll horizontal em desktop.
- [ ] Renderizar as variações observadas com quebra de linha; quando não houver valor, mostrar `Nenhuma variação registrada`.
- [ ] Renderizar aliases pendentes como badge com texto e número, sem depender de amarelo/vermelho para transmitir o estado.
- [ ] Implementar no mobile uma linha compacta com controle `Mostrar dados` que expande os campos restantes em pares rótulo/valor dentro da própria tabela.
- [ ] Manter `Ver pessoas` como ação explícita e também permitir abrir a linha por teclado, sem ativação acidental ao selecionar texto.
- [ ] Remover de `coverage-page.tsx` os imports e o bloco `coverage-summary` dos três cards `Cidades na seleção`, `Relações articulador–cidade` e `Aliases em revisão`.
- [ ] Remover ou substituir os estilos `.coverage-summary` e `.coverage-row` que só existem para os cards antigos; não alterar tokens globais de forma incompatível.
- [ ] Preservar loading, erro, vazio e retry existentes, usando `LoadingState`, `ErrorState` e `EmptyState`.

**Validação da tarefa:**

```bash
npm run build -w @campanha/web
```

### Task 4: Reorganizar a visão por dobrador sem perder a amostragem

**Arquivos:**

- Criar: `Sistema-Gestao-Campanha/apps/web/src/features/people/coverage-alliance-table.tsx`
- Modificar: `Sistema-Gestao-Campanha/apps/web/src/features/people/coverage-alliance-view.tsx`
- Modificar: `Sistema-Gestao-Campanha/apps/web/src/index.css`

**Interfaces:**

- Consome: `CoverageAllianceDetail.rows` com região, cidade e `CoveragePersonRow[]`.
- Produz: tabela agrupada por região/cidade com os nomes completos por papel e ação de retorno/detalhe.

- [ ] Criar a transformação de `CoverageAllianceDetail.rows` para colunas de articuladores, coordenadores, lideranças e total de atribuições.
- [ ] Manter todas as pessoas retornadas pelo endpoint, mesmo quando o mesmo nome tiver mais de uma atribuição.
- [ ] Exibir `Sem informação` apenas quando o array correspondente estiver vazio, preservando a distinção entre ausência de dado e ausência confirmada.
- [ ] Trocar `coverage-alliance-grid`/`coverage-alliance-card` por uma tabela com agrupamento visual por região e cidade.
- [ ] Usar expansão de linha no mobile para mostrar os nomes dos três papéis sem cortar conteúdo.
- [ ] Manter `ArrowLeft`, o título do dobrador, os estados de carregamento/erro/vazio e a navegação de volta.
- [ ] Remover sombras, bordas e espaçamentos exclusivos dos cards antigos após confirmar que nenhuma outra tela usa as classes.

**Validação da tarefa:**

```bash
npm run typecheck -w @campanha/web
```

### Task 5: Ajustar o detalhe da cidade e a acessibilidade da composição

**Arquivos:**

- Modificar: `Sistema-Gestao-Campanha/apps/web/src/features/people/coverage-city-dialog.tsx`
- Modificar: `Sistema-Gestao-Campanha/apps/web/src/index.css`
- Consultar: `Sistema-Gestao-Campanha/apps/web/src/components/ui/dialog.tsx`, `table.tsx`, `page-state.tsx`

**Interfaces:**

- Consome: `CoverageCityDetail` já retornado por `GET /coverage/cities/:cityId/detail`.
- Produz: detalhe consistente com a tabela, sem perder contatos, papéis, dobradas ou variações.

- [ ] Transformar o resumo visual de três blocos do modal em uma linha de metadados compacta ou `dl`, preservando os valores de articuladores, coordenadores e lideranças.
- [ ] Manter as colunas `Papel`, `Pessoa`, `Contatos` e `Dobradas apoiadas` da tabela do modal.
- [ ] Manter os estados `Sem contato informado`, `Sem dobrada informada` e `Variações observadas` com texto explícito.
- [ ] Verificar que o `DialogContent` tenha rolagem interna em telas pequenas e que o foco retorne ao acionador ao fechar.
- [ ] Garantir que todos os botões, cabeçalhos ordenáveis, expansão mobile e badges tenham nome acessível e foco visível.
- [ ] Respeitar `prefers-reduced-motion`; não adicionar animação nova para filtros ou tabela.

**Validação da tarefa:**

```bash
npm run build -w @campanha/web
```

### Task 6: Atualizar documentação, smoke checks e progresso

**Arquivos:**

- Modificar: `Sistema-Gestao-Campanha/docs/api.md`
- Modificar: `Sistema-Gestao-Campanha/docs/frontend.md`
- Modificar: `Sistema-Gestao-Campanha/docs/fluxos-operacionais.md`
- Modificar: `Sistema-Gestao-Campanha/docs/PROGRESS.MD`
- Modificar: `Sistema-Gestao-Campanha/plans/plan-005-filtros-ordenacoes-cobertura.md`

**Interfaces:**

- Consome: contrato final implementado da API e evidências de build/smoke.
- Produz: documentação de consulta, fluxo operacional, progresso e handoff para o próximo agente.

- [ ] Documentar todos os query params de `/coverage/macro`, defaults, valores permitidos e erro `422`.
- [ ] Documentar `uniqueCoordinators` e `uniqueLeaderships` como campos derivados da linha, sem alterar a métrica principal articulador–cidade.
- [ ] Atualizar o fluxo de Cobertura para descrever busca, filtros, ordenação, tabela e detalhe por cidade/dobrador.
- [ ] Registrar explicitamente que os três cards agregados foram removidos por serem indicadores técnicos de implementação.
- [ ] Registrar no `PROGRESS.MD` o commit, as telas afetadas, as validações e qualquer hipótese ainda aguardando validação do gestor.
- [ ] Executar `git diff --check` apenas nos arquivos da tarefa e revisar se não houve alteração acidental em dados ou `.env`.

**Validação final sem TDD:**

```bash
cd Sistema-Gestao-Campanha
npm run typecheck
npm run build
docker compose config --quiet
docker compose build api web
docker compose up -d postgres api web
docker compose ps
```

Com a sessão autenticada, verificar manualmente:

```text
GET /api/coverage/macro                         -> 200, lista sem filtros
GET /api/coverage/macro?regionId=<id>           -> 200, somente uma região
GET /api/coverage/macro?role=COORDINATOR        -> 200, cidades com coordenador ativo
GET /api/coverage/macro?aliasStatus=PENDING     -> 200, somente pendências
GET /api/coverage/macro?sortBy=uniqueAlliances&sortDirection=desc -> 200, maior para menor
GET /api/coverage/macro?sortBy=campo-invalido   -> 422
GET /api/coverage/macro sem JWT                 -> 401
```

No navegador, verificar em larguras aproximadas de 390px e 1440px:

- Os três textos dos cards removidos não aparecem na tela principal.
- A tabela mostra todas as colunas em desktop e todos os campos por expansão em mobile.
- Busca, região, papel, dobrador e aliases alteram os resultados e permanecem na URL.
- A ordenação por texto e números inverte a direção no segundo clique e mantém desempate estável.
- A ação `Ver pessoas` abre e fecha o modal sem perder filtros.
- A sidebar continua abrindo regiões, cidades e dobradores.
- A visão por dobrador exibe tabela, nomes, papéis e estados vazios sem cards repetidos.
- Loading, vazio, erro, retry, foco de teclado e rolagem interna funcionam.

## Critérios de aceite

1. A tela principal de Cobertura não renderiza os cards `Cidades na seleção`, `Relações articulador–cidade` ou `Aliases em revisão`.
2. A lista principal é uma tabela estruturada, com uma linha por cidade canônica retornada pela API.
3. A tabela preserva cidade, região, relações articulador–cidade, articuladores únicos, atribuições, dobradas, variações observadas e aliases pendentes.
4. A tabela também apresenta coordenadores e lideranças únicos para viabilizar filtro e leitura macro.
5. A busca encontra uma cidade pela cidade, região ou chave canônica sem alterar os valores de origem.
6. O filtro de região retorna somente cidades filhas da região selecionada.
7. O filtro de papel retorna cidades com pelo menos uma atribuição ativa do papel escolhido.
8. O filtro de dobrador retorna somente cidades ligadas ao dobrador escolhido.
9. Os filtros de alias distinguem cidades com e sem pendência de revisão.
10. Cada coluna numérica e textual definida no plano pode ser ordenada, com direção anunciada por acessibilidade e desempate estável.
11. A URL permite recarregar a mesma consulta sem perder filtros e ordenação.
12. O modal de cidade continua mostrando papel, pessoa, contatos, dobradas apoiadas e variações observadas.
13. A visão por dobrador mantém todas as cidades e pessoas atuais em tabela agrupada, com articuladores, coordenadores, lideranças e atribuições.
14. A interface funciona em mobile sem depender de hover e sem esconder dados essenciais; a tabela usa expansão ou rolagem interna controlada.
15. Rotas sem JWT retornam `401`, consultas inválidas retornam `422` e a permissão `coverage:read` continua aplicada.
16. Não há migration, alteração de RBAC, alteração da regra de aliases, fusão de pessoas ou alteração das contagens da planilha.
17. Typecheck, build, configuração Docker, serviços Docker e smoke checks descritos no plano passam.

## Riscos e mitigações

| Risco | Mitigação |
| --- | --- |
| Muitos filtros comprimem a tela mobile | Mostrar busca/ordenação na barra e colocar os filtros restantes em `Sheet` com contador de ativos. |
| Ordenar no frontend diverge da API | Manter chaves e defaults no schema Zod compartilhado e fazer a API devolver a lista já filtrada/ordenada. |
| Variações observadas ocupam espaço excessivo | Usar quebra de linha controlada e estado vazio explícito; nunca apagar o valor, truncar sem acesso ou esconder em hover. |
| Tabela larga dificulta leitura no celular | Usar primeira coluna fixa quando possível e expansão semântica de linha com rótulos completos no mobile. |
| Usuário confunde alias pendente com ausência de cobertura | Usar texto `Alias em revisão` e descrição contextual; não comunicar o estado apenas por cor. |
| Refatoração de cards remove ação existente | Preservar `Ver pessoas`, os query params `cityId`/`allianceId` e validar cada fluxo no smoke manual. |
| Filtro de dobrador apresenta resultado inesperado por vínculo sem localidade | Filtrar somente pelas relações ativas da cidade e manter a regra documentada de não inferir localidade ausente. |
| O pedido de filtros evolui para dashboard com KPIs | Manter esta entrega limitada à consulta tabular e registrar novos indicadores como requisito separado. |

## Decisões pendentes para confirmar durante a revisão

- Confirmar se a lista de filtros recomendada é suficiente ou se o gestor deseja outro critério de cobertura.
- Confirmar se a ordenação padrão cidade A–Z deve permanecer ou se a operação prefere maior número de relações articulador–cidade.
- Confirmar se a persistência na URL é desejada para compartilhamento da consulta.
- Confirmar se a ausência dos três cards deve ser total ou se algum valor pode aparecer como texto discreto fora de um card em uma etapa posterior.

## Handoff

Origem: Product manager + Designer UX/UI  
Destino: Arquiteto de solução, Engenheiro backend e Engenheiro frontend  
Objetivo: implementar a consulta filtrável e ordenável e substituir a composição visual de cards por tabelas sem perda de dados.  
Arquivos: este plano, `coverage-page.tsx`, `coverage-repository.ts`, `packages/types`, `packages/validation`, `docs/api.md` e `docs/frontend.md`.  
Evidências: implementação atual da cobertura, contratos existentes, TanStack Table já instalado e documentação consultada pelo Context7 em `/tanstack/table` sobre estado controlado, filtering/sorting manual e integração com TanStack Query.  
Pendências: quatro suposições da seção de fonte aguardam validação do gestor; nenhuma bloqueia o desenho técnico recomendado, mas devem ser registradas antes do aceite final.  
Próximo passo: executar as Tasks 1–6 nesta ordem, validar no Docker e atualizar `docs/PROGRESS.MD`.
