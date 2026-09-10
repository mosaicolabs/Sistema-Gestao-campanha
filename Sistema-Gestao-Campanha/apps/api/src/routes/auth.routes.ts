import { Router } from 'express'
import { changePasswordSchema, loginSchema } from '@campanha/validation'
import { authController } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'

export const authRoutes = Router()
authRoutes.post('/login', validate(loginSchema), authController.login)
authRoutes.get('/me', authenticate, authController.me)
authRoutes.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword)
