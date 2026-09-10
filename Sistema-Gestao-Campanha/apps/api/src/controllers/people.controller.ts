import type { Request, Response } from 'express'
import { peopleService } from '../services/people.service.js'

export const peopleController = {
  async list(request: Request, response: Response) {
    response.json(await peopleService.list(request.query as never))
  },
  async get(request: Request, response: Response) {
    response.json(await peopleService.get(String(request.params.id)))
  },
  async create(request: Request, response: Response) {
    response.status(201).json(await peopleService.create(request.body, request.auth!.userId))
  },
}
