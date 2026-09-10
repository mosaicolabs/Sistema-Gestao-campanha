import type { Request, Response } from 'express'
import { auditRepository } from '../repositories/audit.repository.js'
import { coverageRepository } from '../repositories/coverage.repository.js'
import { dashboardRepository } from '../repositories/dashboard.repository.js'
import { referenceRepository } from '../repositories/reference.repository.js'
import { calendarService } from '../services/calendar.service.js'
import { deliveryService } from '../services/delivery.service.js'
import { taskService } from '../services/task.service.js'

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
