import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import type { PermissionKey } from '@campanha/types'
import { env } from '../config/env.js'
import { AppError } from '../utils/app-error.js'

type TokenPayload = {
  sub: string
  username: string
  permissions: PermissionKey[]
  mustChangePassword: boolean
}

export function authenticate(request: Request, _response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) throw new AppError(401, 'AUTH_REQUIRED', 'Faça login para continuar.')

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload
    request.auth = {
      userId: payload.sub,
      username: payload.username,
      permissions: payload.permissions,
      mustChangePassword: payload.mustChangePassword,
    }
    next()
  } catch {
    throw new AppError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }
}

export function requirePasswordChanged(request: Request, _response: Response, next: NextFunction) {
  if (request.auth?.mustChangePassword) {
    throw new AppError(403, 'PASSWORD_CHANGE_REQUIRED', 'Defina uma nova senha antes de acessar o sistema.')
  }
  next()
}

export function requirePermission(resource: string, action: string) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const key = `${resource}:${action}` as PermissionKey
    if (!request.auth?.permissions.includes(key)) {
      throw new AppError(403, 'FORBIDDEN', 'Seu perfil não permite esta operação.')
    }
    next()
  }
}
