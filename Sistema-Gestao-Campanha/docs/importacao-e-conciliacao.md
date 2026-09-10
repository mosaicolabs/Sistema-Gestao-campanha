---
meta:
  title: Importar a planilha e revisar ocorrências
  navLabel: Importação e conciliação
  category: Dados
  contentType: How-to
goal: Importar um arquivo XLSX, verificar contagens e registrar decisões.
audience: Gestores, analistas de dados e desenvolvedores de suporte.
---

# Importar a planilha e revisar ocorrências

O fluxo lê `.xlsx`, calcula um hash, preserva aba e linha e cria uma fila de revisão. Ele mede ocorrências, não pessoas únicas, e nunca consolida duplicidades sem uma decisão explícita.

## Antes de importar

Confirme que o arquivo é `.xlsx` e tem no máximo 25 MB. O importador espera a planilha da campanha com linhas de cabeçalho antes dos registros; salve uma cópia original para auditoria.

## Importar pela interface

1. Abra **Importação e conciliação**
2. Selecione o arquivo `.xlsx`
3. Clique em **Importar lote**
4. Compare abas, ocorrências, índices manuais e pendências
5. Abra uma pendência e registre decisão com justificativa

O mesmo arquivo não cria lote duplicado: o servidor calcula SHA-256 e retorna o lote existente quando o hash já foi processado.

## Classificação de abas

O parser aplica estas regras:

- `>>RIO DE JANEIRO<<` é índice geral e não vira ocorrência
- Abas com nome iniciado por `>>` e terminado em `<<` são índices regionais
- As 17 lideranças conhecidas são classificadas como `ALLIANCE`
- As demais abas são classificadas como `TERRITORIAL`
- Linhas vazias após os cabeçalhos são ignoradas

O parser usa `ExcelJS`, preserva os oito primeiros valores da linha, normaliza valores para comparação e calcula um hash por aba, linha e conteúdo normalizado.

Após a persistência das ocorrências, o serviço de normalização procura cidades do manifesto por chave determinística. Aliases seguros são gravados de forma idempotente; aproximações fora da lista aprovada viram pendências `LOCALITY_ALIAS`. O comando também pode ser executado em dry-run conforme o [runbook de normalização](normalizacao-de-localidades.md).

## Resultado esperado da base atual

Para `Campanha_EA_2026_REV-006.xlsx`, o resultado validado é:

| Campo | Valor |
| --- | ---: |
| Abas | 80 |
| Ocorrências territoriais | 681 |
| Ocorrências de dobradas | 739 |
| Índice territorial manual | 672 |
| Índice de dobradas manual | 591 |
| Ocorrências rastreadas | 1.420 |

Os índices manuais permanecem como controle histórico. A tela explica a diferença sem substituir os valores por uma contagem escolhida pelo sistema.

## Pendências conhecidas

O lote conhecido registra as 148 linhas duplicadas de dobradas, o par repetido em Wellington José, candidatos por liderança e localidade, telefones repetidos, campos possivelmente deslocados em Paraty, divergências em Serfiotis e Barra do Piraí, liderança ausente no Rio de Janeiro, grafias de localidades e hiperlink quebrado em Mendes.

## Registrar uma decisão

Escolha uma ação, escreva ao menos 10 caracteres de justificativa e, quando necessário, informe entidade alvo. A API grava `ReconciliationDecision`, atualiza a pendência para `RESOLVED` e escreve auditoria com autor e data.

As ações disponíveis são `KEEP`, `REJECT`, `MERGE`, `SPLIT` e `CORRECT`. A ação não altera automaticamente pessoas ou vínculos; o significado de cada decisão precisa seguir o acordo do gestor, especialmente para DP-001 e DP-002.

## Reimportação

Uma reimportação com hash igual é idempotente quando o lote já tem ocorrências. Se o lote existe sem ocorrências, o servidor limpa pendências e ocorrências do próprio lote antes de processar novamente. O código nunca remove pessoas consolidadas de outros lotes.
