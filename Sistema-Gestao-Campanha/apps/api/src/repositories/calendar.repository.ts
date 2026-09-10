import { prisma, type Prisma } from '@campanha/database'

export const calendarRepository = {
  list(from?: Date, to?: Date) {
    return prisma.calendarEvent.findMany({
      where: {
        ...(from || to ? { startsAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: { locality: true, createdBy: { select: { username: true } } },
      orderBy: { startsAt: 'asc' },
    })
  },
  create(data: Prisma.CalendarEventCreateInput) {
    return prisma.calendarEvent.create({ data, include: { locality: true } })
  },
  getById(id: string) {
    return prisma.calendarEvent.findUnique({ where: { id } })
  },
  async updateVersioned(id: string, version: number, data: Prisma.CalendarEventUncheckedUpdateManyInput) {
    const result = await prisma.calendarEvent.updateMany({ where: { id, version }, data: { ...data, version: { increment: 1 } } })
    if (result.count === 0) return null
    return prisma.calendarEvent.findUnique({ where: { id }, include: { locality: true } })
  },
}
