import type { CreatePersonInput } from '@campanha/validation'
import { auditRepository } from '../repositories/audit.repository.js'
import { peopleRepository } from '../repositories/people.repository.js'
import { AppError } from '../utils/app-error.js'
import { canonicalize, normalizeContact } from '../utils/normalization.js'

export const peopleService = {
  async list(query: { search?: string; localityId?: string; roleId?: string; page: number; pageSize: number }) {
    const result = await peopleRepository.list(query)
    return {
      data: result.data,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        pageCount: Math.ceil(result.total / query.pageSize),
      },
    }
  },

  async create(input: CreatePersonInput, userId: string) {
    const canonicalName = canonicalize(input.displayName)
    const normalizedContacts = input.contacts.map((contact) => normalizeContact(contact.value))
    const candidates = await peopleRepository.findCandidates(canonicalName, normalizedContacts)

    const person = await peopleRepository.create({
      displayName: input.displayName,
      canonicalName,
      notes: input.notes,
      contacts: {
        create: input.contacts.map((contact) => ({
          type: contact.type,
          valueRaw: contact.value,
          valueNormalized: normalizeContact(contact.value),
          isPrimary: contact.isPrimary,
        })),
      },
      assignments: {
        create: input.assignments.map((assignment) => ({
          businessRole: { connect: { id: assignment.businessRoleId } },
          locality: { connect: { id: assignment.localityId } },
        })),
      },
      alliances: {
        create: input.alliances.map((alliance) => ({
          alliance: { connect: { id: alliance.allianceId } },
          ...(alliance.localityId ? { locality: { connect: { id: alliance.localityId } } } : {}),
          status: 'PENDING_REVIEW',
        })),
      },
    })

    await auditRepository.record({
      userId,
      action: 'CREATE',
      entityType: 'Person',
      entityId: person.id,
      afterData: { displayName: person.displayName, status: person.status },
    })

    return {
      person,
      reviewCandidates: candidates.map((candidate) => ({ id: candidate.id, displayName: candidate.displayName })),
      warning:
        candidates.length > 0
          ? 'Há cadastros com nome ou contato coincidente. Nenhuma fusão foi realizada.'
          : undefined,
    }
  },

  async get(id: string) {
    const person = await peopleRepository.getById(id)
    if (!person) throw new AppError(404, 'PERSON_NOT_FOUND', 'Pessoa não encontrada.')
    return person
  },
}
