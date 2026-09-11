import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const permissionPairs = [
  ['dashboard', 'read'],
  ['people', 'read'],
  ['people', 'create'],
  ['people', 'update'],
  ['coverage', 'read'],
  ['tasks', 'read'],
  ['tasks', 'create'],
  ['tasks', 'update'],
  ['calendar', 'read'],
  ['calendar', 'create'],
  ['calendar', 'update'],
  ['deliveries', 'read'],
  ['deliveries', 'create'],
  ['deliveries', 'update'],
  ['imports', 'read'],
  ['imports', 'create'],
  ['imports', 'reconcile'],
  ['users', 'manage'],
  ['audit', 'read'],
] as const

const pendingDecisions = [
  ['DP-001', 'Destino dos quatro blocos de 37 linhas', 'Define se as 148 ocorrências geram vínculos, são corrigidas ou rejeitadas.'],
  ['DP-002', 'Fonte que prevalece após a revisão', 'Define como reconciliar 672 vs. 681 e 591 vs. 739.'],
  ['DP-003', 'Identidade e grafia de Levi Carnela ou Levi Carnella', 'Impede criar usuário ou pessoa com identidade não confirmada.'],
  ['DP-004', 'Significado de API do WhatsApp', 'Define viabilidade, fornecedor e arquitetura da possível integração.'],
  ['DP-005', 'Cardinalidade de papéis, localidades e dobradas', 'Define validações de atribuições e vínculos.'],
  ['DP-006', 'Titularidade dos campos de contato', 'Define se os telefones pertencem ao coordenador, liderança ou representante.'],
  ['DP-007', 'Correção de Paraty e Serfiotis', 'Define os valores publicados para liderança, região e contatos.'],
  ['DP-008', 'Significado de mapa e níveis territoriais', 'Define se haverá cartografia ou apenas visão territorial organizada.'],
  ['DP-009', 'Papéis RBAC e escopos', 'Define quem consulta, cadastra, altera, exclui e exporta.'],
  ['DP-010', 'Política de sessão e recuperação de acesso', 'Define refresh token, recuperação de senha, MFA e encerramento de sessões.'],
  ['DP-011', 'Acesso de Edson à agenda', 'Define consulta, edição, login, expiração e revogação do link.'],
  ['DP-012', 'Fluxo definitivo do Kanban', 'Define campos, status, responsáveis e visibilidade.'],
  ['DP-013', 'Escopo de materiais e entregas', 'Define solicitações, entregas, estoque e rotas.'],
  ['DP-014', 'Etapa e gatilhos de WhatsApp', 'Define destinatários e ações da agenda que geram alerta.'],
  ['DP-015', 'Finalidade e retenção do campo religião', 'Define se o dado sensível será migrado, visível ou removido.'],
  ['DP-016', 'Plataforma mobile', 'Define aplicativo nativo, PWA ou apenas web responsiva.'],
  ['DP-017', 'Biblioteca e indicadores de gráficos', 'Define os gráficos além dos indicadores de diagnóstico.'],
  ['DP-018', 'Prazo, usuários, orçamento e prioridade', 'Define capacidade, metas técnicas e sequência formal de módulos.'],
  ['DP-019', 'Continuidade da planilha e integração com Drive', 'Define sincronização e conflito de fonte após a migração.'],
  ['DP-020', 'Backup, retenção, exportação e exclusão', 'Define a política operacional dos dados.'],
  ['DP-021', 'Grafias de cidades e aliases canônicos', 'Define quais aproximações do relatório podem virar LocalityAlias ativo e qual rótulo será exibido.'],
] as const

const confirmedDecisionNotes = new Map<string, string>([
  ['DP-001', 'As 148 ocorrências dos quatro blocos serão preservadas como evidência.'],
  ['DP-002', 'Índices manuais e contagens observadas serão preservados separadamente.'],
  ['DP-005', 'Uma pessoa pode ter múltiplos papéis, cidades e vínculos conforme a origem.'],
  ['DP-007', 'As correções confirmadas podem ser materializadas sem apagar a grafia de origem.'],
  ['DP-015', 'Religião permanece somente em SourceOccurrence como evidência restrita.'],
  ['DP-021', 'Aliases seguros e nomes canônicos de cidades seguem a regra aprovada.'],
])

async function main() {
  const permissions = await Promise.all(
    permissionPairs.map(([resource, action]) =>
      prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      }),
    ),
  )

  const adminRole = await prisma.accessRole.upsert({
    where: { code: 'ADMIN' },
    update: { name: 'Administrador' },
    create: {
      code: 'ADMIN',
      name: 'Administrador',
      description: 'Acesso local completo para configurar e revisar o MVP.',
    },
  })

  await Promise.all(
    permissions.map((permission) =>
      prisma.accessRolePermission.upsert({
        where: {
          accessRoleId_permissionId: {
            accessRoleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { accessRoleId: adminRole.id, permissionId: permission.id },
      }),
    ),
  )

  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'TroqueAgora@2026', 12)
  const admin = await prisma.user.upsert({
    where: { username: process.env.SEED_ADMIN_USERNAME ?? 'admin' },
    update: {},
    create: {
      username: process.env.SEED_ADMIN_USERNAME ?? 'admin',
      passwordHash,
      mustChangePassword: true,
    },
  })

  await prisma.userAccessRole.upsert({
    where: {
      userId_accessRoleId_scopeType: {
        userId: admin.id,
        accessRoleId: adminRole.id,
        scopeType: 'GLOBAL',
      },
    },
    update: {},
    create: { userId: admin.id, accessRoleId: adminRole.id, scopeType: 'GLOBAL' },
  })

  const rio = await prisma.locality.upsert({
    where: { canonicalName_type: { canonicalName: 'RIO DE JANEIRO', type: 'STATE' } },
    update: {},
    create: { name: 'Rio de Janeiro', canonicalName: 'RIO DE JANEIRO', type: 'STATE' },
  })

  const regions = [
    'Costa Verde',
    'Sul Fluminense',
    'Metropolitana',
    'Noroeste Fluminense',
    'Norte Fluminense',
    'Região dos Lagos',
    'Serrana',
    'Centro Sul',
  ]

  const regionByName = new Map<string, string>()
  for (const name of regions) {
    const region = await prisma.locality.upsert({
      where: { canonicalName_type: { canonicalName: name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(), type: 'REGION' } },
      update: { parentId: rio.id },
      create: {
        name,
        canonicalName: name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(),
        type: 'REGION',
        parentId: rio.id,
      },
    })
    regionByName.set(name, region.id)
  }

  const citiesByRegion: Record<string, string[]> = {
    'Costa Verde': ['Angra dos Reis', 'Itaguaí', 'Paraty'],
    'Sul Fluminense': ['Barra do Piraí', 'Barra Mansa', 'Lídice', 'Pinheiral', 'Piraí', 'Porto Real', 'Quatis', 'Resende', 'Rio Claro', 'Valença', 'Volta Redonda'],
    Metropolitana: ['Belford Roxo', 'Duque de Caxias', 'Guapimirim', 'Japeri', 'Magé', 'Maricá', 'Mesquita', 'Nilópolis', 'Niterói', 'Nova Iguaçu', 'Paracambi', 'Queimados', 'Rio de Janeiro', 'São Gonçalo', 'São João de Meriti'],
    'Norte Fluminense': ['Campos dos Goytacazes', 'Macaé', 'São Francisco de Itabapoana'],
    'Região dos Lagos': ['Araruama', 'Cabo Frio', 'Casemiro de Abreu', 'Iguaba Grande', 'Rio das Ostras', 'São Pedro da Aldeia'],
    Serrana: ['Cachoeiras de Macacu', 'Carmo', 'Nova Friburgo', 'Petrópolis', 'São José do Vale do Rio Preto', 'Teresópolis'],
    'Centro Sul': ['Areal', 'Comendador Levy Gasparian', 'Engenheiro Paulo de Frontin', 'Mendes', 'Miguel Pereira', 'Paraíba do Sul', 'Paty do Alferes', 'Sapucaia', 'Três Rios', 'Vassouras'],
  }

  for (const [regionName, cities] of Object.entries(citiesByRegion)) {
    for (const name of cities) {
      const canonicalName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
      await prisma.locality.upsert({
        where: { canonicalName_type: { canonicalName, type: 'CITY' } },
        update: { parentId: regionByName.get(regionName) },
        create: { name, canonicalName, type: 'CITY', parentId: regionByName.get(regionName) },
      })
    }
  }

  for (const [code, name] of [
    ['ARTICULATOR', 'Articulador'],
    ['COORDINATOR', 'Coordenador'],
    ['LEADERSHIP', 'Liderança'],
  ] as const) {
    await prisma.businessRole.upsert({ where: { code }, update: { name }, create: { code, name } })
  }

  for (const [id, title, impact] of pendingDecisions) {
    const confirmedNote = confirmedDecisionNotes.get(id)
    await prisma.productDecision.upsert({
      where: { id },
      update: {
        title,
        impact,
        status: confirmedNote ? 'CONFIRMED' : 'PENDING',
        notes: confirmedNote,
        decidedBy: confirmedNote ? 'gestor' : null,
      },
      create: {
        id,
        title,
        impact,
        source: 'PRD seção 9',
        status: confirmedNote ? 'CONFIRMED' : 'PENDING',
        notes: confirmedNote,
        decidedBy: confirmedNote ? 'gestor' : null,
      },
    })
  }

  const diagnosticBatch = await prisma.importBatch.upsert({
    where: { fileHash: 'a04f4117cb5fcf07cb2f5bd4a8cdefd17fe58ef2c0bfcd06afc487b1ea9534f0' },
    update: {
      semanticHash: 'd83aa3b24bf2bef09166f632f7463950a1ce6749f6b0c5cf724e9f30f568b5e1',
      parserVersion: 'campaign-v2',
    },
    create: {
      filename: 'Campanha_EA_2026_REV-006.xlsx',
      fileHash: 'a04f4117cb5fcf07cb2f5bd4a8cdefd17fe58ef2c0bfcd06afc487b1ea9534f0',
      semanticHash: 'd83aa3b24bf2bef09166f632f7463950a1ce6749f6b0c5cf724e9f30f568b5e1',
      parserVersion: 'campaign-v2',
      status: 'REVIEW_REQUIRED',
      materializationStatus: 'NOT_STARTED',
      workbookTabs: 80,
      territorialOccurrences: 681,
      allianceOccurrences: 739,
      manualTerritorialIndex: 672,
      manualAllianceIndex: 591,
      createdById: admin.id,
      finishedAt: new Date(),
    },
  })

  await prisma.importArtifact.upsert({
    where: { fileHash: diagnosticBatch.fileHash },
    update: {
      importBatchId: diagnosticBatch.id,
      filename: diagnosticBatch.filename,
    },
    create: {
      importBatchId: diagnosticBatch.id,
      filename: diagnosticBatch.filename,
      fileHash: diagnosticBatch.fileHash,
    },
  })

  const issueSeeds = [
    ['DUPLICATE_BLOCK', 'CRITICAL', '148 linhas de dobradas aguardam decisão', { affectedRows: 148, blockSize: 37, sourceSheet: 'Vinicius Farah', repeatedIn: ['Marta Rocha', 'Sostenes', 'Abraão', 'Luciano Vieira'] }],
    ['COUNT_MISMATCH', 'WARNING', 'Índice territorial 672 versus 681 linhas', { manual: 672, actual: 681, difference: 9 }],
    ['COUNT_MISMATCH', 'CRITICAL', 'Índice de dobradas 591 versus 739 linhas', { manual: 591, actual: 739, difference: 148 }],
    ['DUPLICATE_RECORD', 'WARNING', 'Par repetido em Wellington José', { range: 'Wellington José!A11:H12', pairs: 1 }],
    ['DUPLICATE_CANDIDATE', 'WARNING', 'Candidatos por liderança e localidade', { candidatePairs: 13 }],
    ['REPEATED_PHONE', 'WARNING', 'Telefones repetidos entre linhas territoriais', { groups: 5, affectedRows: 11 }],
    ['SHIFTED_FIELDS', 'CRITICAL', 'Campos possivelmente deslocados em Paraty', { affectedRows: 4 }],
    ['SHIFTED_FIELDS', 'WARNING', 'Divergência de campos em Serfiotis e Barra do Piraí', { sheets: ['Serfiotis', 'Barra do Piraí'] }],
    ['MISSING_FIELD', 'WARNING', 'Liderança não identificada no Rio de Janeiro', { range: 'Rio de Janeiro!A94:H94' }],
    ['LOCALITY_ALIAS', 'INFO', 'Grafias de localidade aguardam normalização', { unmatchedOccurrences: 8 }],
    ['BROKEN_LINK', 'INFO', 'Hiperlink quebrado preservado como evidência', { cell: 'Mendes!I2' }],
  ] as const

  if ((await prisma.importIssue.count({ where: { importBatchId: diagnosticBatch.id } })) === 0) {
    for (const [type, severity, title, details] of issueSeeds) {
      await prisma.importIssue.create({
        data: { importBatchId: diagnosticBatch.id, type, severity, title, details },
      })
    }
  }

  if (
    (await prisma.sourceOccurrence.count({ where: { importBatchId: diagnosticBatch.id } })) === 0
    && (await prisma.importIssue.count({
      where: {
        importBatchId: diagnosticBatch.id,
        title: 'Ocorrências de origem ainda não persistidas',
      },
    })) === 0
  ) {
    await prisma.importIssue.create({
      data: {
        importBatchId: diagnosticBatch.id,
        type: 'OTHER',
        severity: 'WARNING',
        title: 'Ocorrências de origem ainda não persistidas',
        details: {
          expectedTerritorialOccurrences: diagnosticBatch.territorialOccurrences,
          expectedAllianceOccurrences: diagnosticBatch.allianceOccurrences,
          persistedOccurrences: 0,
        },
      },
    })
  }

  const board = await prisma.kanbanBoard.upsert({
    where: { id: 'campaign-main-board' },
    update: {},
    create: { id: 'campaign-main-board', name: 'Pendências da campanha' },
  })

  const columnDefinitions = [
    ['campaign-todo', 'A fazer', 0, false],
    ['campaign-doing', 'Em andamento', 1, false],
    ['campaign-done', 'Concluído', 2, true],
  ] as const

  for (const [id, name, position, isTerminal] of columnDefinitions) {
    await prisma.kanbanColumn.upsert({
      where: { id },
      update: { name, position, isTerminal },
      create: { id, boardId: board.id, name, position, isTerminal },
    })
  }

  if ((await prisma.task.count({ where: { boardId: board.id } })) === 0) {
    await prisma.task.createMany({
      data: [
        { boardId: board.id, columnId: 'campaign-todo', title: 'Validar destino das 148 linhas repetidas', priority: 'URGENT', createdById: admin.id, position: 0 },
        { boardId: board.id, columnId: 'campaign-todo', title: 'Confirmar estrutura territorial do mapa', priority: 'HIGH', createdById: admin.id, position: 1 },
        { boardId: board.id, columnId: 'campaign-doing', title: 'Revisar campos de Paraty e Serfiotis', priority: 'HIGH', createdById: admin.id, position: 0 },
      ],
    })
  }

  for (const [name, unit] of [['Santinho', 'unidade'], ['Adesivo', 'unidade'], ['Faixa', 'unidade']] as const) {
    await prisma.material.upsert({ where: { name }, update: {}, create: { name, unit } })
  }

  console.log(`Seed concluído. Usuário local: ${admin.username}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
