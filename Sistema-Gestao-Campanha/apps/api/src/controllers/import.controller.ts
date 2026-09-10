import type { Request, Response } from 'express'
import { importService } from '../services/import.service.js'
import { AppError } from '../utils/app-error.js'

export const importController = {
  async upload(request: Request, response: Response) {
    if (!request.file) throw new AppError(422, 'FILE_REQUIRED', 'Selecione uma planilha .xlsx.')
    response.status(201).json(await importService.process(request.file, request.auth!.userId))
  },
  async batches(_request: Request, response: Response) {
    response.json(await importService.listBatches())
  },
  async issues(request: Request, response: Response) {
    response.json(await importService.listIssues(request.query.status as never))
  },
  async decisions(_request: Request, response: Response) {
    response.json(await importService.listDecisions())
  },
  async decide(request: Request, response: Response) {
    response.status(201).json(await importService.decide(String(request.params.id), request.auth!.userId, request.body))
  },
}
