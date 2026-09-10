import type { CreateTaskInput } from '@campanha/validation'
import { auditRepository } from '../repositories/audit.repository.js'
import { taskRepository } from '../repositories/task.repository.js'
import { AppError } from '../utils/app-error.js'

export const taskService = {
  list: () => taskRepository.listBoards(),

  async create(input: CreateTaskInput, userId: string) {
    const task = await taskRepository.create({
      board: { connect: { id: input.boardId } },
      column: { connect: { id: input.columnId } },
      title: input.title,
      description: input.description,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      priority: input.priority,
      createdBy: { connect: { id: userId } },
      assignees: { create: input.assigneeIds.map((id) => ({ user: { connect: { id } } })) },
    })
    await auditRepository.record({ userId, action: 'CREATE', entityType: 'Task', entityId: task.id, afterData: { title: task.title } })
    return task
  },

  async move(id: string, columnId: string, position: number, userId: string) {
    const before = await taskRepository.getById(id)
    if (!before) throw new AppError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada.')
    const task = await taskRepository.move(id, columnId, position)
    await auditRepository.record({
      userId,
      action: 'MOVE',
      entityType: 'Task',
      entityId: id,
      beforeData: { columnId: before.columnId, position: before.position },
      afterData: { columnId, position },
    })
    return task
  },
}
