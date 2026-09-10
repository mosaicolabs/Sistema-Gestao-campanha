# Visão macro de cobertura, regiões, cidades e pessoas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a tela de Cobertura em um substituto funcional da visão macro da planilha, navegando por região e cidade e exibindo, em um detalhe por cidade, articuladores, coordenadores, lideranças, contatos e dobradores.

**Architecture:** A API fornecerá uma árvore geográfica e detalhes agregados por cidade usando as entidades existentes `Locality`, `PersonAssignment`, `Person`, `Contact`, `PersonAlliance` e `Alliance`. A interface usará essa árvore no acordeão da sidebar; cada cidade abrirá um diálogo acessível com tabela de pessoas, enquanto uma dimensão separada de dobradores permitirá reproduzir as abas individuais da planilha sem duplicar cadastro.

**Tech Stack:** Node.js 22+, Express 5, TypeScript 5.9, PostgreSQL, Prisma, React 19, Vite, TanStack Query, Radix UI via `radix-ui`, GSAP, Motion, Vitest e Docker Compose.

**Spec:** Este plano é derivado de `docs/README.md`, `docs/visao-geral.md`, `docs/dados-e-prisma.md`, `docs/fluxos-operacionais.md`, `docs/decisoes-pendentes.md`, `agents/README.md`, do código atual da tela de Cobertura e do resumo da planilha fornecido pelo gestor nesta tarefa.

## Global Constraints

- O projeto continua sendo um monorepo web + API com PostgreSQL e Prisma; `apps/mobile` permanece reservado enquanto DP-016 estiver pendente.
- A experiência deve ser mobile-first e manter o template visual existente, a paleta `#013F71`, `#013968` e `#FFFFFF`, o logo e o fundo já usados no login.
- A planilha é fonte de evidência; não criar pessoa única, fundir articuladores ou resolver automaticamente as 148 duplicidades.
- Não reconciliar os índices manuais 672/591 com as contagens 681/739 nesta tarefa.
- Não decidir a identidade de Levi Carnela, Paraty/Serfiotis ou a integração “API do WhatsApp”.
- Toda rota nova exige autenticação JWT, `coverage:read`, validação Zod e tratamento explícito de 401, 403, 404 e 422.
- Dados pessoais exibidos no detalhe devem vir do cadastro único; não copiar contatos ou nomes para uma tabela nova.
- Filtrar relações `INACTIVE` da visão operacional, preservando ocorrências e vínculos históricos para auditoria.
- Toda alteração persistente futura deve usar transação e registrar `AuditLog`; esta entrega de visão é somente leitura.
- Consultar Context7 antes da implementação de APIs atuais de Radix UI, TanStack Query, Express e Prisma. Nesta preparação, Context7 confirmou o uso controlado de `Dialog` e o suporte de foco/teclado dos primitivos Radix.

## Fonte de verdade e rastreabilidade

| Origem | Evidência | Requisito derivado |
| --- | --- | --- |
| Resumo do gestor nesta tarefa | “Dentro da cidade do Rio de Janeiro tem regiões que tem” | Cobertura deve começar pela hierarquia Estado → Regiões → Cidades. |
| Resumo do gestor nesta tarefa | “Tem dobrados: deputados federais ... junto com ... Edson Albertassi” | O sistema deve apresentar `Alliance` como “Dobrador” e manter Edson como contexto da campanha. |
| Resumo do gestor nesta tarefa | “Dentro de cada cidade tem articuladores, coordenadores, liderança” | O detalhe de cidade deve agrupar os três papéis de negócio. |
| Resumo do gestor nesta tarefa | “Cada dobrador tem uma tabela ... cidades, articulador, coordenadores, lideranças ... região” | Deve existir uma visão filtrável por dobrador com cidade, região e pessoas por papel. |
| Resumo do gestor nesta tarefa | “Ao clicar ... abrir um modal com uma tabela” | A cidade deve abrir um diálogo acessível sem abandonar a tela de Cobertura. |
| Resumo do gestor nesta tarefa | “Contatos de cada um e quem essas lideranças estão apoiando” | Cada linha de pessoa deve mostrar contatos e dobradas relacionadas quando houver. |
| `docs/dados-e-prisma.md` | Cadastro separa `Person`, `Contact`, `PersonAssignment`, `Alliance` e `PersonAlliance` | Reusar o modelo único; nenhuma tabela espelho de pessoas. |
| `docs/fluxos-operacionais.md` | Cobertura distingue informação ausente de ausência confirmada | Estados vazios devem dizer “sem informação na base”, sem afirmar inexistência. |
| `docs/decisoes-pendentes.md` | DP-005, DP-008, DP-009 e DP-016 continuam abertas | Não inventar cardinalidade, mapa, escopo RBAC ou aplicativo nativo. |
| Código atual | `coverageRepository.listMacro` e `/coverage/macro` já agrupam por cidade canônica | Evoluir o contrato existente sem remover o endpoint atual ou sua métrica articulador–cidade. |

## Brainstorm do Superpowers

### Estado atual das telas

- **Login:** rebrand local já usa o símbolo do Edson, `fundodegrade.png` e a paleta aprovada; a alteração anterior permanece no working tree.
- **Dashboard:** mostra indicadores gerais e pendências, mas não permite navegar da região até a pessoa.
- **Pessoas:** lista paginada com filtros e cadastro único; o detalhe de uma pessoa já possui contatos, atribuições e alianças.
- **Cobertura:** já consulta `/coverage/macro` e exibe cards por cidade, mas ainda não possui acordeão de região/cidade nem diálogo com pessoas.
- **Tarefas:** Kanban operacional separado da exploração territorial.
- **Agenda:** eventos compartilhados, sem necessidade de alteração para esta visão.
- **Entregas:** fluxo de materiais separado; pode receber contexto de cidade no futuro.
- **Importação:** preserva lote, ocorrência, pendência e aliases; deve continuar sendo a origem dos dados.
- **Auditoria:** registra mutações; a nova consulta não cria log de leitura.

### Abordagens consideradas

1. **Reaproveitar somente `/references` e `/people?localityId`.** É a menor mudança, mas envia todas as localidades e usa paginação genérica de pessoas, deixando a regra de agrupamento e a relação com dobradores no navegador.
2. **Criar contratos de leitura específicos para cobertura — recomendada.** Uma rota retorna a árvore região/cidade, outra retorna o detalhe de uma cidade e outra retorna o detalhe por dobrador. O backend aplica status, papéis, contatos e alianças em um único lugar; a UI recebe payloads pequenos e previsíveis para celular.
3. **Criar uma consulta única “tudo da campanha”.** Reduz chamadas, mas mistura árvore, pessoas e dobradores em um payload grande, aumenta exposição de dados e dificulta cache e autorização por escopo.

A abordagem 2 foi escolhida porque substitui a navegação da planilha com contratos claros e mantém a agregação no servidor. A métrica primária continua sendo `articulatorCityRelations`, já confirmada na DP-021; os números brutos e as divergências históricas ficam fora da contagem operacional.

## Decisões de produto e suposições

As frases do resumo do gestor são requisitos. Os itens abaixo são decisões de desenho necessárias para implementar e devem permanecer marcados até confirmação quando não houver evidência direta:

- **[suposição — validar com o gestor]** O nó “Rio de Janeiro” usado como raiz é a localidade `STATE` já cadastrada, e as oito regiões filhas do seed são a lista oficial para a navegação.
- **[suposição — validar com o gestor]** “Dobrador” é o rótulo de interface para a entidade interna `Alliance`; o nome exibido vem de `Alliance.name`.
- **[suposição — validar com o gestor]** Uma `PersonAlliance` sem `localityId` não aparece no detalhe de uma cidade, mas aparece na visão por dobrador com a etiqueta “localidade não informada”.
- **[suposição — validar com o gestor]** A mesma pessoa pode aparecer em mais de um papel na mesma cidade; a tabela exibirá uma linha por atribuição para não apagar essa informação.
- **[suposição — validar com o gestor]** O clique em cidade usa `?cityId=<id>` para permitir voltar/compartilhar o detalhe; o diálogo fecha removendo o parâmetro.
- **[suposição — validar com o gestor]** A tabela pode exibir contatos para qualquer usuário com `coverage:read`; ocultação por papel ou mascaramento de telefone depende da decisão DP-009/DP-006.
- **[suposição — validar com o gestor]** A visão por dobrador será acessada por um segundo acordeão dentro de Cobertura, sem criar um item de sidebar separado.

## Contratos de dados propostos

Os tipos abaixo vivem em `packages/types` e devem ser compartilhados entre API e web:

```ts
export type CoverageTreeCity = {
  id: string
  name: string
  regionId: string
  canonicalKey: string
  articulatorCityRelations: number
  peopleCount: number
  pendingAliasCount: number
}

export type CoverageTreeRegion = {
  id: string
  name: string
  cities: CoverageTreeCity[]
}

export type CoveragePersonContact = {
  id: string
  type: string
  valueRaw: string
  isPrimary: boolean
}

export type CoveragePersonRow = {
  assignmentId: string
  personId: string
  roleCode: 'ARTICULATOR' | 'COORDINATOR' | 'LEADERSHIP'
  roleName: string
  displayName: string
  contacts: CoveragePersonContact[]
  alliances: Array<{ id: string; name: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'; localityId: string | null }>
}

export type CoverageCityDetail = {
  city: { id: string; name: string; canonicalKey: string }
  region: { id: string; name: string } | null
  summary: { articulators: number; coordinators: number; leaderships: number; articulatorCityRelations: number }
  rows: CoveragePersonRow[]
  observedVariants: string[]
}

export type CoverageAllianceRow = {
  city: { id: string; name: string; region: string }
  people: CoveragePersonRow[]
}

export type CoverageAllianceDetail = {
  alliance: { id: string; name: string }
  rows: CoverageAllianceRow[]
}
```

`GET /coverage/tree?stateId=<id>` retorna `CoverageTreeRegion[]`; `stateId` é opcional e, sem ele, usa o estado ativo do seed. `GET /coverage/cities/:cityId/detail` retorna `CoverageCityDetail`. `GET /coverage/alliances/:allianceId/detail` retorna `CoverageAllianceDetail`. Todas as rotas são somente leitura e exigem `coverage:read`.

## Plano de implementação

### Task 1: Fixar contratos, queries e rastreabilidade da macro visão

**Arquivos:**
- Modify: `packages/types/src/index.ts`
- Modify: `packages/validation/src/index.ts`
- Test: `apps/api/src/repositories/coverage.repository.test.ts`
- Create: `apps/api/src/repositories/coverage-macro.contract.test.ts`

**Interfaces:**
- Produz os tipos `CoverageTreeRegion`, `CoverageTreeCity`, `CoveragePersonRow`, `CoverageCityDetail`, `CoverageAllianceRow` e `CoverageAllianceDetail`.
- Produz `coverageTreeQuerySchema = z.object({ stateId: entityId.optional() })`.
- Produz `coverageCityParamSchema = z.object({ cityId: entityId })` e `coverageAllianceParamSchema = z.object({ allianceId: entityId })`.

- [ ] **Step 1: Escrever fixtures de contrato com uma cidade, três papéis, dois contatos e duas dobradas.** Use IDs sintéticos (`city-1`, `person-1`, `assignment-1`, `alliance-1`) e não use telefone, senha ou dado pessoal real.
- [ ] **Step 2: Executar os testes para observar as falhas de tipos e mapeamento.** Rode `npm test -w @campanha/api -- src/repositories/coverage.repository.test.ts src/repositories/coverage-macro.contract.test.ts`.
- [ ] **Step 3: Adicionar os tipos compartilhados e schemas Zod.** Mantenha a nomenclatura interna `Alliance` e o rótulo “Dobrador” apenas na camada de apresentação.
- [ ] **Step 4: Cobrir estados vazios e status inativos no contrato.** Um payload sem pessoas deve retornar `rows: []` e resumo zero; uma atribuição ou aliança `INACTIVE` não entra nas contagens.
- [ ] **Step 5: Rodar os testes direcionados e o typecheck dos pacotes.** Use `npm run build:packages` e `npm test -w @campanha/api -- src/repositories/coverage.repository.test.ts src/repositories/coverage-macro.contract.test.ts`.
- [ ] **Step 6: Commitar os contratos.** Use `git add packages/types/src/index.ts packages/validation/src/index.ts apps/api/src/repositories/coverage.repository.test.ts apps/api/src/repositories/coverage-macro.contract.test.ts && git commit -m "feat: definir contratos da cobertura macro"`.

### Task 2: Implementar a leitura hierárquica e os detalhes no backend

**Arquivos:**
- Modify: `apps/api/src/repositories/coverage.repository.ts`
- Modify: `apps/api/src/controllers/operations.controller.ts`
- Modify: `apps/api/src/routes/protected.routes.ts`
- Modify: `apps/api/src/app.test.ts`
- Test: `apps/api/src/repositories/coverage-macro.contract.test.ts`

**Interfaces:**
- `coverageRepository.listTree(stateId?: string): Promise<CoverageTreeRegion[]>`.
- `coverageRepository.getCityDetail(cityId: string): Promise<CoverageCityDetail | null>`.
- `coverageRepository.getAllianceDetail(allianceId: string): Promise<CoverageAllianceDetail | null>`.
- `operationsController.coverageTree`, `operationsController.coverageCityDetail` e `operationsController.coverageAllianceDetail`.
- Rotas protegidas `GET /coverage/tree`, `GET /coverage/cities/:cityId/detail` e `GET /coverage/alliances/:allianceId/detail`.

- [ ] **Step 1: Escrever o teste de agregação da árvore.** Verifique que cada região aparece uma vez, suas cidades são ordenadas por nome e a contagem de relações usa pessoas articuladoras distintas, nunca linhas brutas.
- [ ] **Step 2: Escrever o teste de detalhe da cidade.** Verifique que o retorno inclui cidade, região, contatos, papel e alianças ativas; a mesma pessoa com duas atribuições gera duas linhas identificáveis por `assignmentId`.
- [ ] **Step 3: Escrever o teste de detalhe por dobrador.** Verifique que cada cidade aparece uma vez no dobrador, que pessoas são agrupadas por cidade e que uma aliança sem localidade fica marcada como não informada, conforme a suposição documentada.
- [ ] **Step 4: Implementar consultas Prisma com `select` explícito.** Comece em `Locality` e navegue por `children`, `assignments.person.contacts`, `assignments.businessRole` e `person.alliances.alliance`; filtre `status != INACTIVE` e não retorne campos de autenticação.
- [ ] **Step 5: Implementar controllers e validações de path/query.** Uma cidade ou Alliance inexistente retorna 404; `stateId` vazio ou malformado retorna 422; a permissão é aplicada antes da consulta.
- [ ] **Step 6: Manter `/coverage/macro` compatível.** O novo contrato complementa a visão existente; não remover `articulatorCityRelations`, `observedVariants` ou `pendingAliasCount`.
- [ ] **Step 7: Rodar API build, testes direcionados e smoke HTTP.** Use `npm run build -w @campanha/api`, os testes da Task 1 e `supertest` para 401, 403, 404, 422 e 200.
- [ ] **Step 8: Commitar o backend.** Use `git add apps/api/src/repositories/coverage.repository.ts apps/api/src/controllers/operations.controller.ts apps/api/src/routes/protected.routes.ts apps/api/src/app.test.ts apps/api/src/repositories/coverage-macro.contract.test.ts && git commit -m "feat: expor arvore e detalhes da cobertura"`.

### Task 3: Criar o acordeão de Cobertura na sidebar

**Arquivos:**
- Create: `apps/web/src/components/ui/accordion.tsx`
- Create: `apps/web/src/features/people/coverage-navigation.tsx`
- Modify: `apps/web/src/components/layout/app-shell.tsx`
- Modify: `apps/web/src/index.css`
- Verification: checklist de browser da Task 6, cobrindo desktop e Sheet mobile

**Interfaces:**
- `CoverageNavigation({ regions, selectedCityId, onSelectCity, allianceItems })` recebe `CoverageTreeRegion[]` e lista de dobradores.
- O componente usa `Accordion.Root`/`Accordion.Item`/`Accordion.Trigger`/`Accordion.Content` do wrapper local e mantém uma única fonte de estado para região aberta.

- [ ] **Step 1: Mapear a navegação atual e preservar os links dos demais módulos.** Cobertura deve continuar em `/cobertura`; Pessoas, Tarefas, Agenda, Entregas, Importação e Auditoria não mudam de rota.
- [ ] **Step 2: Criar o wrapper Radix Accordion seguindo o padrão de `tabs.tsx`.** Exponha `Accordion`, `AccordionItem`, `AccordionTrigger` e `AccordionContent`, com `cn`, `data-slot`, foco visível e animação baseada em estado.
- [ ] **Step 3: Escrever a navegação com semântica de botão e teclado.** Cada região é um trigger; cada cidade é um botão/link com nome e contagem. O estado ativo deve sobreviver ao refresh por `cityId`.
- [ ] **Step 4: Integrar desktop e menu mobile.** No desktop, a árvore aparece dentro do item Cobertura; no mobile, o mesmo componente aparece no Sheet para que a navegação não dependa de hover ou largura de tela.
- [ ] **Step 5: Adicionar a seção de dobradores conforme a suposição documentada.** Mostre `Alliance.name` com indicador de quantidade de cidades e navegue para o estado de dobrador sem duplicar a lista de pessoas.
- [ ] **Step 6: Ajustar estilos à paleta e aos estados.** Use tokens existentes, áreas de toque de pelo menos 44px, foco visível, contraste AA e `prefers-reduced-motion`; não criar uma nova identidade visual.
- [ ] **Step 7: Rodar `npm run typecheck -w @campanha/web` e `npm run build -w @campanha/web`.** Verifique também que o menu continua fechando ao selecionar uma cidade no mobile.
- [ ] **Step 8: Commitar a navegação.** Use `git add apps/web/src/components/ui/accordion.tsx apps/web/src/features/people/coverage-navigation.tsx apps/web/src/components/layout/app-shell.tsx apps/web/src/index.css && git commit -m "feat: navegar cobertura por regiao e cidade"`.

### Task 4: Implementar o diálogo de cidade com tabela de pessoas

**Arquivos:**
- Create: `apps/web/src/features/people/coverage-city-dialog.tsx`
- Modify: `apps/web/src/features/people/coverage-page.tsx`
- Modify: `apps/web/src/lib/types.ts`
- Modify: `apps/web/src/index.css`
- Verification: checklist de browser da Task 6, cobrindo loading, erro, vazio, foco e rolagem

**Interfaces:**
- `CoverageCityDialog({ cityId, open, onOpenChange })` consulta `GET /coverage/cities/:cityId/detail` apenas quando `open && cityId`.
- Query key: `['coverage-city-detail', cityId]`.
- Colunas mínimas: `Papel`, `Pessoa`, `Contatos`, `Dobradas apoiadas`, `Origem/observação` quando existir; no celular, cada linha pode virar um card vertical mantendo os mesmos rótulos.

- [ ] **Step 1: Escrever o teste de estados do diálogo.** Cubra loading, erro com retry, cidade sem pessoas e tabela com articulador, coordenador, liderança, contato e dobrador.
- [ ] **Step 2: Implementar a busca condicional com TanStack Query.** Cancelar/ignorar consulta quando não houver cidade selecionada e invalidar a chave após alterações futuras de pessoas ou conciliação.
- [ ] **Step 3: Compor o Dialog Radix com título, descrição, fechamento, foco e rolagem interna.** O título deve incluir cidade e região; a descrição deve informar que valores são os vínculos ativos encontrados na base.
- [ ] **Step 4: Renderizar papéis e contatos sem transformar ausência em zero confirmado.** Use “Sem contato informado” e “Sem dobrada informada” como estados de dados, não como erro de cadastro.
- [ ] **Step 5: Mostrar cada liderança e as alianças que ela apoia.** Use `Alliance.name` com o rótulo visual “Dobrador”; preserve `PENDING_REVIEW` como selo de revisão e não como vínculo confirmado.
- [ ] **Step 6: Integrar abertura por card e por cidade da árvore.** O clique deve atualizar `cityId`, permitir voltar e fechar com Escape, botão fechar ou clique fora sem perder o filtro de região.
- [ ] **Step 7: Aplicar o template visual existente.** Usar componentes shadcn locais, Motion/GSAP apenas para entrada respeitando redução de movimento, sem adicionar dependências novas.
- [ ] **Step 8: Rodar build web e checklist manual em 375px, 768px e desktop.** Verifique foco do diálogo, rolagem horizontal inexistente e leitura dos quatro campos principais.
- [ ] **Step 9: Commitar o detalhe de cidade.** Use `git add apps/web/src/features/people/coverage-city-dialog.tsx apps/web/src/features/people/coverage-page.tsx apps/web/src/lib/types.ts apps/web/src/index.css && git commit -m "feat: detalhar pessoas por cidade na cobertura"`.

### Task 5: Implementar a visão por dobrador

**Arquivos:**
- Create: `apps/web/src/features/people/coverage-alliance-view.tsx`
- Modify: `apps/web/src/features/people/coverage-page.tsx`
- Modify: `apps/web/src/lib/types.ts`
- Modify: `apps/web/src/index.css`
- Test: `apps/api/src/repositories/coverage-macro.contract.test.ts` e checklist de browser

**Interfaces:**
- `CoverageAllianceView({ allianceId, onClose })` consulta `GET /coverage/alliances/:allianceId/detail` com query key `['coverage-alliance-detail', allianceId]`.
- A tabela por dobrador tem `Região`, `Cidade`, `Articuladores`, `Coordenadores`, `Lideranças` e `Dobradas relacionadas`.

- [ ] **Step 1: Escrever o teste de agrupamento por Alliance.** Uma cidade deve aparecer uma vez e separar as pessoas pelos códigos `ARTICULATOR`, `COORDINATOR` e `LEADERSHIP`.
- [ ] **Step 2: Implementar a seção navegável na Cobertura.** O estado deve permitir voltar à árvore sem perder `regionId` ou `cityId`.
- [ ] **Step 3: Renderizar linhas compactas para celular e tabela para desktop.** Use expansão progressiva para não apresentar a planilha inteira de uma vez.
- [ ] **Step 4: Exibir contexto da campanha.** O cabeçalho deve identificar o dobrador e indicar que a associação é um vínculo da campanha Edson Albertassi, sem criar uma nova pessoa “Edson” ou alterar a origem.
- [ ] **Step 5: Tratar Alliance sem cidades ou sem pessoas.** Exibir estado vazio explicando que não há vínculo ativo informado na base.
- [ ] **Step 6: Rodar build e revisão visual.** Confirmar que o usuário consegue chegar a um dobrador a partir da sidebar e retornar à visão regional.
- [ ] **Step 7: Commitar a visão por dobrador.** Use `git add apps/web/src/features/people/coverage-alliance-view.tsx apps/web/src/features/people/coverage-page.tsx apps/web/src/lib/types.ts apps/web/src/index.css && git commit -m "feat: consultar cobertura por dobrador"`.

### Task 6: Atualizar documentação, progresso e aceite operacional

**Arquivos:**
- Create: `docs/PROGRESS.MD`
- Modify: `docs/README.md`
- Modify: `docs/api.md`
- Modify: `docs/fluxos-operacionais.md`
- Modify: `docs/decisoes-pendentes.md` somente se alguma suposição for confirmada pelo gestor
- Modify: `plans/plan-003-visao-macro-cobertura-regioes-pessoas.md` para marcar etapas concluídas

- [ ] **Step 1: Documentar os três contratos de consulta.** Incluir exemplos de request/response, permissão, estados vazios e a diferença entre relação articulador–cidade e ocorrência da planilha.
- [ ] **Step 2: Atualizar o fluxo operacional de Cobertura.** Explicar a navegação região → cidade → modal e cidade → dobrador, mantendo a frase de que campo ausente não prova ausência de atuação.
- [ ] **Step 3: Atualizar `docs/README.md`.** Adicionar links para `PROGRESS.MD` e para este plano no índice principal.
- [ ] **Step 4: Atualizar o `PROGRESS.MD` após cada commit.** Registrar branch, commit, Docker, migration, testes, telas concluídas, pendências e próximo passo; nunca registrar senha, token ou telefone real.
- [ ] **Step 5: Executar validação completa.** Rodar `npm run build`, `npm run typecheck`, testes da API, `docker compose build api web`, `docker compose up -d postgres api web`, `docker compose ps` e smoke HTTP com e sem JWT.
- [ ] **Step 6: Executar aceite manual.** Em 375px e desktop: abrir Cobertura, expandir região, abrir cidade, conferir três papéis, contatos e dobradas; abrir um dobrador, conferir cidades e retornar; testar teclado e estados de erro.
- [ ] **Step 7: Rodar `git diff --check` e revisão do agente de QA/revisor.** Conferir que nenhuma mudança resolve DP-001/002/003/004/005/008/009/016 por inferência.
- [ ] **Step 8: Commitar documentação e marcar o plano.** Use `git add docs/PROGRESS.MD docs/README.md docs/api.md docs/fluxos-operacionais.md plans/plan-003-visao-macro-cobertura-regioes-pessoas.md && git commit -m "docs: registrar progresso da visao macro"`.

## Critérios de aceite

- [ ] O usuário com `coverage:read` consegue expandir Cobertura na sidebar, abrir regiões e listar apenas suas cidades.
- [ ] Cada cidade é exibida uma vez pela `Locality.id`, com a métrica principal de relações articulador–cidade e as variantes observadas preservadas.
- [ ] Clicar em uma cidade abre um diálogo acessível com articuladores, coordenadores e lideranças, nome, contatos e dobradas relacionadas.
- [ ] A tabela distingue `Sem contato informado`, `Sem dobrada informada` e erro técnico; nenhum vazio é contado como ausência confirmada.
- [ ] O usuário consegue consultar cada dobrador e ver região, cidade e pessoas por papel, retornando à árvore sem perder o contexto.
- [ ] Rotas sem JWT retornam 401, sem permissão retornam 403, IDs inexistentes retornam 404 e parâmetros inválidos retornam 422.
- [ ] A consulta não cria pessoas, aliases, vínculos, decisões ou alterações de contagem histórica.
- [ ] A interface funciona em 375px, 768px e desktop, com foco visível, Escape no diálogo, rótulos acessíveis e respeito a redução de movimento.
- [ ] Docker sobe API, web e PostgreSQL saudáveis; build, typecheck e testes aplicáveis passam.
- [ ] `docs/PROGRESS.MD` aponta exatamente o commit, os testes e as pendências atuais.

## Decisões pendentes para o gestor

1. Confirmar se a raiz da navegação deve ser o estado Rio de Janeiro e se as oito regiões do seed são oficiais. **Bloqueia:** fonte da árvore.
2. Confirmar se o rótulo “Dobrador” corresponde sempre à entidade `Alliance` e se o nome de Edson Albertassi deve aparecer fixo no cabeçalho. **Bloqueia:** copy e contexto da visão.
3. Confirmar como exibir `PersonAlliance` sem `localityId` na visão por cidade. **Bloqueia:** escopo de cidade versus dobrador.
4. Confirmar se uma pessoa com mais de um papel deve aparecer em uma linha por papel ou em uma linha consolidada. **Bloqueia:** agrupamento e contagem visual; não bloqueia a leitura do cadastro único.
5. Confirmar política de exposição de contatos para cada papel RBAC, relacionada às DP-006 e DP-009. **Bloqueia:** produção da tabela com telefones.
6. Confirmar se o segundo acordeão de dobradores atende à operação ou se deve existir item de sidebar próprio. **Bloqueia:** navegação final.

As decisões históricas sobre 148 linhas duplicadas, 672/591 versus 681/739, Levi Carnela, Paraty/Serfiotis e WhatsApp continuam separadas e não são resolvidas por este plano.

## Riscos e mitigações

| Risco | Mitigação |
| --- | --- |
| Payload grande em cidades com muitas pessoas | Endpoint de detalhe sob demanda, `select` explícito, rolagem interna e cache por cidade. |
| Contatos expostos além do necessário | Permissão `coverage:read`, revisão de RBAC/DP-006 e nenhuma resposta com credenciais ou notas privadas. |
| Confusão entre pessoa única e ocorrência | Agregar por `Person.id`/`PersonAssignment.id`, preservar `SourceOccurrence` e manter rótulos de origem. |
| Dobradas sem cidade atribuída | Mostrar como localidade não informada na visão por dobrador e não inventar cidade. |
| Divergência entre planilha e cadastro | Exibir estados vazios e aliases observados; encaminhar correções pela fila de conciliação. |
| Sidebar difícil de usar no celular | Mesmo componente Radix no desktop e no Sheet mobile, áreas de toque amplas, foco e teste em 375px. |
| Crescimento de escopo para mapa ou app nativo | Manter DP-008 e DP-016 pendentes; este plano entrega árvore e tabela responsivas. |
