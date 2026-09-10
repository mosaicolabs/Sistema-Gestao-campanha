---
meta:
  title: Contribuir com o projeto
  navLabel: Contribuição
  category: Engenharia
  contentType: How-to
goal: Planejar, implementar e revisar uma mudança rastreável.
audience: Colaboradores internos e externos autorizados.
---

# Contribuir com o projeto

Uma contribuição precisa preservar os contratos do monorepo, a rastreabilidade da base e os limites do documento de requisitos do produto (PRD). Faça a mudança na camada correta, rode os checks e atualize a documentação da área.

## Antes de codificar

1. Leia a [visão geral](visao-geral.md) e o módulo afetado
2. Aponte o requisito do documento de requisitos do produto (PRD) que a mudança atende
3. Verifique [decisões pendentes](decisoes-pendentes.md) para não fechar uma lacuna sem autorização
4. Defina impacto em banco, API, interface, segurança e dados importados

## Organização de uma mudança

Mantenha alterações relacionadas no mesmo fluxo: schema e migration, tipos e validação, repository e service, controller e rota, tela e documentação. Evite refatorar módulos não relacionados no mesmo conjunto de mudanças.

## Convenções de código

- Use TypeScript estrito e imports pelos pontos públicos dos pacotes
- Prefira funções pequenas com nomes que descrevem a regra aplicada
- Retorne erros com `AppError` e códigos estáveis na API
- Valide entrada com Zod antes de acessar o domínio
- Use transações Prisma para alterações relacionadas
- Registre auditoria em toda mutação de domínio
- Preserve valor bruto e origem quando tratar dados da planilha
- Use `Intl.DateTimeFormat` e `Intl.NumberFormat` para formatos exibidos

## Interface

Crie features em `apps/web/src/features`, reutilize componentes shadcn/ui e mantenha o layout mobile-first. Toda tela precisa tratar carregamento, vazio, erro e sucesso quando esses estados existirem. Não adicione uma biblioteca de ícones ou estado sem justificar a necessidade na revisão.

## Banco e dados

Não edite migrations já aplicadas. Não funda pessoas ou vínculos com base apenas em coincidência de nome ou telefone; candidatos devem permanecer revisáveis. Se uma regra nova resolver DP-001, DP-002 ou outra decisão, registre a confirmação antes de codificar a automação.

## Revisão antes de abrir pull request

Rode:

```bash
npm run typecheck
npm test
npm run build
docker compose config --quiet
```

Descreva o comportamento antes e depois, dados migrados, variáveis novas, riscos e como a mudança foi testada. Inclua links para a documentação atualizada e indique qualquer decisão ainda pendente.
