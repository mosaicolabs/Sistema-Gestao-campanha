import { prisma, type ImportCategory, type IssueSeverity, type IssueType, type Prisma } from '@campanha/database'

export const importRepository = {
  findByHash(fileHash: string) {
    return prisma.importBatch.findUnique({ where: { fileHash }, include: { issues: true, _count: { select: { occurrences: true } } } })
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
      prisma.importBatch.update({ where: { id }, data: { status: 'PROCESSING' } }),
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
