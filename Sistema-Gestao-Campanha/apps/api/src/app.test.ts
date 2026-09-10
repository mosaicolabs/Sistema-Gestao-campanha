import { describe, expect, it } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from './app.js'
import { env } from './config/env.js'

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

  it('protege a visão macro e rejeita região vazia antes do banco', async () => {
    const unauthorized = await request(app).get('/api/coverage/macro')
    expect(unauthorized.status).toBe(401)

    const token = jwt.sign({ sub: 'test-user', username: 'test', permissions: ['coverage:read'], mustChangePassword: false }, env.JWT_SECRET)
    const invalid = await request(app).get('/api/coverage/macro?regionId=').set('Authorization', `Bearer ${token}`)
    expect(invalid.status).toBe(422)
  })

  it('protege a árvore e valida parâmetros de cidade antes do banco', async () => {
    const unauthorized = await request(app).get('/api/coverage/tree')
    expect(unauthorized.status).toBe(401)

    const forbiddenToken = jwt.sign({ sub: 'test-user', username: 'test', permissions: ['people:read'], mustChangePassword: false }, env.JWT_SECRET)
    const forbidden = await request(app).get('/api/coverage/tree').set('Authorization', `Bearer ${forbiddenToken}`)
    expect(forbidden.status).toBe(403)

    const token = jwt.sign({ sub: 'test-user', username: 'test', permissions: ['coverage:read'], mustChangePassword: false }, env.JWT_SECRET)
    const invalid = await request(app).get('/api/coverage/cities/%20/detail').set('Authorization', `Bearer ${token}`)
    expect(invalid.status).toBe(422)
  })
})
