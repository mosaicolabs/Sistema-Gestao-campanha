# Parecer independente de requisitos administrativos

Revisão de 10/09/2026, baseada na transcrição automática integral do áudio (aproximadamente 4min11s) e em `Analise_da_planilha.md`. Esta revisão não realizou nova extração do Excel. Os tempos abaixo são aproximados. A identificação nominal dos interlocutores não é necessária para estabelecer os requisitos e permanece sujeita à revisão da transcrição.

## O que foi efetivamente dito

O áudio apresenta uma intenção de produto e exemplos de uso, não uma especificação fechada. A menção a uma função permite registrá-la como proposta dos interlocutores; não comprova prioridade, regras detalhadas ou aprovação de um desenho técnico.

| Evidência no áudio | Requisito administrativo expresso | Grau de definição |
|---|---|---|
| 00:06–00:25 | A planilha está no Drive; há intenção de criar um hub com módulos de ferramentas. | Visão de produto. Não há decisão sobre plataforma, integração com o Drive ou quais módulos entram primeiro. |
| 02:03–02:22 | Considerar uma rota para entrega de material gráfico. | Exemplo de uso logístico. Não especifica cadastro de entregas, endereços, veículos, estoque ou otimização de rota. |
| 02:29–02:53 | Permitir que pessoas selecionadas e habilitadas alimentem a base com novos registros. | Necessidade clara de acesso de escrita controlado. As permissões exatas não foram definidas. |
| 02:53–02:58 | Há pouco tempo disponível. | Restrição qualitativa; não há data de entrega, orçamento ou tamanho da equipe. |
| 03:05–03:23 | Controlar tarefas e oferecer um Kanban de pendências; dois usuários são citados como exemplo de mesmo nível de acesso. | Função proposta explicitamente. Colunas, responsáveis, prazos e transições não foram definidos. |
| 03:24–03:37 | Oferecer agenda online acessível por um link simples ao Edson, com atualização para as pessoas necessárias. | Função proposta explicitamente. É ambíguo se ele deverá apenas consultar, editar ou ambos. |
| 03:40–03:58 | Possibilidade de alertar coordenadores gerais pelo WhatsApp a cada nova agenda cadastrada. | Ideia condicional, marcada por “até de repente” e dúvida sobre viabilidade. Não é integração já contratada nem autorização para enviar mensagens agora. |

A fala contém também objetivos de mapeamento e mobilização eleitoral. Eles pertencem à transcrição e ao contexto do pedido; este parecer se limita às funções administrativas gerais e à qualidade dos dados.

## Hipóteses que exigem confirmação

1. **Agenda:** “agenda” significa um compromisso individual ou um calendário inteiro? Quem pode consultar, criar, alterar e cancelar? Quais pessoas recebem a atualização? O “link simples” exige autenticação, acesso temporário ou outra forma de identificação? A fala não pede acesso público.
2. **Tarefas:** o Kanban atende a toda a equipe administrativa ou a projetos separados? Quais etapas existem? Haverá responsável, prazo, descrição, anexos e comentários? “Mesmo nível de acesso” é um exemplo de igualdade entre dois usuários, não uma matriz completa de perfis.
3. **Cadastro:** os colaboradores habilitados podem apenas incluir registros ou também alterar, excluir e exportar? A inclusão entra imediatamente na base ou passa por revisão? Nenhuma dessas regras está expressa.
4. **Logística:** trata-se somente de registrar entregas e seus destinos ou de calcular rotas? Quem informa os endereços e confirma o recebimento? Não se pode extrair endereços de entrega confiáveis dos nomes das abas.
5. **Alertas:** o WhatsApp é necessário na primeira versão? O gatilho é criação de compromisso, alteração, cancelamento ou lembrete? A referência a “nosso WhatsApp” não define grupo, conta, integração nem destinatários individuais.
6. **Prioridade:** hub, base de dados, agenda, tarefas e logística são ideias mencionadas, mas o áudio não fixa a ordem de implementação. Qualquer proposta de versão inicial deve ser identificada como recomendação nossa.

## Lacunas concretas da planilha para esses módulos

| Área | O arquivo oferece, segundo a análise | O que falta para a função administrativa |
|---|---|---|
| Agenda | Localidades e registros de pessoas. | Entidade de compromisso; título; início/fim; fuso horário; local; responsável; situação; público autorizado; histórico de alterações. Não há calendário na estrutura examinada. |
| Tarefas | Nenhuma aba de tarefas ou quadro de etapas identificado. | Identificador, título, etapa, responsável e histórico de movimentação; prazo e vínculo com compromisso ou entrega, caso sejam aprovados. |
| Logística | Localidades e contatos parciais. | Endereço validado do destino, solicitação de entrega, itens/quantidades, responsável pela execução, datas e situação. O áudio não exige controle de estoque. |
| Acesso | Nenhuma proteção de folha; não há cadastro de usuários ou matriz de permissões no arquivo. | Identidade de usuário, permissões por operação, habilitação/revogação e registro de autoria das alterações. A ausência de proteção de folha não permite concluir quem tem acesso ao arquivo no Drive. |
| Integridade | Nomes, contatos, papéis e vínculos misturados; informações repetidas entre abas. | Identificadores estáveis, separação de conceitos, validação, conciliação de duplicidades e origem de cada dado. |

Os campos sugeridos nesta tabela são **propostas de especificação**, não palavras do gestor. Também não se deve presumir que todas as pessoas da planilha serão usuários autenticados: cadastro de pessoa e conta de acesso são conceitos distintos.

## Critérios de aceite sugeridos para validar o futuro sistema

Estes critérios são uma proposta nossa para discussão; não constituem escopo aprovado.

1. **Importação rastreável:** cada linha de origem recebe um destino ou uma pendência explicada. Arquivo, aba e linha ficam preservados. Os dois conjuntos de 681 linhas territoriais e 739 linhas de dobradas são reconciliados separadamente, sem prometer 1.420 pessoas únicas. Os índices manuais não comandam a contagem.
2. **Importação fiel:** o mapeamento reconhece a inversão de colunas em Paty do Alferes; possíveis deslocamentos e duplicidades ficam disponíveis para revisão. Executar novamente a mesma importação não cria cópias silenciosas. Campos vazios permanecem vazios e identificados como pendência.
3. **Edição autorizada:** uma pessoa habilitada consegue executar exatamente as operações permitidas; uma conta sem a permissão correspondente não consegue executá-las. Revogar a habilitação impede novas operações protegidas. Alterações registram autor, instante e valores modificados.
4. **Agenda compartilhada:** depois que um usuário autorizado cria ou altera um compromisso, os demais usuários com acesso veem a versão atual; pessoas sem acesso não o veem. Dois usuários editando o mesmo compromisso não perdem alterações silenciosamente. Os critérios de autenticação do link são testados após sua definição.
5. **Kanban persistente:** a tarefa aparece na etapa escolhida, conserva a mudança após recarregar a página e apresenta o mesmo estado aos usuários autorizados. Etapas e regras de movimentação são verificadas contra a configuração aprovada.
6. **Entrega acompanhável:** se o módulo logístico for incluído, cada entrega permite identificar o destino informado, itens/quantidades, responsável e estado atual. Um endereço ausente aparece como pendência; não é inventado nem apresentado como destino confirmado.
7. **Alerta condicional:** se o WhatsApp entrar no escopo, cada evento aprovado produz no máximo um alerta por destinatário previsto, com situação de envio observável e falhas registradas. Alterar ou cancelar um compromisso só dispara mensagem se essa regra tiver sido aprovada. O teste ocorre com destinatários de teste autorizados.

## Conclusão para a especificação

O áudio sustenta a necessidade de colaboração com acesso controlado e propõe tarefas, agenda compartilhada, logística e eventual alerta por WhatsApp. A planilha é fonte de cadastros e relações; não contém a estrutura operacional desses módulos. A próxima especificação deve separar o que será migrado do que será criado, explicitar a prioridade dos módulos e fechar as regras de acesso, agenda e tarefas antes de estimar a implementação.
