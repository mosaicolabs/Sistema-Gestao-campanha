import type { Request, Response } from 'express'
import { auditRepository } from '../repositories/audit.repository.js'
import { coverageRepository } from '../repositories/coverage.repository.js'
import { dashboardRepository } from '../repositories/dashboard.repository.js'
import { referenceRepository } from '../repositories/reference.repository.js'
import { calendarService } from '../services/calendar.service.js'
import { deliveryService } from '../services/delivery.service.js'
import { taskService } from '../services/task.service.js'
import { AppError } from '../utils/app-error.js'

export const operationsController = {
  async dashboard(_request: Request, response: Response) {
    response.json(await dashboardRepository.snapshot())
  },
  async references(_request: Request, response: Response) {
    response.json(await referenceRepository.all())
  },
  async coverage(request: Request, response: Response) {
    response.json(await coverageRepository.list(request.query.regionId as string | undefined))
  },
  async coverageMacro(request: Request, response: Response) {
    response.json(await coverageRepository.listMacro(request.query.regionId as string | undefined))
  },
  async coverageTree(request: Request, response: Response) {
    response.json(await coverageRepository.listTree(request.query.stateId as string | undefined))
  },
  async coverageCityDetail(request: Request, response: Response) {
    const detail = await coverageRepository.getCityDetail(String(request.params.cityId))
    if (!detail) throw new AppError(404, 'CITY_NOT_FOUND', 'Cidade não encontrada na cobertura.')
    response.json(detail)
  },
  async coverageAllianceDetail(request: Request, response: Response) {
    const detail = await coverageRepository.getAllianceDetail(String(request.params.allianceId))
    if (!detail) throw new AppError(404, 'ALLIANCE_NOT_FOUND', 'Dobrador não encontrado na cobertura.')
    response.json(detail)
  },
  async boards(_request: Request, response: Response) {
    response.json(await taskService.list())
  },
  async createTask(request: Request, response: Response) {
    response.status(201).json(await taskService.create(request.body, request.auth!.userId))
  },
  async moveTask(request: Request, response: Response) {
    response.json(await taskService.move(String(request.params.id), request.body.columnId, request.body.position, request.auth!.userId))
  },
  async events(request: Request, response: Response) {
    response.json(await calendarService.list(request.query.from as string | undefined, request.query.to as string | undefined))
  },
  async createEvent(request: Request, response: Response) {
    response.status(201).json(await calendarService.create(request.body, request.auth!.userId))
  },
  async updateEvent(request: Request, response: Response) {
    response.json(await calendarService.update(String(request.params.id), request.body, request.auth!.userId))
  },
  async deliveries(_request: Request, response: Response) {
    response.json(await deliveryService.list())
  },
  async createDelivery(request: Request, response: Response) {
    response.status(201).json(await deliveryService.create(request.body, request.auth!.userId))
  },
  async audit(_request: Request, response: Response) {
    response.json(await auditRepository.list())
  },
}
