import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { validate } from './validate.js'

describe('validate', () => {
  it('substitui req.query validado mesmo quando Express expõe getter', () => {
    let nextCalled = false
    const request = {} as { query: unknown }
    Object.defineProperty(request, 'query', { get: () => ({ regionId: 'region-1' }), configurable: true })
    validate(z.object({ regionId: z.string().min(1) }), 'query')(request as never, {} as never, () => { nextCalled = true })
    expect(request.query).toEqual({ regionId: 'region-1' })
    expect(nextCalled).toBe(true)
  })
})
