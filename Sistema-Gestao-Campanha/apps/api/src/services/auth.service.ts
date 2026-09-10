import bcrypt from 'bcrypt'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { AuthResponse, PermissionKey, SessionUser } from '@campanha/types'
import type { ChangePasswordInput, LoginInput } from '@campanha/validation'
import { env } from '../config/env.js'
import { authRepository } from '../repositories/auth.repository.js'
import { auditRepository } from '../repositories/audit.repository.js'
import { AppError } from '../utils/app-error.js'

type AuthUser = NonNullable<Awaited<ReturnType<typeof authRepository.findByUsername>>>

function toSessionUser(user: AuthUser): SessionUser {
  const permissions = new Set<PermissionKey>()
  for (const userRole of user.roles) {
    for (const rolePermission of userRole.accessRole.permissions) {
      permissions.add(`${rolePermission.permission.resource}:${rolePermission.permission.action}`)
    }
  }
  return {
    id: user.id,
    username: user.username,
    displayName: user.person?.displayName ?? user.username,
    mustChangePassword: user.mustChangePassword,
    permissions: [...permissions],
  }
}

function issueToken(user: SessionUser) {
  return jwt.sign(
    {
      username: user.username,
      permissions: user.permissions,
      mustChangePassword: user.mustChangePassword,
    },
    env.JWT_SECRET,
    { subject: user.id, expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] },
  )
}

export const authService = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findByUsername(input.username)
    if (!user || user.status !== 'ACTIVE' || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Usuário ou senha inválidos.')
    }

    await authRepository.updateLogin(user.id)
    const sessionUser = toSessionUser(user)
    return { accessToken: issueToken(sessionUser), expiresIn: 900, user: sessionUser }
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId)
    if (!user || user.status !== 'ACTIVE') throw new AppError(401, 'INVALID_SESSION', 'Conta indisponível.')
    return toSessionUser(user as AuthUser)
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<AuthResponse> {
    const user = await authRepository.findById(userId)
    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new AppError(422, 'CURRENT_PASSWORD_INVALID', 'A senha atual não confere.')
    }
    if (await bcrypt.compare(input.password, user.passwordHash)) {
      throw new AppError(422, 'PASSWORD_REUSED', 'Escolha uma senha diferente da temporária.')
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS)
    await authRepository.updatePassword(user.id, passwordHash)
    await auditRepository.record({ userId, action: 'PASSWORD_CHANGED', entityType: 'User', entityId: userId })
    const updated = await authRepository.findById(userId)
    const sessionUser = toSessionUser(updated as AuthUser)
    return { accessToken: issueToken(sessionUser), expiresIn: 900, user: sessionUser }
  },
}
