import { prisma, type Prisma } from '@campanha/database'

type ListParams = {
  search?: string
  localityId?: string
  roleId?: string
  page: number
  pageSize: number
}

export const peopleRepository = {
  async list(params: ListParams) {
    const where: Prisma.PersonWhereInput = {
      ...(params.search
        ? {
            OR: [
              { displayName: { contains: params.search, mode: 'insensitive' } },
              { canonicalName: { contains: params.search.toUpperCase(), mode: 'insensitive' } },
              { contacts: { some: { valueRaw: { contains: params.search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
      ...(params.localityId || params.roleId
        ? {
            assignments: {
              some: {
                ...(params.localityId ? { localityId: params.localityId } : {}),
                ...(params.roleId ? { businessRoleId: params.roleId } : {}),
              },
            },
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      prisma.person.findMany({
        where,
        include: {
          contacts: true,
          assignments: { include: { businessRole: true, locality: true } },
          alliances: { include: { alliance: true, locality: true } },
        },
        orderBy: { displayName: 'asc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.person.count({ where }),
    ])
    return { data, total }
  },

  findCandidates(canonicalName: string, normalizedContacts: string[]) {
    return prisma.person.findMany({
      where: {
        OR: [
          { canonicalName },
          ...(normalizedContacts.length
            ? [{ contacts: { some: { valueNormalized: { in: normalizedContacts } } } }]
            : []),
        ],
      },
      include: { contacts: true },
      take: 20,
    })
  },

  create(data: Prisma.PersonCreateInput) {
    return prisma.person.create({
      data,
      include: {
        contacts: true,
        assignments: { include: { businessRole: true, locality: true } },
        alliances: { include: { alliance: true, locality: true } },
      },
    })
  },

  getById(id: string) {
    return prisma.person.findUnique({
      where: { id },
      include: {
        aliases: { include: { sourceOccurrence: true } },
        contacts: true,
        assignments: { include: { businessRole: true, locality: true } },
        alliances: { include: { alliance: true, locality: true, sourceOccurrence: true } },
      },
    })
  },
}
