---
meta:
  title: Entender o sistema antes de alterar o código
  navLabel: Visão geral
  category: Projeto
  contentType: Conceptual
goal: Explicar o problema, o escopo do MVP e os limites conhecidos.
audience: Pessoas novas no projeto, gestores e revisores técnicos.
---

# Entender o sistema antes de alterar o código

Esta página explica o que o sistema resolve, quais módulos existem e quais decisões continuam abertas. Use-a para separar comportamento confirmado de hipótese de produto.

## O que o sistema resolve

O sistema transforma a base da campanha em um cadastro único de pessoas, papéis, localidades, contatos e vínculos. A aplicação acrescenta tarefas, agenda, entregas, importação, reconciliação e auditoria sobre essa base. A planilha continua preservada como evidência de origem, mas não define o modelo operacional final.

## Escopo implementado

O MVP atual inclui:

- Login com usuário, senha, JWT e troca obrigatória no primeiro acesso
- Controle de acesso baseado em papéis, conhecido como RBAC, aplicado na API
- Cadastro único de pessoas com contatos, papéis, localidades e vínculos de dobrada
- Visão de cobertura territorial que diferencia informação ausente de ausência confirmada
- Kanban com criação e movimentação persistida de tarefas
- Agenda compartilhada com atualização versionada
- Solicitação e acompanhamento de entregas de materiais
- Importação `.xlsx` com hash, ocorrências de origem e fila de revisão
- Registro de decisões de conciliação com autor, data e justificativa
- Histórico de auditoria para operações protegidas

## Limites do MVP

O sistema não decide automaticamente como reconciliar as 148 linhas duplicadas. Também não escolhe entre os índices manuais 672 e 591 e as contagens reais 681 e 739. WhatsApp aparece como possibilidade desativada, e `apps/mobile` permanece como reserva arquitetural até a decisão DP-016.

O modelo atual não executa estoque, otimização de rotas, cartografia, sincronização com Google Drive ou integração com fornecedor de WhatsApp. Esses itens precisam de confirmação nas decisões pendentes antes de virarem requisito obrigatório.

## Números da base de origem

O importador reproduz o diagnóstico da planilha `Campanha_EA_2026_REV-006.xlsx`:

| Medida | Valor | Interpretação |
| --- | ---: | --- |
| Abas | 80 | Estruturas de origem preservadas |
| Ocorrências territoriais | 681 | Linhas encontradas, não pessoas únicas |
| Ocorrências de dobradas | 739 | Linhas encontradas, não pessoas únicas |
| Índice territorial manual | 672 | Controle histórico da planilha |
| Índice de dobradas manual | 591 | Controle histórico da planilha |
| Linhas duplicadas de dobradas | 148 | Pendência que exige decisão |

## Como tomar decisões no projeto

Toda mudança que alterar dados, permissões, integração ou fluxo deve apontar para o requisito do documento de requisitos do produto (PRD) que a justifica. Se o código precisar preencher uma lacuna do diagnóstico, registre a escolha como suposição e crie ou atualize uma decisão pendente. Não converta uma ocorrência da planilha em pessoa única sem uma regra de reconciliação confirmada.
