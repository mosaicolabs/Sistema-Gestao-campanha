import type { CreateDeliveryInput } from '@campanha/validation'
import { auditRepository } from '../repositories/audit.repository.js'
import { deliveryRepository } from '../repositories/delivery.repository.js'

export const deliveryService = {
  list: () => deliveryRepository.list(),

  async create(input: CreateDeliveryInput, userId: string) {
    const delivery = await deliveryRepository.create({
      destination: input.destination,
      origin: input.origin,
      address: input.address,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      notes: input.notes,
      ...(input.localityId ? { locality: { connect: { id: input.localityId } } } : {}),
      ...(input.responsibleUserId ? { responsible: { connect: { id: input.responsibleUserId } } } : {}),
      items: {
        create: input.items.map((item) => ({ material: { connect: { id: item.materialId } }, quantity: item.quantity })),
      },
    })
    await auditRepository.record({ userId, action: 'CREATE', entityType: 'Delivery', entityId: delivery.id, afterData: { destination: delivery.destination, address: delivery.address ?? null } })
    return delivery
  },
}
