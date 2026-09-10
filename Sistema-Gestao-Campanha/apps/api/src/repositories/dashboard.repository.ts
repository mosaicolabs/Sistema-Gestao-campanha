import { prisma } from '@campanha/database'

export const dashboardRepository = {
  async snapshot() {
    const [people, assignments, alliances, openIssues, tasks, nextEvents, lastBatch, localitiesMissingCoverage] =
      await Promise.all([
        prisma.person.count(),
        prisma.personAssignment.count({ where: { status: 'ACTIVE' } }),
        prisma.personAlliance.count({ where: { status: 'ACTIVE' } }),
        prisma.importIssue.count({ where: { status: { in: ['OPEN', 'REVIEWING'] } } }),
        prisma.task.count({ where: { column: { isTerminal: false } } }),
        prisma.calendarEvent.findMany({
          where: { startsAt: { gte: new Date() }, status: 'SCHEDULED' },
          orderBy: { startsAt: 'asc' },
          take: 4,
          include: { locality: true },
        }),
        prisma.importBatch.findFirst({ orderBy: { createdAt: 'desc' } }),
        prisma.locality.count({
          where: {
            type: 'CITY',
            OR: [
              { assignments: { none: { businessRole: { code: 'COORDINATOR' } } } },
              { assignments: { none: { businessRole: { code: 'LEADERSHIP' } } } },
            ],
          },
        }),
      ])

    return { people, assignments, alliances, openIssues, tasks, nextEvents, lastBatch, localitiesMissingCoverage }
  },
}
