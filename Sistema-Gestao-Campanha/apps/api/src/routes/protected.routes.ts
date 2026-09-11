import { Router } from 'express'
import multer from 'multer'
import {
  createDeliverySchema,
  coverageAllianceParamSchema,
  coverageCityParamSchema,
  coverageMacroQuerySchema,
  coverageTreeQuerySchema,
  createEventSchema,
  createPersonSchema,
  createTaskSchema,
  moveTaskSchema,
  peopleQuerySchema,
  reconciliationDecisionSchema,
  createUserSchema,
  updateUserStatusSchema,
  updateEventSchema,
  materializationBatchParamSchema,
  materializationApplySchema,
} from '@campanha/validation'
import { importController } from '../controllers/import.controller.js'
import { operationsController } from '../controllers/operations.controller.js'
import { peopleController } from '../controllers/people.controller.js'
import { userController } from '../controllers/user.controller.js'
import { authenticate, requirePasswordChanged, requirePermission } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const valid = file.originalname.toLowerCase().endsWith('.xlsx')
    if (!valid) return callback(new Error('Apenas arquivos .xlsx são aceitos.'))
    callback(null, true)
  },
})

export const protectedRoutes = Router()
protectedRoutes.use(authenticate, requirePasswordChanged)

protectedRoutes.get('/dashboard', requirePermission('dashboard', 'read'), operationsController.dashboard)
protectedRoutes.get('/references', operationsController.references)
protectedRoutes.get('/coverage', requirePermission('coverage', 'read'), operationsController.coverage)
protectedRoutes.get('/coverage/macro', requirePermission('coverage', 'read'), validate(coverageMacroQuerySchema, 'query'), operationsController.coverageMacro)
protectedRoutes.get('/coverage/tree', requirePermission('coverage', 'read'), validate(coverageTreeQuerySchema, 'query'), operationsController.coverageTree)
protectedRoutes.get('/coverage/cities/:cityId/detail', requirePermission('coverage', 'read'), validate(coverageCityParamSchema, 'params'), operationsController.coverageCityDetail)
protectedRoutes.get('/coverage/alliances/:allianceId/detail', requirePermission('coverage', 'read'), validate(coverageAllianceParamSchema, 'params'), operationsController.coverageAllianceDetail)

protectedRoutes.get('/people', requirePermission('people', 'read'), validate(peopleQuerySchema, 'query'), peopleController.list)
protectedRoutes.get('/people/:id', requirePermission('people', 'read'), peopleController.get)
protectedRoutes.post('/people', requirePermission('people', 'create'), validate(createPersonSchema), peopleController.create)

protectedRoutes.get('/boards', requirePermission('tasks', 'read'), operationsController.boards)
protectedRoutes.post('/tasks', requirePermission('tasks', 'create'), validate(createTaskSchema), operationsController.createTask)
protectedRoutes.patch('/tasks/:id/move', requirePermission('tasks', 'update'), validate(moveTaskSchema), operationsController.moveTask)

protectedRoutes.get('/calendar-events', requirePermission('calendar', 'read'), operationsController.events)
protectedRoutes.post('/calendar-events', requirePermission('calendar', 'create'), validate(createEventSchema), operationsController.createEvent)
protectedRoutes.put('/calendar-events/:id', requirePermission('calendar', 'update'), validate(updateEventSchema), operationsController.updateEvent)

protectedRoutes.get('/deliveries', requirePermission('deliveries', 'read'), operationsController.deliveries)
protectedRoutes.post('/deliveries', requirePermission('deliveries', 'create'), validate(createDeliverySchema), operationsController.createDelivery)

protectedRoutes.get('/imports', requirePermission('imports', 'read'), importController.batches)
protectedRoutes.post('/imports', requirePermission('imports', 'create'), upload.single('file'), importController.upload)
protectedRoutes.get('/reconciliation-issues', requirePermission('imports', 'read'), importController.issues)
protectedRoutes.post('/reconciliation-issues/:id/decisions', requirePermission('imports', 'reconcile'), validate(reconciliationDecisionSchema), importController.decide)
protectedRoutes.get('/imports/:batchId/materialization/preview', requirePermission('imports', 'read'), validate(materializationBatchParamSchema, 'params'), importController.materializationPreview)
protectedRoutes.post('/imports/:batchId/materialization/preview', requirePermission('imports', 'read'), validate(materializationBatchParamSchema, 'params'), importController.materializationPreview)
protectedRoutes.post('/imports/:batchId/materialization/apply', requirePermission('imports', 'reconcile'), validate(materializationBatchParamSchema, 'params'), validate(materializationApplySchema), importController.materializationApply)
protectedRoutes.get('/product-decisions', requirePermission('imports', 'read'), importController.decisions)

protectedRoutes.get('/audit-logs', requirePermission('audit', 'read'), operationsController.audit)
protectedRoutes.get('/users', requirePermission('users', 'manage'), userController.list)
protectedRoutes.post('/users', requirePermission('users', 'manage'), validate(createUserSchema), userController.create)
protectedRoutes.patch('/users/:id/status', requirePermission('users', 'manage'), validate(updateUserStatusSchema), userController.status)
