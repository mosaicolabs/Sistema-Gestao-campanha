---
meta:
  title: Documentação do Sistema de Gestão da Campanha
  navLabel: Documentação
  category: Projeto
  contentType: Reference
goal: Encontrar a orientação certa para executar, alterar e operar o projeto.
audience: Pessoas que desenvolvem, revisam, operam ou administram o sistema.
---

# Documentação do Sistema de Gestão da Campanha

Este índice apresenta a documentação do monorepo `Sistema-Gestao-Campanha`. O projeto entrega uma aplicação web responsiva, uma API e um banco PostgreSQL; o pacote mobile permanece reservado enquanto a decisão DP-016 estiver pendente.

## Comece pelo seu objetivo

| Você quer… | Leia |
| --- | --- |
| Entender o produto e os limites atuais | [Visão geral](visao-geral.md) |
| Conhecer a arquitetura e as regras de dependência | [Arquitetura](arquitetura.md) |
| Rodar tudo com Docker | [Docker](docker.md) |
| Rodar o monorepo localmente | [Configurar o ambiente](configurar-ambiente.md) |
| Criar uma tela ou alterar o frontend | [Padrões do frontend](frontend.md) |
| Criar ou consumir uma rota HTTP | [Referência da API](api.md) |
| Alterar tabelas ou executar Prisma | [Dados e banco](dados-e-prisma.md) |
| Importar ou revisar a planilha | [Importação e conciliação](importacao-e-conciliacao.md) |
| Normalizar cidades e consultar a visão macro | [Normalização de localidades](normalizacao-de-localidades.md) |
| Consultar o estado atual e retomar o trabalho | [PROGRESS](PROGRESS.MD) |
| Entender login, permissões e auditoria | [Autenticação e RBAC](autenticacao-e-rbac.md) |
| Aplicar controles de segurança | [Segurança](seguranca.md) |
| Executar verificações antes de entregar | [Testes e qualidade](testes-e-qualidade.md) |
| Diagnosticar falhas de ambiente | [Operação e troubleshooting](operacao-e-troubleshooting.md) |
| Contribuir sem quebrar os contratos | [Contribuição](contribuicao.md) |
| Saber o que ainda depende do gestor | [Decisões pendentes](decisoes-pendentes.md) |
| Entender o estado do pacote mobile | [Mobile](mobile.md) |
| Executar os fluxos da operação | [Fluxos operacionais](fluxos-operacionais.md) |
| Escolher um agente de IA para a tarefa | [Índice dos agentes](../agents/README.md) |

## Classificação do projeto

| Campo | Valor |
| --- | --- |
| Tecnologia principal | TypeScript |
| Tipo | WEB + API |
| Interface | React + Vite, mobile-first |
| Backend | Node.js + Express |
| Persistência | PostgreSQL + Prisma |
| Organização | Monorepo com npm workspaces |
| Execução completa | Docker Compose |

## Como ler esta documentação

Cada página declara seu tipo de conteúdo e seu objetivo no frontmatter. A página de referência descreve o comportamento implementado; a página de troubleshooting descreve sintomas, diagnóstico e correção. Quando uma decisão não foi confirmada, a documentação aponta o identificador DP correspondente.

## Fonte de verdade

O código em `apps/` e `packages/` define o comportamento executável. O [documento de requisitos do produto (PRD)](../../PRD_sistema_gestao_campanha.md) define o escopo, enquanto `analise/` preserva o diagnóstico da planilha e do áudio. Este diretório explica como trabalhar com a implementação sem substituir essas fontes.

## Checklist de primeira leitura

- Leia a [visão geral](visao-geral.md) para conhecer os limites do MVP
- Suba a stack seguindo [Docker](docker.md) ou [Configurar o ambiente](configurar-ambiente.md)
- Consulte [Autenticação e RBAC](autenticacao-e-rbac.md) antes de criar uma rota protegida
- Consulte [Dados e banco](dados-e-prisma.md) antes de alterar o schema
- Escolha o agente adequado no [índice dos agentes](../agents/README.md) quando dividir uma tarefa por disciplina
- Rode o [checklist de qualidade](testes-e-qualidade.md) antes de entregar uma mudança
