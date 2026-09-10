import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler } from './middlewares/error-handler.js'
import { authRoutes } from './routes/auth.routes.js'
import { protectedRoutes } from './routes/protected.routes.js'

export const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/health', (_request, response) => response.json({ status: 'ok' }))
app.get('/api/docs', (_request, response) =>
  response.json({
    name: 'API Sistema de Gestão da Campanha',
    auth: 'Bearer JWT, validade de 15 minutos',
    resources: ['/auth', '/dashboard', '/people', '/coverage', '/coverage/macro', '/boards', '/tasks', '/calendar-events', '/deliveries', '/imports', '/reconciliation-issues', '/product-decisions', '/audit-logs'],
    conditional: { whatsapp: 'Possibilidade mencionada. Integração desativada até decisão do gestor.' },
  }),
)

app.use(
  '/api/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }),
)
app.use('/api/auth', authRoutes)
app.use('/api', protectedRoutes)

app.use((_request, response) => response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } }))
app.use(errorHandler)
