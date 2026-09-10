import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'

export function validate(schema: ZodType, source: 'body' | 'query' | 'params' = 'body') {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.parse(request[source])
    if (source === 'query' || source === 'params') {
      // Express exposes request query/params through framework-managed
      // properties. Define the validated snapshot so controllers consume the
      // trimmed and schema-checked values instead of the raw input.
      Object.defineProperty(request, source, { value: parsed, configurable: true, enumerable: true, writable: true })
    }
    else request.body = parsed
    next()
  }
}
