import { prisma } from '@campanha/database'

export const importMaterializationRepository = {
  findBatch(batchId: string) {
    return prisma.importBatch.findUnique({ where: { id: batchId } })
  },
  listOccurrences(batchId: string) {
    return prisma.sourceOccurrence.findMany({
      where: { importBatchId: batchId },
      select: { id: true, sheetName: true, rowNumber: true, category: true, rawValues: true, normalizedValues: true },
      orderBy: [{ sheetName: 'asc' }, { rowNumber: 'asc' }],
    })
  },
}
