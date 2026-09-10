import { prisma } from '@campanha/database'

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
}
