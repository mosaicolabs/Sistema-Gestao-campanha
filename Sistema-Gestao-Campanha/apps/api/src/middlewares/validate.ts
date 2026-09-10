import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

export function validate(schema: ZodType, source: 'body' | 'query' = 'body') {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.parse(request[source])
    if (source === 'query') {
      // Express 5 exposes `req.query` through a getter. Replacing it with an
      // assignment throws at runtime, so define the validated snapshot on the
      // request object for controllers to consume.
      Object.defineProperty(request, 'query', { value: parsed, configurable: true, enumerable: true, writable: true })
    }
    else request.body = parsed
    next()
  }
}
