---
meta:
  title: Operar os módulos da campanha
  navLabel: Fluxos operacionais
  category: Produto
  contentType: How-to
goal: Executar os fluxos principais sem confundir informação ausente com ausência.
audience: Gestores, articuladores, coordenadores e operadores do sistema.
---

# Operar os módulos da campanha

As telas organizam a rotina de campo sobre um cadastro único. Cada módulo mantém o histórico necessário para revisar origem, responsabilidade e situação sem ocultar lacunas da base.

## Cadastro de pessoas

Use **Pessoas** para criar uma entidade uma vez e relacionar contatos, papel, localidade e dobradas. Ao detectar nome ou telefone coincidente, o sistema mostra candidatos e mantém os registros separados até uma decisão de conciliação.

## Cobertura territorial

Use **Cobertura** para abrir **Regiões e cidades** na sidebar. A árvore começa no estado do Rio de Janeiro e agrupa as cidades pelas regiões ativas da base; a contagem principal representa relações articulador–cidade. Selecione uma cidade para abrir o diálogo acessível com articuladores, coordenadores, lideranças, contatos e dobradas relacionadas. O selo **Informação ausente** significa que a base não informou o campo; ele não afirma que não existe atuação naquele local.

Na seção **Dobradores / Deputados apoiados**, selecione uma Alliance para consultar sua visão agrupada por região e cidade, com as pessoas separadas por papel. Vínculos sem localidade aparecem como **Localidade não informada**. Use **Voltar para a árvore** para retornar à visão territorial.

## Tarefas

Use **Tarefas** para registrar pendências no board principal. Crie a tarefa com título, prioridade, prazo e responsáveis, depois mova o card entre **A fazer**, **Em andamento** e **Concluído**. A movimentação registra posição anterior, posição nova, usuário e data na auditoria.

## Agenda

Use **Agenda** para compromissos compartilhados com início, término, localidade, endereço e visibilidade. Uma atualização carrega `version`; conflito retorna `409` para evitar que uma edição sobrescreva outra. Alertas por WhatsApp permanecem desativados enquanto DP-004 e DP-014 não forem confirmadas.

## Entregas

Use **Entregas** para registrar destino, origem, endereço, responsável, data prevista, itens e observações. O fluxo atual não calcula estoque, rota ou otimização; não prometa esses comportamentos em uma tela ou integração.

## Importação e revisão

Use **Importação e conciliação** para enviar a planilha, comparar contagens e revisar pendências. Registre decisão, motivo e entidade alvo quando necessário; o sistema preserva ocorrência e origem e não faz fusão silenciosa.

## Acesso e auditoria

Use **Acesso e auditoria** para ver permissões da sessão, criar usuários, suspender ou reativar contas e consultar histórico. Uma conta criada recebe senha temporária e precisa trocá-la no primeiro login.

## Princípios para operação

- Trate a planilha como fonte de evidência, não como cadastro duplicado
- Confirme a origem antes de corrigir dados divergentes
- Registre justificativa para toda decisão de conciliação
- Use permissões do próprio perfil, sem compartilhar credenciais
- Informe o gestor quando uma ação depender de DP-001 a DP-020
