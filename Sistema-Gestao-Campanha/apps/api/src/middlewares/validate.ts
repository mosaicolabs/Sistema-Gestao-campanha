import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

export function validate(schema: ZodType, source: 'body' | 'query' = 'body') {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.parse(request[source])
    if (source === 'query') request.query = parsed as Request['query']
    else request.body = parsed
    next()
  }
}
