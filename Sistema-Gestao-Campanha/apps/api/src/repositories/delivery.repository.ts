import { prisma, type Prisma } from '@campanha/database'

export const deliveryRepository = {
  list() {
    return prisma.delivery.findMany({
      include: { locality: true, responsible: { include: { person: true } }, items: { include: { material: true } } },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
    })
  },
  create(data: Prisma.DeliveryCreateInput) {
    return prisma.delivery.create({
      data,
      include: { locality: true, responsible: { include: { person: true } }, items: { include: { material: true } } },
    })
  },
}
