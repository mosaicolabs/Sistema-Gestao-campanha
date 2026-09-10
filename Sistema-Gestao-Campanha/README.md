# Sistema de Gestao da Campanha

MVP executavel do PRD `PRD_sistema_gestao_campanha.md`. O sistema concentra pessoas, papeis, localidades, contatos e dobradas em um cadastro unico e adiciona os modulos operacionais de tarefas, agenda, entregas, importacao e auditoria.

## Estrutura

```text
apps/web       React + Vite, mobile-first
apps/api       Node.js + Express em camadas
apps/mobile    reserva arquitetural; plataforma depende da DP-016
packages/database   PostgreSQL + Prisma
packages/validation schemas Zod compartilhados
packages/types      contratos TypeScript
packages/ui         tokens visuais compartilhados
```

## Rodar com Docker

O `docker-compose.yml` sobe os três componentes do sistema com nomes fixos:

```text
SistemaCampanha_Web       http://localhost:8080
SistemaCampanha_Api       http://localhost:3333/api
SistemaCampanha_Postgree  PostgreSQL em localhost:5432
```

Para construir as imagens, aplicar as migrations e executar o seed inicial:

```bash
docker compose up --build
```

O seed é idempotente. O primeiro acesso usa `SEED_ADMIN_USERNAME` e `SEED_ADMIN_PASSWORD` definidos no ambiente e exige troca de senha.

Se o frontend for publicado em outro endereço, ajuste `VITE_API_URL` (valor embutido na imagem web) e `DOCKER_CORS_ORIGIN` antes do build.

Para desligar a aplicação sem apagar os dados do PostgreSQL:

```bash
docker compose down
```

## Rodar localmente

1. Copie `.env.example` para `.env`.
2. Inicie apenas o PostgreSQL: `docker compose up -d postgres`.
3. Instale as dependencias: `npm install`.
4. Gere o Prisma Client: `npm run db:generate`.
5. Aplique a migracao: `npm run db:migrate`.
6. Carregue os dados iniciais: `npm run db:seed`.
7. Inicie API e web: `npm run dev`.

A interface abre em `http://localhost:5173` e a API em `http://localhost:3333/api`. A documentacao HTTP fica em `http://localhost:3333/api/docs`.

O seed local usa `admin` e a senha definida em `SEED_ADMIN_PASSWORD`. O primeiro acesso exige uma nova senha, conforme o PRD.

## O que esta implementado

- Login JWT de 15 minutos, bcrypt, troca obrigatoria no primeiro acesso e RBAC na API.
- Cadastro unico de pessoas, contatos, papeis de atuacao, localidades e vinculos de dobrada.
- Cobertura territorial com distincao entre informacao ausente e ausencia confirmada.
- Kanban com criacao e movimentacao persistida.
- Agenda compartilhada com controle otimista de versao.
- Entregas de materiais sem prometer estoque ou otimizacao de rotas.
- Importacao `.xlsx`, hash de idempotencia, ocorrencias de origem e fila de revisao.
- Painel separado para as decisoes pendentes, incluindo as 148 linhas e os indices 672/591 versus 681/739.
- Estados de carregamento, vazio e erro; layout mobile-first; TanStack Query, Zustand, Axios, React Hook Form, Zod, TanStack Table, Recharts, shadcn/ui, Motion e GSAP.

## Decisoes mantidas em aberto

O sistema nao decide automaticamente os itens DP-001 a DP-020. A integracao com WhatsApp aparece apenas como possibilidade desativada. `apps/mobile` permanece documentado sem escolher PWA ou aplicativo nativo. O campo religiao nao participa de filtros nem classificacoes.

## Verificacao

```bash
npm run typecheck
npm test
npm run build
```
