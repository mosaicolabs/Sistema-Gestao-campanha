# Runbook de carga da planilha

Este procedimento importa a revisão `Campanha_EA_2026_REV-006.xlsx` para a camada de evidência e, somente depois da revisão, materializa o cadastro único da visão macro.

## Pré-requisitos

1. Subir PostgreSQL e aplicar migrations: `npm run db:migrate`.
2. Executar o seed local: `npm run db:seed`.
3. Confirmar que o arquivo `.xlsx` está fora do Git e que `DATABASE_URL` aponta para o ambiente local ou staging.

## Backup

Antes de aplicar a materialização, gerar um dump fora do repositório:

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > /tmp/campanha-before-materialization.dump
pg_restore --list /tmp/campanha-before-materialization.dump > /tmp/campanha-before-materialization.list
```

O arquivo deve permanecer fora do Git. A restauração de emergência é feita em um banco separado com `pg_restore --clean --if-exists` depois da validação do dump.

## Dry-run

O dry-run grava as ocorrências e pendências da revisão, mas não cria pessoas, atribuições ou vínculos operacionais:

```bash
npm run import:campaign -w @campanha/api -- \
  --file "/caminho/Campanha_EA_2026_REV-006.xlsx" --dry-run
```

O relatório deve preservar os totais observados (681 territoriais e 739 de dobradores), os índices manuais (672 e 591), as 148 ocorrências mantidas e a separação entre dados manuais e observados.

## Aplicação

Somente depois de revisar as pendências:

```bash
npm run import:campaign -w @campanha/api -- \
  --batch-id ID_DO_LOTE --apply --actor-user-id ID_DO_USUARIO
```

`--acknowledge-pending` só deve ser usado quando o gestor aceitar materializar registros pendentes; ele não descarta ocorrências nem decisões.

## Reexecução e verificação

Reexecutar o mesmo arquivo deve retornar `idempotent: true` e reutilizar o mesmo lote lógico pelo `semanticHash`. Conferir:

- uma revisão lógica e os artefatos binários associados;
- 1.420 ocorrências de origem;
- 54 cidades, oito regiões e 17 dobradores;
- pessoas, papéis, contatos e relações com `EntitySource`;
- religião somente na evidência de origem;
- `AuditLog` sem nomes, telefones ou religião.

Nunca remover `SourceOccurrence` para corrigir uma materialização. Corrija a decisão, reverta o estado do lote ou restaure o backup em ambiente isolado.
