---
meta:
  title: Aplicar os padrões do frontend
  navLabel: Padrões do frontend
  category: Engenharia
  contentType: Reference
goal: Criar telas React consistentes, acessíveis e responsivas.
audience: Desenvolvedores que trabalham em `apps/web`.
---

# Aplicar os padrões do frontend

O frontend usa React 19, Vite, TypeScript, Tailwind CSS v4 e componentes shadcn/ui. A experiência começa em telas pequenas e amplia para desktop sem esconder ações importantes atrás de hover.

## Rotas da aplicação

| Caminho | Tela | Escopo |
| --- | --- | --- |
| `/login` | Login | Pública |
| `/trocar-senha` | Troca inicial de senha | Sessão com troca pendente |
| `/` | Dashboard | Protegida |
| `/pessoas` | Cadastro único de pessoas | Protegida |
| `/cobertura` | Cobertura territorial | Protegida |
| `/tarefas` | Kanban | Protegida |
| `/agenda` | Agenda compartilhada | Protegida |
| `/entregas` | Entregas de materiais | Protegida |
| `/importacao` | Importação e conciliação | Protegida |
| `/auditoria` | Usuários e auditoria | Protegida |

## Estado e dados

Use TanStack Query para dados do servidor, cache, loading e erro. Use Zustand para estado de interface, como menu mobile e filtros que não precisam ser persistidos. Use Axios em `apps/web/src/lib/api.ts`; o interceptor anexa o JSON Web Token (JWT) e limpa a sessão quando recebe `401`.

## Formulários e validação

Use React Hook Form para controlar campos e `zodResolver` para aplicar os schemas de `packages/validation`. O mesmo schema deve validar a entrada da tela e o payload recebido pela API. Exiba mensagens próximas ao campo e preserve estados de envio, erro e sucesso.

Use `react-imask` para campos com máscara, como telefone. Não normalize o valor exibido de modo que o operador perca a informação original; a API armazena valor bruto e valor normalizado quando o domínio exige comparação.

## Componentes e ícones

Prefira componentes de `apps/web/src/components/ui` antes de criar variações locais. O projeto usa shadcn/ui sobre Radix e ícones Phosphor; mantenha a mesma biblioteca visual em uma tela. Tabelas longas usam TanStack Table quando precisam de ordenação ou paginação.

## Direção visual

Use os tokens de `packages/ui/src/index.ts` e as variáveis de `apps/web/src/index.css`. A base usa teal, creme, coral e amarelo, com campos claros, bordas suaves, controles em formato de pílula e sombras curtas. Preserve contraste, foco visível e uma densidade que permita leitura em campo.

A referência visual inicial é o [Design MD do Flip 7](https://designmd.ai/yiujc/flip7-card-game). Use-a para manter a linguagem de cartões, estados e ritmo visual; adapte os componentes ao domínio da campanha e aos tokens existentes antes de criar novos estilos.

## Movimento e acessibilidade

Use GSAP para entrada do shell e Motion para transições pontuais do Kanban. Toda animação deve respeitar `prefers-reduced-motion`, evitar deslocar conteúdo durante a leitura e usar transformações quando possível. Ações precisam funcionar por teclado, toque e leitor de tela; ícones decorativos recebem `aria-hidden`.

## Criar uma tela nova

Siga esta sequência:

1. Adicione a rota em `apps/web/src/App.tsx` com `lazy` para manter code splitting
2. Crie a feature dentro de uma pasta de domínio, como `apps/web/src/features/pessoas/`
3. Defina tipos de resposta em `apps/web/src/lib/types.ts` quando o contrato for reutilizado
4. Use `useQuery` e `useMutation` com chaves estáveis e invalidação após mutações
5. Inclua estados de carregamento, vazio, erro e sucesso
6. Teste a tela em largura mobile e desktop

## Cobertura com filtros e tabela

Na tela `/cobertura`, `CoverageFiltersBar` lê e escreve os filtros na query string e `CoverageTable` usa TanStack Table com sorting controlado pela API. Os parâmetros aceitos são `search`, `regionId`, `role`, `allianceId`, `aliasStatus`, `sortBy` e `sortDirection`; filtros de servidor devem entrar na chave do TanStack Query.

No desktop, a tabela mantém a cidade na primeira coluna durante o scroll e exibe todos os campos da linha macro. No mobile, cada cidade possui uma expansão semântica com os mesmos campos em pares de rótulo e valor. O detalhe por cidade continua em `CoverageCityDialog`, e `CoverageAllianceView` usa uma tabela agrupada por região e cidade.

Os cards agregados `Cidades na seleção`, `Relações articulador–cidade` e `Aliases em revisão` não fazem parte da UI da cobertura. Números por cidade continuam sendo dados operacionais e não devem ser removidos da tabela.
