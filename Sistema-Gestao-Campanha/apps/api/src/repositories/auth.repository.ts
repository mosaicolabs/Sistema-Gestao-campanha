import { prisma } from '@campanha/database'

export const authRepository = {
  findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        person: true,
        roles: {
          include: {
            accessRole: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    })
  },
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        person: true,
        roles: {
          include: {
            accessRole: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    })
  },
  updateLogin(id: string) {
    return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } })
  },
  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: false },
    })
  },
}
