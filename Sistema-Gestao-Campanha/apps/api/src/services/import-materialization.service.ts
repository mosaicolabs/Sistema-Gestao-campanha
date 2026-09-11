import { createHash } from 'node:crypto'
import type { Prisma } from '@campanha/database'
import { prisma } from '@campanha/database'
import type { MaterializationApplyResult, MaterializationPreview } from '@campanha/types'
import { auditRepository } from '../repositories/audit.repository.js'
import { importMaterializationRepository } from '../repositories/import-materialization.repository.js'
import { AppError } from '../utils/app-error.js'
import { canonicalize, normalizeContact } from '../utils/normalization.js'
import { ALLIANCE_SHEET_NAMES, sourceCells } from './campaign-workbook-parser.js'

type Occurrence = {
  id: string
  sheetName: string
  rowNumber: number
  category: 'TERRITORIAL' | 'ALLIANCE' | string
  rawValues: unknown
  normalizedValues: unknown
}

type SlotName = 'articulator' | 'coordinator' | 'leadership'
type RelationType = 'SUPPORTS' | 'ARTICULATES_FOR' | 'COORDINATES_FOR'

const roleCodes: Record<SlotName, 'ARTICULATOR' | 'COORDINATOR' | 'LEADERSHIP'> = {
  articulator: 'ARTICULATOR',
  coordinator: 'COORDINATOR',
  leadership: 'LEADERSHIP',
}

const allianceNameAliases: Record<string, string> = {
  SERFIOTES: 'Serfiotis',
  GUTEMBERG: 'Gutembertg Reis',
}

const knownAllianceKeys = new Set(ALLIANCE_SHEET_NAMES.map((name) => canonicalize(name)))

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function slotValue(occurrence: Occurrence, slot: number) {
  return sourceCells(occurrence.rawValues)[slot] ?? null
}

function citySourceName(occurrence: Occurrence) {
  return occurrence.category === 'TERRITORIAL' ? occurrence.sheetName : slotValue(occurrence, 0)
}

function allianceSourceName(occurrence: Occurrence) {
  if (occurrence.category === 'ALLIANCE') return occurrence.sheetName
  return slotValue(occurrence, 6)
}

function canonicalAllianceName(value: string) {
  const key = canonicalize(value)
  return allianceNameAliases[key] ?? value.trim()
}

function sourceSlot(occurrence: Occurrence, slotName: SlotName) {
  if (occurrence.category === 'TERRITORIAL') {
    return { articulator: 0, coordinator: 1, leadership: 3 }[slotName]
  }
  return { articulator: 1, coordinator: 2, leadership: 4 }[slotName]
}

function contactSlot(occurrence: Occurrence, slotName: 'coordinator' | 'leadership') {
  if (occurrence.category === 'TERRITORIAL') return slotName === 'coordinator' ? 2 : 5
  return slotName === 'coordinator' ? 3 : 6
}

function isKnownShiftedSheet(occurrence: Occurrence) {
  return ['Paraty', 'Serfiotis', 'Barra do Piraí'].includes(occurrence.sheetName)
}

function relationKey(personId: string, allianceId: string, localityId: string | null, type: RelationType) {
  return createHash('sha256').update([personId, allianceId, localityId ?? 'UNASSIGNED', type].join('|')).digest('hex')
}

async function findOccurrences(batchId: string): Promise<Occurrence[]> {
  return importMaterializationRepository.listOccurrences(batchId) as unknown as Promise<Occurrence[]>
}

async function resolveCity(db: typeof prisma | Prisma.TransactionClient, rawName: string | null) {
  if (!rawName) return null
  const key = canonicalize(rawName)
  const city = await db.locality.findFirst({ where: { canonicalName: key, type: 'CITY', status: { not: 'INACTIVE' } } })
  if (city) return city
  const alias = await db.localityAlias.findFirst({ where: { valueNormalized: key, status: { not: 'INACTIVE' } }, include: { locality: true } })
  return alias?.locality?.type === 'CITY' ? alias.locality : null
}

async function countDuplicateOccurrences(occurrences: Occurrence[]) {
  const fingerprints = new Map<string, number>()
  for (const occurrence of occurrences.filter((item) => item.category === 'ALLIANCE')) {
    const cells = sourceCells(occurrence.rawValues)
    const signature = JSON.stringify(cells.map((value) => value ? canonicalize(value) : null))
    fingerprints.set(signature, (fingerprints.get(signature) ?? 0) + 1)
  }
  const duplicateRows = [...fingerprints.values()].filter((count) => count > 1).reduce((sum, count) => sum + count - 1, 0)
  return { blockRows: Math.min(148, duplicateRows), exactAdditionalRows: Math.max(0, duplicateRows - 148) }
}

export const importMaterializationService = {
  async preview(batchId: string): Promise<MaterializationPreview> {
    const batch = await importMaterializationRepository.findBatch(batchId)
    if (!batch) throw new AppError(404, 'IMPORT_BATCH_NOT_FOUND', 'Lote de importação não encontrado.')
    const occurrences = await findOccurrences(batchId)
    const [openIssueCount, blockingIssueCount, indexControls, issueSeverityRows] = await Promise.all([
      prisma.importIssue.count({ where: { importBatchId: batchId, status: { in: ['OPEN', 'REVIEWING'] } } }),
      prisma.importIssue.count({ where: { importBatchId: batchId, status: { in: ['OPEN', 'REVIEWING'] }, severity: 'CRITICAL', type: { not: 'DUPLICATE_BLOCK' } } }),
      prisma.importIndexControl.findMany({ where: { importBatchId: batchId }, select: { scope: true, sourceLabel: true, manualCount: true, observedCount: true, difference: true }, orderBy: [{ scope: 'asc' }, { sourceLabel: 'asc' }] }),
      prisma.importIssue.findMany({ where: { importBatchId: batchId, status: { in: ['OPEN', 'REVIEWING'] } }, select: { severity: true } }),
    ])
    const cityNames = new Set<string>()
    const allianceNames = new Set<string>()
    const personKeys = new Map<string, number>()
    let eligibleRows = 0
    let partialRows = 0
    let blockedRows = 0
    let contactsPresent = 0
    let contactsEligible = 0
    let contactsBlocked = 0
    let assignments = 0
    let allianceRelations = 0

    for (const occurrence of occurrences) {
      const cells = sourceCells(occurrence.rawValues)
      const city = citySourceName(occurrence)
      if (city) cityNames.add(canonicalize(city))
      const alliance = allianceSourceName(occurrence)
      if (alliance) allianceNames.add(canonicalAllianceName(alliance))
      const names = occurrence.category === 'TERRITORIAL' ? [cells[0], cells[1], cells[3]] : [cells[1], cells[2], cells[4]]
      const contacts = occurrence.category === 'TERRITORIAL' ? [cells[2], cells[5]] : [cells[3], cells[6]]
      names.forEach((name, index) => {
        if (!name) return
        const key = `${canonicalize(name)}|${city ? canonicalize(city) : 'UNKNOWN'}|${roleCodes[['articulator', 'coordinator', 'leadership'][index] as SlotName]}`
        personKeys.set(key, (personKeys.get(key) ?? 0) + 1)
        assignments += 1
      })
      contacts.forEach((contact) => {
        if (!contact) return
        contactsPresent += 1
        if (isKnownShiftedSheet(occurrence)) contactsBlocked += 1
        else contactsEligible += 1
      })
      if (!city || (occurrence.category === 'TERRITORIAL' && !occurrence.sheetName)) blockedRows += 1
      else if (names.some((name) => !name)) partialRows += 1
      else eligibleRows += 1
      if (alliance && names.some(Boolean)) allianceRelations += names.filter(Boolean).length
    }

    const uniquePersonKeys = [...personKeys.keys()].length
    const ambiguousCandidates = [...personKeys.values()].filter((count) => count > 1).length
    const duplicates = await countDuplicateOccurrences(occurrences)
    const issuesBySeverity = { INFO: 0, WARNING: 0, CRITICAL: 0 }
    for (const issue of issueSeverityRows) issuesBySeverity[issue.severity] += 1
    return {
      batchId,
      status: batch.materializationStatus,
      sourceRows: occurrences.length,
      territorialRows: occurrences.filter((item) => item.category === 'TERRITORIAL').length,
      allianceRows: occurrences.filter((item) => item.category === 'ALLIANCE').length,
      eligibleRows,
      partialRows,
      blockedRows,
      rejectedRows: 0,
      people: { newCandidates: uniquePersonKeys, reusableCandidates: 0, ambiguousCandidates },
      contacts: { present: contactsPresent, eligible: contactsEligible, blocked: contactsBlocked },
      assignments,
      alliances: allianceNames.size,
      allianceRelations,
      manualIndexes: { territorial: batch.manualTerritorialIndex, alliance: batch.manualAllianceIndex },
      observedTotals: { territorial: batch.territorialOccurrences, alliance: batch.allianceOccurrences },
      duplicateOccurrences: duplicates,
      indexControls,
      issuesBySeverity,
      openIssueCount,
      blockingIssueCount,
      notes: [
        'Todos os valores brutos permanecem em SourceOccurrence.',
        'Religião fica restrita à evidência de origem.',
        'Índices manuais e ocorrências observadas são exibidos separadamente.',
        'As 148 ocorrências duplicadas são mantidas e não reduzem a contagem de origem.',
      ],
    }
  },

  async apply(batchId: string, userId: string, options?: { acknowledgePending?: boolean }): Promise<MaterializationApplyResult> {
    const before = await this.preview(batchId)
    if (before.blockingIssueCount > 0 && !options?.acknowledgePending) {
      throw new AppError(409, 'MATERIALIZATION_REVIEW_REQUIRED', 'Existem pendências críticas antes da materialização.')
    }
    const batch = await importMaterializationRepository.findBatch(batchId)
    if (!batch) throw new AppError(404, 'IMPORT_BATCH_NOT_FOUND', 'Lote de importação não encontrado.')
    if (batch.materializationStatus === 'RUNNING') throw new AppError(409, 'MATERIALIZATION_RUNNING', 'A materialização deste lote já está em andamento.')

    await prisma.importBatch.update({ where: { id: batchId }, data: { materializationStatus: 'RUNNING', materializationError: null } })
    try {
      await prisma.$transaction(async (tx) => {
        const roles = await tx.businessRole.findMany({ where: { code: { in: Object.values(roleCodes) } } })
        const roleByCode = new Map(roles.map((role) => [role.code, role.id]))
        const occurrences = await tx.sourceOccurrence.findMany({ where: { importBatchId: batchId }, orderBy: [{ sheetName: 'asc' }, { rowNumber: 'asc' }] }) as unknown as Occurrence[]
        const materializedPeople = new Set<string>()
        const materializedAssignments = new Set<string>()
        const materializedAlliances = new Set<string>()
        const existingPersonSources = await tx.entitySource.findMany({ where: { entityType: 'Person', occurrence: { importBatchId: batchId } }, select: { entityId: true, occurrenceId: true, fieldMapping: true } })
        const personByOccurrenceSlot = new Map<string, string>()
        for (const source of existingPersonSources) {
          const mapping = record(source.fieldMapping)
          if (typeof mapping.slot === 'string') personByOccurrenceSlot.set(`${source.occurrenceId}|${mapping.slot}`, source.entityId)
        }
        for (const occurrence of occurrences) {
          const cells = sourceCells(occurrence.rawValues)
          const city = await resolveCity(tx, citySourceName(occurrence))
          const allianceName = allianceSourceName(occurrence)
          let alliance = allianceName ? await tx.alliance.findUnique({ where: { canonicalName: canonicalize(canonicalAllianceName(allianceName)) } }) : null
          if (allianceName && !alliance) {
            const canonicalName = canonicalize(canonicalAllianceName(allianceName))
            alliance = await tx.alliance.create({ data: { name: canonicalAllianceName(allianceName), canonicalName, status: knownAllianceKeys.has(canonicalName) ? 'ACTIVE' : 'PENDING_REVIEW' } })
          }
          if (alliance) materializedAlliances.add(alliance.id)
          if (alliance) await tx.entitySource.upsert({ where: { entityType_entityId_occurrenceId: { entityType: 'Alliance', entityId: alliance.id, occurrenceId: occurrence.id } }, update: {}, create: { entityType: 'Alliance', entityId: alliance.id, occurrenceId: occurrence.id, fieldMapping: { source: occurrence.category === 'ALLIANCE' ? 'sheetName' : 'federalDeputy' } } })
          if (!city) continue

          const personBySlot = new Map<SlotName, { id: string; status: 'ACTIVE' | 'PENDING_REVIEW' }>()
          for (const slotName of ['articulator', 'coordinator', 'leadership'] as SlotName[]) {
            const rawName = slotValue(occurrence, sourceSlot(occurrence, slotName))
            if (!rawName) continue
            const contactRaw = slotName === 'articulator' ? null : slotValue(occurrence, contactSlot(occurrence, slotName))
            const canonicalName = canonicalize(rawName)
            const roleId = roleByCode.get(roleCodes[slotName])
            if (!roleId) continue
            const normalized = contactRaw ? normalizeContact(contactRaw) : null
            const existingPersonId = personByOccurrenceSlot.get(`${occurrence.id}|${slotName}`)
            const existingPerson = existingPersonId ? await tx.person.findUnique({ where: { id: existingPersonId }, include: { contacts: true } }) : null
            const candidatePeople = existingPerson ? [] : await tx.person.findMany({ where: { canonicalName, assignments: { some: { businessRoleId: roleId, localityId: city.id, status: { not: 'INACTIVE' } } } }, include: { contacts: true }, take: 10 })
            const contactMatch = normalized ? candidatePeople.filter((candidate) => candidate.contacts.some((contact) => contact.valueNormalized === normalized)) : []
            const person = existingPerson ?? (contactMatch.length === 1 ? contactMatch[0]! : candidatePeople.length === 1 && !normalized ? candidatePeople[0]! : await tx.person.create({ data: { displayName: rawName, canonicalName, status: 'PENDING_REVIEW' } }))
            const personStatus: 'ACTIVE' | 'PENDING_REVIEW' = existingPerson?.status === 'ACTIVE' ? 'ACTIVE' : (contactMatch.length === 1 ? 'ACTIVE' : 'PENDING_REVIEW')
            materializedPeople.add(person.id)
            personBySlot.set(slotName, { id: person.id, status: personStatus })
            await tx.personAlias.upsert({ where: { personId_value: { personId: person.id, value: rawName } }, update: { sourceOccurrenceId: occurrence.id }, create: { personId: person.id, value: rawName, sourceOccurrenceId: occurrence.id } })
            await tx.entitySource.upsert({ where: { entityType_entityId_occurrenceId: { entityType: 'Person', entityId: person.id, occurrenceId: occurrence.id } }, update: { fieldMapping: { slot: slotName, sourceCategory: occurrence.category } }, create: { entityType: 'Person', entityId: person.id, occurrenceId: occurrence.id, fieldMapping: { slot: slotName, sourceCategory: occurrence.category } } })
            const assignment = await tx.personAssignment.findFirst({ where: { personId: person.id, businessRoleId: roleId, localityId: city.id, status: { not: 'INACTIVE' } } }) ?? await tx.personAssignment.create({ data: { personId: person.id, businessRoleId: roleId, localityId: city.id, status: personStatus } })
            materializedAssignments.add(assignment.id)
            await tx.entitySource.upsert({ where: { entityType_entityId_occurrenceId: { entityType: 'PersonAssignment', entityId: assignment.id, occurrenceId: occurrence.id } }, update: {}, create: { entityType: 'PersonAssignment', entityId: assignment.id, occurrenceId: occurrence.id, fieldMapping: { slot: slotName, localityId: city.id } } })
            if (contactRaw && !isKnownShiftedSheet(occurrence)) {
              const valueNormalized = normalizeContact(contactRaw)
              const type = /^\d+$/.test(valueNormalized) ? 'PHONE' : 'OTHER'
              const contact = await tx.contact.findFirst({ where: { personId: person.id, valueNormalized } }) ?? await tx.contact.create({ data: { personId: person.id, type, valueRaw: contactRaw, valueNormalized, status: personStatus } })
              await tx.entitySource.upsert({ where: { entityType_entityId_occurrenceId: { entityType: 'Contact', entityId: contact.id, occurrenceId: occurrence.id } }, update: {}, create: { entityType: 'Contact', entityId: contact.id, occurrenceId: occurrence.id, fieldMapping: { slot: `${slotName}Contact`, sourceCategory: occurrence.category } } })
            }
          }

          if (!alliance) continue
          const relations: Array<{ slot: SlotName; type: RelationType }> = occurrence.category === 'TERRITORIAL'
            ? [{ slot: 'leadership', type: 'SUPPORTS' }]
            : [{ slot: 'articulator', type: 'ARTICULATES_FOR' }, { slot: 'coordinator', type: 'COORDINATES_FOR' }, { slot: 'leadership', type: 'SUPPORTS' }]
          for (const relation of relations) {
            const person = personBySlot.get(relation.slot)
            if (!person) continue
            const key = relationKey(person.id, alliance.id, city.id, relation.type)
            const membership = await tx.personAlliance.upsert({ where: { relationKey: key }, update: { status: person.status }, create: { personId: person.id, allianceId: alliance.id, localityId: city.id, relationType: relation.type, relationKey: key, sourceOccurrenceId: occurrence.id, status: person.status } })
            await tx.entitySource.upsert({ where: { entityType_entityId_occurrenceId: { entityType: 'PersonAlliance', entityId: membership.id, occurrenceId: occurrence.id } }, update: {}, create: { entityType: 'PersonAlliance', entityId: membership.id, occurrenceId: occurrence.id, fieldMapping: { relationType: relation.type, localityId: city.id } } })
          }
        }
        await tx.importBatch.update({ where: { id: batchId }, data: { materializationStatus: 'COMPLETED', materializedAt: new Date(), consolidatedPeople: materializedPeople.size, consolidatedAssignments: materializedAssignments.size, consolidatedAlliances: materializedAlliances.size } })
      }, { timeout: 120_000 })
    } catch (error) {
      await prisma.importBatch.update({ where: { id: batchId }, data: { materializationStatus: 'FAILED', materializationError: error instanceof Error ? error.message.slice(0, 500) : 'Falha desconhecida' } })
      throw error
    }
    const after = await this.preview(batchId)
    await auditRepository.record({ userId, action: 'MATERIALIZE_IMPORT', entityType: 'ImportBatch', entityId: batchId, afterData: { sourceRows: after.sourceRows, assignments: after.assignments, alliances: after.alliances, materializationStatus: 'COMPLETED' } })
    return { ...after, applied: true, materializedAt: new Date().toISOString() }
  },
}
