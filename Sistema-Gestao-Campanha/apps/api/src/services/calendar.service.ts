import type { CreateEventInput } from '@campanha/validation'
import { auditRepository } from '../repositories/audit.repository.js'
import { calendarRepository } from '../repositories/calendar.repository.js'
import { AppError } from '../utils/app-error.js'

export const calendarService = {
  list(from?: string, to?: string) {
    return calendarRepository.list(from ? new Date(from) : undefined, to ? new Date(to) : undefined)
  },

  async create(input: CreateEventInput, userId: string) {
    const event = await calendarRepository.create({
      title: input.title,
      description: input.description,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      timezone: input.timezone,
      address: input.address,
      visibility: input.visibility,
      createdBy: { connect: { id: userId } },
      ...(input.localityId ? { locality: { connect: { id: input.localityId } } } : {}),
    })
    await auditRepository.record({ userId, action: 'CREATE', entityType: 'CalendarEvent', entityId: event.id, afterData: { title: event.title, startsAt: event.startsAt.toISOString() } })
    return event
  },

  async update(id: string, input: CreateEventInput & { version: number; status?: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' }, userId: string) {
    const before = await calendarRepository.getById(id)
    if (!before) throw new AppError(404, 'EVENT_NOT_FOUND', 'Compromisso não encontrado.')
    const updated = await calendarRepository.updateVersioned(id, input.version, {
      title: input.title,
      description: input.description,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      timezone: input.timezone,
      localityId: input.localityId,
      address: input.address,
      visibility: input.visibility,
      status: input.status,
    })
    if (!updated) throw new AppError(409, 'VERSION_CONFLICT', 'Este compromisso mudou em outro acesso. Recarregue antes de salvar.')
    await auditRepository.record({ userId, action: 'UPDATE', entityType: 'CalendarEvent', entityId: id, beforeData: { version: before.version }, afterData: { version: updated.version } })
    return updated
  },
}
