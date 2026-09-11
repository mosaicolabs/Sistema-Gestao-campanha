import { prisma } from '@campanha/database'
import type {
  CoverageAllianceDetail,
  CoverageAllianceRow,
  CoverageCityDetail,
  CoveragePersonRow,
  CoverageTreeCity,
  CoverageTreeRegion,
} from '@campanha/types'
import type { CoverageMacroFilters } from '@campanha/validation'

type MacroCityInput = {
  id: string
  name: string
  canonicalName: string
  parentId?: string | null
  parent: { name: string } | null
  aliases: Array<{ value: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW' }>
  assignments: Array<{ id: string; personId: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'; businessRole: { code: string } }>
  alliances: Array<{ id: string; personId: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW' }>
}

type CoverageCityInput = MacroCityInput & {
  assignments: CoverageAssignmentInput[]
}

type CoverageAssignmentInput = {
  id: string
  personId: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'
  businessRole: { code: string; name?: string }
  person?: {
    id: string
    displayName: string
    contacts: Array<{ id: string; type: string; valueRaw: string; isPrimary: boolean }>
    alliances: Array<{ id: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'; localityId: string | null; alliance: { id: string; name: string } }>
  }
}

type CoverageRegionInput = {
  id: string
  name: string
  children: Array<MacroCityInput>
}

function activeAllianceRows(person: NonNullable<CoverageAssignmentInput['person']>) {
  return person.alliances
    .filter((item) => item.status !== 'INACTIVE')
    .map((item) => ({ id: item.alliance.id, name: item.alliance.name, status: item.status, localityId: item.localityId }))
}

export function toCoveragePersonRow(assignment: CoverageAssignmentInput): CoveragePersonRow {
  const person = assignment.person
  return {
    assignmentId: assignment.id,
    personId: assignment.personId,
    roleCode: assignment.businessRole.code as CoveragePersonRow['roleCode'],
    roleName: assignment.businessRole.name ?? assignment.businessRole.code,
    displayName: person?.displayName ?? 'Pessoa não cadastrada',
    contacts: person?.contacts ?? [],
    alliances: person ? activeAllianceRows(person) : [],
  }
}

export function toCoverageTreeCity(city: MacroCityInput): CoverageTreeCity {
  const activeAssignments = city.assignments.filter((item) => item.status !== 'INACTIVE')
  const articulatorIds = new Set(activeAssignments.filter((item) => item.businessRole.code === 'ARTICULATOR').map((item) => item.personId))
  const peopleIds = new Set(activeAssignments.map((item) => item.personId))
  return {
    id: city.id,
    name: city.name,
    regionId: city.parent?.name ?? '',
    canonicalKey: city.canonicalName,
    articulatorCityRelations: articulatorIds.size,
    peopleCount: peopleIds.size,
    pendingAliasCount: city.aliases.filter((alias) => alias.status === 'PENDING_REVIEW').length,
  }
}

export function toCoverageTreeRegion(region: CoverageRegionInput): CoverageTreeRegion {
  return {
    id: region.id,
    name: region.name,
    cities: region.children.map((city) => ({ ...toCoverageTreeCity(city), regionId: region.id })),
  }
}

export function toCoverageCityDetail(city: CoverageCityInput): CoverageCityDetail {
  const rows = city.assignments
    .filter((assignment) => assignment.status !== 'INACTIVE')
    .map(toCoveragePersonRow)
  const uniqueByRole = (role: CoveragePersonRow['roleCode']) => new Set(rows.filter((row) => row.roleCode === role).map((row) => row.personId)).size
  const articulators = uniqueByRole('ARTICULATOR')
  return {
    city: { id: city.id, name: city.name, canonicalKey: city.canonicalName },
    region: city.parent ? { id: city.parentId ?? '', name: city.parent.name } : null,
    summary: {
      articulators,
      coordinators: uniqueByRole('COORDINATOR'),
      leaderships: uniqueByRole('LEADERSHIP'),
      articulatorCityRelations: articulators,
    },
    rows,
    observedVariants: [...new Set(city.aliases.filter((alias) => alias.status !== 'INACTIVE').map((alias) => alias.value))],
  }
}

type AllianceCityInput = {
  id: string
  name: string
  region: string
  people: CoveragePersonRow[]
}

export function toCoverageAllianceDetail(alliance: { id: string; name: string }, rows: AllianceCityInput[]): CoverageAllianceDetail {
  const byCity = new Map<string, CoverageAllianceRow>()
  for (const row of rows) {
    const current = byCity.get(row.id)
    if (current) current.people.push(...row.people)
    else byCity.set(row.id, { city: { id: row.id, name: row.name, region: row.region }, people: [...row.people] })
  }
  return { alliance, rows: [...byCity.values()].sort((left, right) => left.city.name.localeCompare(right.city.name, 'pt-BR')) }
}

export function toMacroCoverageRow(city: MacroCityInput) {
  const activeAssignments = city.assignments.filter((item) => item.status !== 'INACTIVE')
  const articulatorAssignments = activeAssignments.filter((item) => item.businessRole.code === 'ARTICULATOR')
  const coordinatorAssignments = activeAssignments.filter((item) => item.businessRole.code === 'COORDINATOR')
  const leadershipAssignments = activeAssignments.filter((item) => item.businessRole.code === 'LEADERSHIP')
  const activeAliases = city.aliases.filter((alias) => alias.status !== 'INACTIVE')
  return {
    id: city.id,
    city: city.name,
    canonicalKey: city.canonicalName,
    region: city.parent?.name ?? 'Região não informada',
    uniqueArticulators: new Set(articulatorAssignments.map((item) => item.personId)).size,
    articulatorCityRelations: new Set(articulatorAssignments.map((item) => item.personId)).size,
    uniqueCoordinators: new Set(coordinatorAssignments.map((item) => item.personId)).size,
    uniqueLeaderships: new Set(leadershipAssignments.map((item) => item.personId)).size,
    uniqueAssignments: new Set(activeAssignments.map((item) => item.id)).size,
    uniqueAlliances: new Set(city.alliances.filter((item) => item.status !== 'INACTIVE').map((item) => item.id)).size,
    observedVariants: [...new Set(activeAliases.map((alias) => alias.value))],
    pendingAliasCount: city.aliases.filter((alias) => alias.status === 'PENDING_REVIEW').length,
  }
}

type MacroCoverageFilters = CoverageMacroFilters

const sortKeys = new Set<MacroCoverageFilters['sortBy']>([
  'city',
  'region',
  'articulatorCityRelations',
  'uniqueArticulators',
  'uniqueCoordinators',
  'uniqueLeaderships',
  'uniqueAssignments',
  'uniqueAlliances',
  'pendingAliasCount',
])

function normalizedSearch(value?: string) {
  return value?.trim().toLocaleLowerCase('pt-BR') ?? ''
}

export const coverageRepository = {
  async list(regionId?: string) {
    const cities = await prisma.locality.findMany({
      where: {
        type: 'CITY',
        ...(regionId ? { parentId: regionId } : {}),
      },
      include: {
        parent: true,
        assignments: { include: { businessRole: true } },
        alliances: true,
      },
      orderBy: { name: 'asc' },
    })

    return cities.map((city) => {
      const coordinators = city.assignments.filter((item) => item.businessRole.code === 'COORDINATOR').length
      const leaderships = city.assignments.filter((item) => item.businessRole.code === 'LEADERSHIP').length
      return {
        id: city.id,
        city: city.name,
        region: city.parent?.name ?? 'Região não informada',
        coordinators,
        leaderships,
        alliances: city.alliances.length,
        coordinationInformation: coordinators > 0 ? 'INFORMED' : 'MISSING_INFORMATION',
        leadershipInformation: leaderships > 0 ? 'INFORMED' : 'MISSING_INFORMATION',
      }
    })
  },

  async listMacro(filters: MacroCoverageFilters = { aliasStatus: 'ALL', sortBy: 'city', sortDirection: 'asc' }) {
    const cities = await prisma.locality.findMany({
      where: {
        type: 'CITY',
        status: { not: 'INACTIVE' },
        ...(filters.regionId ? { parentId: filters.regionId } : {}),
      },
      include: {
        parent: true,
        aliases: { select: { value: true, status: true }, orderBy: { createdAt: 'asc' } },
        assignments: { include: { businessRole: true } },
        alliances: { select: { id: true, personId: true, status: true } },
      },
      orderBy: { name: 'asc' },
    })

    const search = normalizedSearch(filters.search)
    const rows = cities.map(toMacroCoverageRow).filter((row, index) => {
      const city = cities[index]
      if (!city) return false
      const activeAssignments = city.assignments.filter((item) => item.status !== 'INACTIVE')
      const activeAlliances = city.alliances.filter((item) => item.status !== 'INACTIVE')
      const hasRole = filters.role ? activeAssignments.some((item) => item.businessRole.code === filters.role) : true
      const hasAlliance = filters.allianceId ? activeAlliances.some((item) => item.id === filters.allianceId) : true
      const hasPendingAlias = row.pendingAliasCount > 0
      const matchesAliasStatus = filters.aliasStatus === 'PENDING' ? hasPendingAlias : filters.aliasStatus === 'CLEAR' ? !hasPendingAlias : true
      const matchesSearch = search.length === 0 || [row.city, row.region, row.canonicalKey].some((value) => normalizedSearch(value).includes(search))
      return hasRole && hasAlliance && matchesAliasStatus && matchesSearch
    })

    const sortBy = sortKeys.has(filters.sortBy) ? filters.sortBy : 'city'
    const direction = filters.sortDirection === 'desc' ? -1 : 1
    return rows.sort((left, right) => {
      const leftValue = left[sortBy]
      const rightValue = right[sortBy]
      const leftComparable = typeof leftValue === 'string' ? leftValue.toLocaleLowerCase('pt-BR') : leftValue
      const rightComparable = typeof rightValue === 'string' ? rightValue.toLocaleLowerCase('pt-BR') : rightValue
      const comparison = leftComparable < rightComparable ? -1 : leftComparable > rightComparable ? 1 : 0
      if (comparison !== 0) return comparison * direction
      return left.city.localeCompare(right.city, 'pt-BR')
    })
  },

  async listTree(stateId?: string): Promise<CoverageTreeRegion[]> {
    const state = stateId
      ? await prisma.locality.findFirst({ where: { id: stateId, type: 'STATE', status: { not: 'INACTIVE' } }, select: { id: true } })
      : await prisma.locality.findFirst({ where: { canonicalName: 'RIO DE JANEIRO', type: 'STATE', status: { not: 'INACTIVE' } }, select: { id: true } })
    if (!state) return []

    const regions = await prisma.locality.findMany({
      where: { type: 'REGION', parentId: state.id, status: { not: 'INACTIVE' } },
      include: {
        children: {
          where: { type: 'CITY', status: { not: 'INACTIVE' } },
          include: {
            parent: { select: { name: true } },
            aliases: { select: { value: true, status: true }, orderBy: { createdAt: 'asc' } },
            assignments: { select: { id: true, personId: true, status: true, businessRole: { select: { code: true } } } },
            alliances: { select: { id: true, personId: true, status: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return regions.map((region) => toCoverageTreeRegion(region as unknown as CoverageRegionInput))
  },

  async getCityDetail(cityId: string): Promise<CoverageCityDetail | null> {
    const city = await prisma.locality.findFirst({
      where: { id: cityId, type: 'CITY', status: { not: 'INACTIVE' } },
      include: {
        parent: { select: { id: true, name: true } },
        aliases: { select: { value: true, status: true }, orderBy: { createdAt: 'asc' } },
        assignments: {
          where: { status: { not: 'INACTIVE' }, person: { status: { not: 'INACTIVE' } } },
          include: {
            businessRole: { select: { code: true, name: true } },
            person: {
              select: {
                id: true,
                displayName: true,
                contacts: { select: { id: true, type: true, valueRaw: true, isPrimary: true }, orderBy: { isPrimary: 'desc' } },
                alliances: {
                  where: { status: { not: 'INACTIVE' } },
                  select: { id: true, localityId: true, status: true, alliance: { select: { id: true, name: true } } },
                },
              },
            },
          },
          orderBy: [{ businessRole: { name: 'asc' } }, { person: { displayName: 'asc' } }],
        },
      },
    })
    return city ? toCoverageCityDetail(city as unknown as CoverageCityInput) : null
  },

  async getAllianceDetail(allianceId: string): Promise<CoverageAllianceDetail | null> {
    const alliance = await prisma.alliance.findFirst({
      where: { id: allianceId, status: { not: 'INACTIVE' } },
      select: {
        id: true,
        name: true,
        members: {
          where: { status: { not: 'INACTIVE' }, person: { status: { not: 'INACTIVE' } } },
          select: {
            id: true,
            localityId: true,
            person: {
              select: {
                id: true,
                displayName: true,
                contacts: { select: { id: true, type: true, valueRaw: true, isPrimary: true }, orderBy: { isPrimary: 'desc' } },
                assignments: {
                  where: { status: { not: 'INACTIVE' } },
                  include: {
                    businessRole: { select: { code: true, name: true } },
                    locality: { select: { id: true, name: true, parent: { select: { name: true } } } },
                  },
                },
                alliances: {
                  where: { status: { not: 'INACTIVE' } },
                  select: { id: true, localityId: true, status: true, alliance: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
    })
    if (!alliance) return null

    const rows: AllianceCityInput[] = []
    for (const member of alliance.members) {
      const assignments = member.localityId
        ? member.person.assignments.filter((assignment) => assignment.locality.id === member.localityId)
        : member.person.assignments
      const grouped = new Map<string, { name: string; region: string; assignments: typeof assignments }>()
      if (!member.localityId) {
        grouped.set('unassigned', { name: 'Localidade não informada', region: 'Não informada', assignments: [] })
        grouped.get('unassigned')!.assignments.push(...assignments)
      } else if (!assignments.length) {
        grouped.set('unassigned', { name: 'Localidade não informada', region: 'Não informada', assignments: [] })
      } else {
        for (const assignment of assignments) {
          const current = grouped.get(assignment.locality.id) ?? { name: assignment.locality.name, region: assignment.locality.parent?.name ?? 'Região não informada', assignments: [] }
          current.assignments.push(assignment)
          grouped.set(assignment.locality.id, current)
        }
      }
      for (const [cityId, group] of grouped) {
        const people = group.assignments.length
          ? group.assignments.map((assignment) => toCoveragePersonRow({
              id: assignment.id,
              personId: member.person.id,
              status: assignment.status,
              businessRole: assignment.businessRole,
              person: {
                id: member.person.id,
                displayName: member.person.displayName,
                contacts: member.person.contacts,
                alliances: member.person.alliances,
              },
            }))
          : []
        rows.push({ id: cityId, name: group.name, region: group.region, people })
      }
    }
    return toCoverageAllianceDetail({ id: alliance.id, name: alliance.name }, rows)
  },
}
