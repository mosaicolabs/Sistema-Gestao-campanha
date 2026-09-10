import bcrypt from 'bcrypt'
import type { CreateUserInput } from '@campanha/validation'
import { env } from '../config/env.js'
import { auditRepository } from '../repositories/audit.repository.js'
import { userRepository } from '../repositories/user.repository.js'
import { AppError } from '../utils/app-error.js'

export const userService = {
  list: () => userRepository.list(),
  async create(input: CreateUserInput, authorId: string) {
    if (await userRepository.findByUsername(input.username)) throw new AppError(409, 'USERNAME_IN_USE', 'Este nome de usuário já está em uso.')
    const user = await userRepository.create({
      username: input.username,
      passwordHash: await bcrypt.hash(input.password, env.BCRYPT_ROUNDS),
      personId: input.personId,
      accessRoleId: input.accessRoleId,
    })
    await auditRepository.record({ userId: authorId, action: 'CREATE', entityType: 'User', entityId: user.id, afterData: { username: user.username, status: user.status } })
    return user
  },
  async status(id: string, status: 'ACTIVE' | 'SUSPENDED', authorId: string) {
    if (id === authorId && status === 'SUSPENDED') throw new AppError(422, 'SELF_SUSPEND_BLOCKED', 'Você não pode suspender a própria conta.')
    const user = await userRepository.updateStatus(id, status)
    await auditRepository.record({ userId: authorId, action: 'STATUS_CHANGE', entityType: 'User', entityId: id, afterData: { status } })
    return user
  },
}
