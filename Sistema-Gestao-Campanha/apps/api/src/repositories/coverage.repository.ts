import { prisma } from '@campanha/database'

type MacroCityInput = {
  id: string
  name: string
  canonicalName: string
  parent: { name: string } | null
  aliases: Array<{ value: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW' }>
  assignments: Array<{ id: string; personId: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW'; businessRole: { code: string } }>
  alliances: Array<{ id: string; personId: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING_REVIEW' }>
}

export function toMacroCoverageRow(city: MacroCityInput) {
  const activeAssignments = city.assignments.filter((item) => item.status !== 'INACTIVE')
  const articulatorAssignments = activeAssignments.filter((item) => item.businessRole.code === 'ARTICULATOR')
  const activeAliases = city.aliases.filter((alias) => alias.status !== 'INACTIVE')
  return {
    id: city.id,
    city: city.name,
    canonicalKey: city.canonicalName,
    region: city.parent?.name ?? 'Região não informada',
    uniqueArticulators: new Set(articulatorAssignments.map((item) => item.personId)).size,
    articulatorCityRelations: new Set(articulatorAssignments.map((item) => item.personId)).size,
    uniqueAssignments: new Set(activeAssignments.map((item) => item.id)).size,
    uniqueAlliances: new Set(city.alliances.filter((item) => item.status !== 'INACTIVE').map((item) => item.id)).size,
    observedVariants: [...new Set(activeAliases.map((alias) => alias.value))],
    pendingAliasCount: city.aliases.filter((alias) => alias.status === 'PENDING_REVIEW').length,
  }
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

  async listMacro(regionId?: string) {
    const cities = await prisma.locality.findMany({
      where: {
        type: 'CITY',
        status: { not: 'INACTIVE' },
        ...(regionId ? { parentId: regionId } : {}),
      },
      include: {
        parent: true,
        aliases: { select: { value: true, status: true }, orderBy: { createdAt: 'asc' } },
        assignments: { include: { businessRole: true } },
        alliances: { select: { id: true, personId: true, status: true } },
      },
      orderBy: { name: 'asc' },
    })

    return cities.map(toMacroCoverageRow)
  },
}
