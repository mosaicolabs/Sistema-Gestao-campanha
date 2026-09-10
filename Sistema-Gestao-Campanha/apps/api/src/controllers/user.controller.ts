import type { Request, Response } from 'express'
import { userService } from '../services/user.service.js'

export const userController = {
  async list(_request: Request, response: Response) { response.json(await userService.list()) },
  async create(request: Request, response: Response) { response.status(201).json(await userService.create(request.body, request.auth!.userId)) },
  async status(request: Request, response: Response) { response.json(await userService.status(String(request.params.id), request.body.status, request.auth!.userId)) },
}
