import type { PermissionKey } from '@campanha/types'

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
        username: string
        permissions: PermissionKey[]
        mustChangePassword: boolean
      }
    }
  }
}

export {}
