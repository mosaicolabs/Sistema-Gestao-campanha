---
meta:
  title: Entender o estado do pacote mobile
  navLabel: Mobile
  category: Produto
  contentType: Conceptual
goal: Explicar o que existe hoje para mobile e o que depende da decisão DP-016.
audience: Gestores, designers e desenvolvedores de produto.
---

# Entender o estado do pacote mobile

O produto atual entrega uma aplicação web responsiva com prioridade para celular. `apps/mobile` existe como reserva arquitetural e não escolhe PWA, React Native, Expo ou aplicativo nativo.

## O que já funciona no celular

O frontend web usa viewport adaptável, navegação inferior, menu em sheet, cartões de entidade, Kanban horizontal e controles com área de toque. O comportamento mobile deve continuar sendo validado em telas pequenas antes de qualquer decisão de aplicativo separado.

## O que o pacote contém

`apps/mobile/package.json` mantém apenas um script de typecheck que informa DP-016 pendente. Não há bundle, rota, dependência nativa ou publicação de aplicativo nesse pacote.

## Decisão necessária

Antes de criar uma implementação mobile separada, confirme plataforma, autenticação, sincronização offline, distribuição, notificações e escopo de paridade com a web. Registre a decisão em DP-016 e atualize este documento, o README do pacote e o pipeline de build.

## Regra de implementação

Não duplique regras de domínio no mobile. Reutilize `packages/types`, `packages/validation` e os contratos da API. Se a plataforma escolhida precisar de componentes específicos, mantenha a regra de negócio na API ou em pacote compartilhado.
