import { prisma, type Prisma } from '@campanha/database'

export const taskRepository = {
  listBoards() {
    return prisma.kanbanBoard.findMany({
      where: { status: 'ACTIVE' },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
              include: { assignees: { include: { user: { include: { person: true } } } } },
            },
          },
        },
      },
    })
  },
  create(data: Prisma.TaskCreateInput) {
    return prisma.task.create({ data, include: { assignees: true } })
  },
  getById(id: string) {
    return prisma.task.findUnique({ where: { id } })
  },
  move(id: string, columnId: string, position: number) {
    return prisma.task.update({ where: { id }, data: { columnId, position } })
  },
}
