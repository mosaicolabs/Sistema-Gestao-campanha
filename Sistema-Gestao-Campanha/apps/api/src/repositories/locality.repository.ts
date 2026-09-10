import { prisma, type Prisma } from '@campanha/database'

export type LocalityCityRecord = {
  id: string
  name: string
  canonicalName: string
  type: 'CITY'
  parentId: string | null
}

export type LocalityAliasRecord = {
  id: string
  localityId: string
  value: string
  valueNormalized: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'
}

export type LocalityOccurrenceRecord = {
  id: string
  sheetName: string
  rowNumber: number
  category: string
  rawValues: unknown
  normalizedValues: unknown
  rowHash: string
}

export type LocalityIssueRecord = {
  id: string
  importBatchId: string
  occurrenceId: string | null
  type: string
  status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'
  details: unknown
  occurrence?: LocalityOccurrenceRecord | null
}

export type LocalityRepository = {
  listCities(): Promise<LocalityCityRecord[]>
  listActiveAliases(): Promise<LocalityAliasRecord[]>
  listOccurrences(batchId: string): Promise<LocalityOccurrenceRecord[]>
  listOpenLocalityIssues(batchId: string): Promise<LocalityIssueRecord[]>
  getIssue(issueId: string): Promise<LocalityIssueRecord | null>
  getCity(localityId: string): Promise<LocalityCityRecord | null>
  createAlias(data: {
    localityId: string
    value: string
    valueNormalized: string
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'
    sourceOccurrenceId?: string
  }): Promise<LocalityAliasRecord & { created: boolean }>
  createIssue(data: { importBatchId: string; occurrenceId?: string; title: string; details: Prisma.InputJsonValue }): Promise<LocalityIssueRecord>
  createEntitySource(data: { entityType: string; entityId: string; occurrenceId: string; fieldMapping?: Prisma.InputJsonValue }): Promise<{ id: string; created: boolean }>
  createDecision(data: {
    issueId: string
    decision: 'KEEP' | 'REJECT' | 'MERGE' | 'SPLIT' | 'CORRECT'
    targetEntityType?: string
    targetEntityId?: string
    reason: string
    decidedById: string
  }): Promise<unknown>
  updateIssue(issueId: string, status: 'RESOLVED' | 'DISMISSED'): Promise<unknown>
  recordAudit(data: {
    userId?: string
    action: string
    entityType: string
    entityId: string
    beforeData?: Prisma.InputJsonValue
    afterData?: Prisma.InputJsonValue
  }): Promise<unknown>
  transaction<T>(callback: (repository: LocalityRepository) => Promise<T>): Promise<T>
}

type DbClient = typeof prisma | Prisma.TransactionClient

/**
 * Persistence for locality normalization. Keeping the client injectable makes
 * the service testable without a PostgreSQL connection while the production
 * repository still wraps each mutation in a Prisma transaction.
 */
export function createLocalityRepository(client: DbClient = prisma): LocalityRepository {
  const db = client as any

  return {
    listCities: async (): Promise<LocalityCityRecord[]> =>
      db.locality.findMany({
        where: { type: 'CITY', status: { not: 'INACTIVE' } },
        select: { id: true, name: true, canonicalName: true, type: true, parentId: true },
        orderBy: { name: 'asc' },
      }),

    listActiveAliases: async (): Promise<LocalityAliasRecord[]> =>
      db.localityAlias.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, localityId: true, value: true, valueNormalized: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),

    listOccurrences: async (batchId: string): Promise<LocalityOccurrenceRecord[]> =>
      db.sourceOccurrence.findMany({
        where: { importBatchId: batchId },
        select: { id: true, sheetName: true, rowNumber: true, category: true, rawValues: true, normalizedValues: true, rowHash: true },
        orderBy: [{ sheetName: 'asc' }, { rowNumber: 'asc' }],
      }),

    listOpenLocalityIssues: async (batchId: string): Promise<LocalityIssueRecord[]> =>
      db.importIssue.findMany({
        where: { importBatchId: batchId, type: 'LOCALITY_ALIAS', status: { in: ['OPEN', 'REVIEWING'] } },
        select: {
          id: true,
          importBatchId: true,
          occurrenceId: true,
          type: true,
          status: true,
          details: true,
          occurrence: {
            select: { id: true, sheetName: true, rowNumber: true, category: true, rawValues: true, normalizedValues: true, rowHash: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),

    getIssue: async (issueId: string): Promise<LocalityIssueRecord | null> =>
      db.importIssue.findUnique({
        where: { id: issueId },
        select: {
          id: true,
          importBatchId: true,
          occurrenceId: true,
          type: true,
          status: true,
          details: true,
          occurrence: {
            select: { id: true, sheetName: true, rowNumber: true, category: true, rawValues: true, normalizedValues: true, rowHash: true },
          },
        },
      }),

    getCity: async (localityId: string): Promise<LocalityCityRecord | null> =>
      db.locality.findFirst({
        where: { id: localityId, type: 'CITY', status: { not: 'INACTIVE' } },
        select: { id: true, name: true, canonicalName: true, type: true, parentId: true },
      }),

    createAlias: async (data: {
      localityId: string
      value: string
      valueNormalized: string
      status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'
      sourceOccurrenceId?: string
    }) => {
      const existing = await db.localityAlias.findUnique({
        where: { localityId_valueNormalized: { localityId: data.localityId, valueNormalized: data.valueNormalized } },
      })
      if (existing) {
        const updated = data.status === 'ACTIVE' && existing.status !== 'ACTIVE'
          ? await db.localityAlias.update({ where: { id: existing.id }, data: { status: 'ACTIVE' } })
          : existing
        return { ...updated, created: false }
      }
      return { ...(await db.localityAlias.create({ data })), created: true }
    },

    createIssue: async (data: {
      importBatchId: string
      occurrenceId?: string
      title: string
      details: Prisma.InputJsonValue
    }) =>
      db.importIssue.create({
        data: {
          importBatchId: data.importBatchId,
          occurrenceId: data.occurrenceId,
          type: 'LOCALITY_ALIAS',
          severity: 'WARNING',
          title: data.title,
          details: data.details,
        },
      }),

    createEntitySource: async (data: { entityType: string; entityId: string; occurrenceId: string; fieldMapping?: Prisma.InputJsonValue }) => {
      const existing = await db.entitySource.findUnique({ where: { entityType_entityId_occurrenceId: { entityType: data.entityType, entityId: data.entityId, occurrenceId: data.occurrenceId } } })
      if (existing) return { ...existing, created: false }
      return { ...(await db.entitySource.create({ data })), created: true }
    },

    createDecision: async (data: {
      issueId: string
      decision: 'KEEP' | 'REJECT' | 'MERGE' | 'SPLIT' | 'CORRECT'
      targetEntityType?: string
      targetEntityId?: string
      reason: string
      decidedById: string
    }) => db.reconciliationDecision.create({ data }),

    updateIssue: async (issueId: string, status: 'RESOLVED' | 'DISMISSED') =>
      db.importIssue.update({ where: { id: issueId }, data: { status } }),

    recordAudit: async (data: {
      userId?: string
      action: string
      entityType: string
      entityId: string
      beforeData?: Prisma.InputJsonValue
      afterData?: Prisma.InputJsonValue
    }) => db.auditLog.create({ data }),

    transaction: async <T>(callback: (repository: LocalityRepository) => Promise<T>): Promise<T> => {
      if (client !== prisma) return callback(createLocalityRepository(client))
      return prisma.$transaction((tx) => callback(createLocalityRepository(tx)))
    },
  }
}

export const localityRepository = createLocalityRepository()
