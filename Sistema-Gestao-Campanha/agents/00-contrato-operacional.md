---
meta:
  title: Contrato operacional dos agentes
  navLabel: Contrato operacional
  category: Engenharia
  contentType: Reference
goal: Definir o comportamento obrigatório de qualquer agente que trabalhe neste projeto.
audience: Agentes de IA, desenvolvedores e responsáveis por revisar saídas automatizadas.
---

# Contrato operacional dos agentes

Este contrato vale para todos os agentes desta pasta. O agente deve ler este arquivo, a documentação indicada no índice e o contexto da tarefa antes de produzir código, comandos ou recomendações.

## Ordem obrigatória de trabalho

1. Leia a skill [`superpowers:using-superpowers`](/Users/joaomvalente/.codex/plugins/cache/openai-curated-remote/superpowers/6.3.0/skills/using-superpowers/SKILL.md) antes de agir.
2. Identifique as skills aplicáveis. Use `brainstorming` antes de trabalho criativo ou mudança de arquitetura, `writing-plans` antes de implementação planejada, `test-driven-development` para comportamento novo, `systematic-debugging` para falhas e `verification-before-completion` antes de afirmar conclusão.
3. Leia [`docs/README.md`](../docs/README.md) e a página da disciplina. Consulte o código apenas depois de entender a orientação correspondente.
4. Separe pedido do usuário, comportamento documentado, dado do diagnóstico e hipótese. Marque qualquer lacuna como `[suposição — validar com o gestor]`.
5. Apresente o plano, riscos e arquivos afetados antes de uma alteração ampla. Peça aprovação quando a skill aplicável exigir um gate explícito.
6. Implemente ou recomende a menor mudança que cumpre o objetivo, preservando os limites do PRD e das decisões pendentes.
7. Rode as verificações da disciplina, registre resultados e deixe um handoff que outra pessoa consiga continuar.

## Uso obrigatório do Context7

Use o MCP Context7 para qualquer dúvida sobre API, configuração, versão ou comportamento atual de biblioteca, framework, SDK ou ferramenta. Não use memória como fonte única para detalhes que podem ter mudado.

1. Resolva a biblioteca com `mcp__context7__resolve_library_id`.
2. Consulte o resultado com `mcp__context7__query_docs`, usando uma pergunta específica por conceito.
3. Faça no máximo três consultas por pergunta e escolha documentação oficial ou de alta reputação.
4. Registre no resultado a biblioteca consultada, a versão quando informada e a decisão derivada. Nunca envie senha, token, dado pessoal ou conteúdo confidencial para a consulta.

Para este projeto, as referências iniciais são `/react/react`, `/expressjs/express` e `/prisma/web`. Resolva novamente a biblioteca se o trabalho envolver outra ferramenta, versão ou integração.

## Fontes e rastreabilidade

- O código em `apps/` e `packages/` descreve o comportamento implementado.
- [`docs/README.md`](../docs/README.md) é o índice das guidelines técnicas e operacionais.
- [`PRD_sistema_gestao_campanha.md`](../../PRD_sistema_gestao_campanha.md) define escopo e requisitos do produto.
- `analise/` preserva diagnóstico da planilha e do áudio.
- `docs/decisoes-pendentes.md` lista DP-001 a DP-020. Não transforme uma decisão pendente em regra automática.

Ao mencionar um requisito, cite arquivo e seção. Ao alterar dados de origem, preserve aba, linha, hash, valor bruto e justificativa de conciliação.

## Guardrails

- Não exponha valores de `.env`, credenciais, tokens ou dados pessoais em respostas, logs, screenshots ou fixtures.
- Não faça fusão silenciosa de pessoas, vínculos ou ocorrências.
- Não escolha entre os índices 672 e 591 e as contagens 681 e 739 sem confirmação do gestor.
- Não resolva por conta própria as 148 linhas duplicadas, a identidade de Levi Carnela, o significado de “API do WhatsApp” ou outra decisão pendente.
- Não edite migration já aplicada, nem use `down -v`, `reset`, `rm` ou operação destrutiva sem pedido explícito.
- Prefira mudanças reversíveis, pequenas e testáveis.

## Formato mínimo de saída

Toda entrega deve conter:

- **Objetivo:** o que foi atendido
- **Evidência:** arquivos, requisitos, dados ou consulta Context7 que sustentam a decisão
- **Mudanças:** arquivos criados ou alterados e regra aplicada
- **Validação:** comandos executados e resultado
- **Pendências:** decisões abertas, riscos ou `[suposição — validar com o gestor]`
- **Handoff:** próximo agente, próximo passo e condição de entrada
