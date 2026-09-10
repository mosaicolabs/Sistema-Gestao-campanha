import { prisma } from '@campanha/database'

export const referenceRepository = {
  async all() {
    const [localities, businessRoles, alliances, users, materials, accessRoles, people] = await Promise.all([
      prisma.locality.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
      prisma.businessRole.findMany({ orderBy: { name: 'asc' } }),
      prisma.alliance.findMany({ orderBy: { name: 'asc' } }),
      prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, username: true, person: { select: { displayName: true } } },
        orderBy: { username: 'asc' },
      }),
      prisma.material.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } }),
      prisma.accessRole.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: 'asc' } }),
      prisma.person.findMany({ where: { user: null }, select: { id: true, displayName: true }, orderBy: { displayName: 'asc' }, take: 200 }),
    ])
    return { localities, businessRoles, alliances, users, materials, accessRoles, people }
  },
}
