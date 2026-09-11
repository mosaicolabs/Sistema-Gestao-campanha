import { prisma, type ImportCategory, type IssueSeverity, type IssueType, type Prisma } from '@campanha/database'

export const importRepository = {
  findByHash(fileHash: string) {
    return prisma.importBatch.findUnique({ where: { fileHash }, include: { issues: true, _count: { select: { occurrences: true } } } })
  },
  findBySemanticHash(semanticHash: string) {
    return prisma.importBatch.findUnique({ where: { semanticHash }, include: { issues: true, _count: { select: { occurrences: true } } } })
  },
  createArtifact(data: { importBatchId: string; filename: string; fileHash: string }) {
    return prisma.importArtifact.upsert({ where: { fileHash: data.fileHash }, update: { importBatchId: data.importBatchId, filename: data.filename }, create: data })
  },
  createBatch(data: Prisma.ImportBatchCreateInput) {
    return prisma.importBatch.create({ data })
  },
  createOccurrences(
    rows: Array<{
      importBatchId: string
      sheetName: string
      rowNumber: number
      category: ImportCategory
      rawValues: Prisma.InputJsonValue
      normalizedValues: Prisma.InputJsonValue
      rowHash: string
    }>,
  ) {
    return prisma.sourceOccurrence.createMany({ data: rows, skipDuplicates: true })
  },
  createIndexControls(importBatchId: string, controls: Array<{
    scope: 'TERRITORIAL_TOTAL' | 'REGION' | 'CITY' | 'ALLIANCE_TOTAL' | 'ALLIANCE'
    sourceSheet: string
    sourceCell: string
    sourceLabel: string
    normalizedKey: string
    manualCount: number
  }>) {
    return prisma.importIndexControl.createMany({ data: controls.map((control) => ({ ...control, importBatchId })), skipDuplicates: true })
  },
  async updateIndexControlObservations(importBatchId: string, analysis: {
    territorialOccurrences: number
    allianceOccurrences: number
    occurrences: Array<{ sheetName: string; category: ImportCategory; rawValues: unknown }>
  }) {
    const controls = await prisma.importIndexControl.findMany({ where: { importBatchId } })
    const cities = await prisma.locality.findMany({
      where: { type: 'CITY', status: { not: 'INACTIVE' } },
      select: { canonicalName: true, parent: { select: { canonicalName: true } } },
    })
    const territorialByCity = new Map<string, number>()
    const allianceBySheet = new Map<string, number>()
    for (const occurrence of analysis.occurrences) {
      if (occurrence.category === 'TERRITORIAL') {
        const key = String(occurrence.sheetName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
        territorialByCity.set(key, (territorialByCity.get(key) ?? 0) + 1)
      }
      if (occurrence.category === 'ALLIANCE') {
        const key = String(occurrence.sheetName).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
        allianceBySheet.set(key, (allianceBySheet.get(key) ?? 0) + 1)
      }
    }
    const regionTotals = new Map<string, number>()
    for (const city of cities) {
      const count = territorialByCity.get(city.canonicalName) ?? 0
      if (city.parent?.canonicalName) regionTotals.set(city.parent.canonicalName, (regionTotals.get(city.parent.canonicalName) ?? 0) + count)
    }
    await prisma.$transaction(
      controls.map((control) => {
        let observedCount: number
        if (control.scope === 'TERRITORIAL_TOTAL') observedCount = analysis.territorialOccurrences
        else if (control.scope === 'ALLIANCE_TOTAL') observedCount = analysis.allianceOccurrences
        else if (control.scope === 'REGION') observedCount = regionTotals.get(control.normalizedKey) ?? 0
        else if (control.scope === 'CITY') observedCount = territorialByCity.get(control.normalizedKey) ?? 0
        else observedCount = allianceBySheet.get(control.normalizedKey) ?? 0
        return prisma.importIndexControl.update({ where: { id: control.id }, data: { observedCount, difference: observedCount - control.manualCount } })
      }),
    )
  },
  createIssue(data: {
    importBatchId: string
    occurrenceId?: string
    type: IssueType
    severity: IssueSeverity
    title: string
    details: Prisma.InputJsonValue
  }) {
    return prisma.importIssue.create({ data })
  },
  updateBatch(id: string, data: Prisma.ImportBatchUpdateInput) {
    return prisma.importBatch.update({ where: { id }, data })
  },
  async resetBatch(id: string) {
    await prisma.$transaction([
      prisma.reconciliationDecision.deleteMany({ where: { issue: { importBatchId: id } } }),
      prisma.importIssue.deleteMany({ where: { importBatchId: id } }),
      prisma.sourceOccurrence.deleteMany({ where: { importBatchId: id } }),
      prisma.importIndexControl.deleteMany({ where: { importBatchId: id } }),
      prisma.importBatch.update({ where: { id }, data: { status: 'PROCESSING', materializationStatus: 'NOT_STARTED', materializedAt: null, materializationError: null } }),
    ])
  },
  listBatches() {
    return prisma.importBatch.findMany({
      include: { _count: { select: { issues: true, occurrences: true } } },
      orderBy: { createdAt: 'desc' },
    })
  },
  listIssues(status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED') {
    return prisma.importIssue.findMany({
      where: status ? { status } : undefined,
      include: {
        importBatch: { select: { filename: true } },
        occurrence: true,
        decisions: { include: { decidedBy: { select: { username: true } } }, orderBy: { decidedAt: 'desc' } },
      },
      orderBy: [{ status: 'asc' }, { severity: 'asc' }, { createdAt: 'desc' }],
    })
  },
  getIssue(id: string) {
    return prisma.importIssue.findUnique({ where: { id } })
  },
  decideIssue(issueId: string, userId: string, data: { decision: 'KEEP' | 'REJECT' | 'MERGE' | 'SPLIT' | 'CORRECT'; reason: string; targetEntityType?: string; targetEntityId?: string }) {
    return prisma.$transaction(async (tx) => {
      const decision = await tx.reconciliationDecision.create({
        data: { issueId, decidedById: userId, ...data },
      })
      await tx.importIssue.update({ where: { id: issueId }, data: { status: 'RESOLVED' } })
      return decision
    })
  },
  listDecisions() {
    return prisma.productDecision.findMany({ orderBy: { id: 'asc' } })
  },
}
