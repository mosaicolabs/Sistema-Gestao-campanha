import { prisma, type Prisma } from '@campanha/database'

export const auditRepository = {
  record(data: {
    userId?: string
    action: string
    entityType: string
    entityId: string
    beforeData?: Prisma.InputJsonValue
    afterData?: Prisma.InputJsonValue
  }) {
    return prisma.auditLog.create({ data })
  },
  list() {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { username: true } } },
    })
  },
}
