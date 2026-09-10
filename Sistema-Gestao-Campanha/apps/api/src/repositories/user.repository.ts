import { prisma } from '@campanha/database'

export const userRepository = {
  list() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        status: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
        person: { select: { id: true, displayName: true } },
        roles: { include: { accessRole: { select: { id: true, code: true, name: true } } } },
      },
      orderBy: { username: 'asc' },
    })
  },
  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } })
  },
  create(data: { username: string; passwordHash: string; personId?: string; accessRoleId: string }) {
    return prisma.user.create({
      data: {
        username: data.username,
        passwordHash: data.passwordHash,
        mustChangePassword: true,
        ...(data.personId ? { person: { connect: { id: data.personId } } } : {}),
        roles: { create: { accessRole: { connect: { id: data.accessRoleId } }, scopeType: 'GLOBAL' } },
      },
      select: { id: true, username: true, status: true, mustChangePassword: true },
    })
  },
  updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    return prisma.user.update({ where: { id }, data: { status }, select: { id: true, username: true, status: true } })
  },
}
