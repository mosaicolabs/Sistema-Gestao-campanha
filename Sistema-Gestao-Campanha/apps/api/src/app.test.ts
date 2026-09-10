import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from './app.js'

describe('API HTTP', () => {
  it('expõe healthcheck', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('bloqueia recurso protegido sem JWT', async () => {
    const response = await request(app).get('/api/dashboard')
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTH_REQUIRED')
  })
})
