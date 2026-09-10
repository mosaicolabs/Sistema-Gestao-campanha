import type { Request, Response } from 'express'
import { authService } from '../services/auth.service.js'

export const authController = {
  async login(request: Request, response: Response) {
    response.json(await authService.login(request.body))
  },
  async me(request: Request, response: Response) {
    response.json(await authService.me(request.auth!.userId))
  },
  async changePassword(request: Request, response: Response) {
    response.json(await authService.changePassword(request.auth!.userId, request.body))
  },
}
