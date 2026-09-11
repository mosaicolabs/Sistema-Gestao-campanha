---
meta:
  title: Alterar o modelo de dados com Prisma
  navLabel: Dados e banco
  category: Engenharia
  contentType: Reference
goal: Entender entidades, vínculos, migrations e seed do banco.
audience: Desenvolvedores backend e responsáveis por dados.
---

# Alterar o modelo de dados com Prisma

O banco usa PostgreSQL e o schema vive em `packages/database/prisma/schema.prisma`. O modelo separa entidades operacionais de ocorrências da planilha para preservar a origem sem repetir a estrutura territorial e de dobradas.

## Grupos de entidades

| Grupo | Modelos | Papel |
| --- | --- | --- |
| Cadastro | `Person`, `PersonAlias`, `Contact` | Pessoa única, grafias e contatos |
| Território | `Locality`, `LocalityAlias` | Estado, região, cidade e área local |
| Atuação | `BusinessRole`, `PersonAssignment` | Papel e vínculo com localidade |
| Dobradas | `Alliance`, `PersonAlliance` | Alianças e vínculos revisáveis |
| Acesso | `User`, `AccessRole`, `Permission`, junções | Conta, RBAC e escopo |
| Origem | `ImportBatch`, `ImportArtifact`, `SourceOccurrence`, `ImportIndexControl`, `ImportIssue` | Revisão lógica, artefato, aba, linha, controles e pendência |
| Conciliação | `ReconciliationDecision`, `EntitySource` | Decisão e rastreabilidade |
| Operação | `KanbanBoard`, `KanbanColumn`, `Task` | Tarefas e responsáveis |
| Agenda | `CalendarEvent`, `EventParticipant`, `ShareLink` | Compromissos e compartilhamento |
| Entregas | `Material`, `Delivery`, `DeliveryItem` | Materiais e entrega solicitada |
| Plataforma | `Notification`, `AuditLog`, `ProductDecision` | Integração futura, auditoria e decisões |

## Cadastro único

`Person` guarda uma pessoa uma vez. `PersonAlias` registra grafias alternativas, `Contact` guarda valor bruto e valor normalizado, `PersonAssignment` liga a pessoa a papel e localidade, e `PersonAlliance` registra a dobrada com status de revisão.

`ImportBatch.semanticHash` identifica a revisão lógica do conteúdo; `ImportArtifact.fileHash` identifica cada arquivo recebido. `ImportIndexControl` preserva o rótulo, célula, índice manual, contagem observada e diferença de cada controle geral, regional, de cidade e de dobrador. `MaterializationStatus` registra o ciclo de prévia, execução, conclusão ou falha.

O importador cria `SourceOccurrence` para cada aba e linha, sem transformar automaticamente cada ocorrência em `Person`. `EntitySource` liga uma entidade aceita à ocorrência que a originou; esse vínculo permite auditar a decisão sem perder o valor original.

## Localidades

`Locality` usa hierarquia por `parentId` e diferencia `STATE`, `REGION`, `CITY` e `LOCAL_AREA`. O seed cria Rio de Janeiro, oito regiões e as cidades identificadas no diagnóstico. `LocalityAlias` preserva `value`, guarda `valueNormalized` para busca e mantém `status`; a regra de aliases aprovados e o manifesto estão em [normalização de localidades](normalizacao-de-localidades.md).

## Estados e revisão

Registros usam `ACTIVE`, `INACTIVE` ou `PENDING_REVIEW`. Vínculos criados a partir de dobradas começam como `PENDING_REVIEW`. O código não transforma uma pendência em fusão automática; a decisão precisa de ação explícita e justificativa.

## Migration

Crie uma migration local após alterar o schema:

```bash
npx prisma migrate dev --name descreva_a_mudanca
npm run db:generate
npm run typecheck
npm test
```

Não edite uma migration já aplicada. Revise o SQL gerado, confira chaves estrangeiras e índices, e inclua a pasta criada em `packages/database/prisma/migrations/`. O Docker aplica migrations versionadas com `prisma migrate deploy`.

## Seed

`packages/database/prisma/seed.ts` cria permissões, papel administrador, usuário inicial, localidades, papéis de negócio, materiais, decisões DP-001 a DP-020, lote diagnóstico e tarefas iniciais. O seed usa `upsert` e pode rodar mais de uma vez sem duplicar esses registros.

## Regras para mudanças de dados

- Preserve dados de origem e referências de importação
- Prefira `status` a apagar registros que ainda precisam de histórico
- Adicione índices para filtros usados por listas e dashboards
- Use transação quando a operação alterar entidades relacionadas
- Registre mutações de domínio em `AuditLog`
- Atualize tipos, schemas, repositories, serviços e documentação juntos

## Dado sensível

O modelo atual não inclui um campo operacional para religião. O texto bruto fica somente em `SourceOccurrence.rawValues` como evidência restrita, conforme DP-015; não adicione filtros ou classificações antes de uma decisão específica.
