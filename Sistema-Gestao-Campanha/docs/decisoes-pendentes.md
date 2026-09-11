---
meta:
  title: Revisar decisões pendentes do produto
  navLabel: Decisões pendentes
  category: Produto
  contentType: Reference
goal: Localizar escolhas de produto que ainda exigem confirmação do gestor.
audience: Gestores, analistas, designers e desenvolvedores.
---

# Revisar decisões pendentes do produto

DP-003, DP-004, DP-006, DP-008 a DP-014 e DP-016 a DP-020 continuam abertas e são persistidas como `PENDING`. DP-001, DP-002, DP-005, DP-007 e DP-015 foram confirmadas para a carga atual; DP-021 foi confirmada em 10/09/2026 e é regra executável do fluxo de localidades.

| ID | Decisão | Impacto | Estado |
| --- | --- | --- | --- |
| DP-001 | Destino dos quatro blocos de 37 linhas | Define vínculos, correções ou rejeições das 148 ocorrências | Confirmada: manter evidência |
| DP-002 | Fonte que prevalece após a revisão | Define a reconciliação de 672 versus 681 e 591 versus 739 | Confirmada: preservar ambos |
| DP-003 | Identidade e grafia de Levi Carnela ou Levi Carnella | Impede criar identidade não confirmada |
| DP-004 | Significado de “API do WhatsApp” | Define fornecedor e arquitetura da possibilidade |
| DP-005 | Cardinalidade de papéis, localidades e dobradas | Define validações de atribuições | Confirmada |
| DP-006 | Titularidade dos campos de contato | Define a pessoa dona de cada telefone |
| DP-007 | Correção de Paraty e Serfiotis | Define valores publicados para campos divergentes | Confirmada |
| DP-008 | Significado de mapa e níveis territoriais | Define cartografia ou visão organizada |
| DP-009 | Papéis RBAC e escopos | Define consulta, cadastro, alteração, exclusão e exportação |
| DP-010 | Política de sessão e recuperação de acesso | Define token de renovação (refresh token), recuperação, autenticação multifator (MFA) e encerramento |
| DP-011 | Acesso de Edson à agenda | Define link, edição, expiração e revogação |
| DP-012 | Fluxo definitivo do Kanban | Define campos, status, responsáveis e visibilidade |
| DP-013 | Escopo de materiais e entregas | Define solicitações, estoque e rotas |
| DP-014 | Etapa e gatilhos de WhatsApp | Define destinatários e eventos de alerta |
| DP-015 | Finalidade e retenção do campo religião | Define migração, visibilidade ou remoção | Confirmada: somente evidência |
| DP-016 | Plataforma mobile | Define PWA, aplicativo nativo ou web responsiva |
| DP-017 | Biblioteca e indicadores de gráficos | Define gráficos além do diagnóstico |
| DP-018 | Prazo, usuários, orçamento e prioridade | Define capacidade e sequência dos módulos |
| DP-019 | Continuidade da planilha e integração com Drive | Define sincronização e conflitos de fonte |
| DP-020 | Backup, retenção, exportação e exclusão | Define política operacional dos dados |

## DP-021 confirmada: grafias de cidades e aliases canônicos

O gestor autorizou ativar automaticamente como aliases seguros as diferenças de maiúsculas, acentos e espaços. Também autorizou usar o nome canônico correto para os seis pares de cidades listados nas linhas 339–344 do relatório `Campanha_EA_2026_articuladores_por_cidade.md`:

| Grafia observada | Localidade canônica aprovada |
| --- | --- |
| CACHOEIRA DE MACACU | Cachoeiras de Macacu |
| CAMPOS DOS GOYTACASES | Campos dos Goytacazes |
| CASEMIRO DE ABEU | Casemiro de Abreu |
| COMENDADOR LEVY GASPARIAM | Comendador Levy Gasparian |
| ENGENHEIRO PAULO DE FRONTIM | Engenheiro Paulo de Frontin |
| PATY DO ALVERES | Paty do Alferes |

O valor bruto continua preservado em `SourceOccurrence`; o alias ativo aponta para `Locality` e a decisão é auditada. As grafias de articuladores continuam fora deste escopo e não geram fusão de pessoas.

## Como confirmar uma decisão

Registre a decisão com data, responsável, contexto, regra escolhida, dados afetados e plano de reversão. Atualize o status no banco, o documento de requisitos do produto (PRD), o módulo afetado e esta página; remova o rótulo de pendência somente quando a confirmação estiver documentada.

## Itens que bloqueiam automação

DP-001 e DP-002 não bloqueiam a preservação/materialização controlada da carga atual, mas continuam exigindo rastreabilidade e não autorizam apagar ou substituir valores. DP-003 bloqueia identidade de pessoa ou usuário. DP-004 e DP-014 bloqueiam alertas de WhatsApp. DP-016 bloqueia a escolha de uma aplicação mobile separada. DP-006 continua pendente: os contatos deslocados ficam fora da materialização operacional até a política ser definida.
