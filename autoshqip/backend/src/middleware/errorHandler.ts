import { Request, Response, NextFunction } from 'express'
import * as Sentry from '@sentry/node'
import { AppError } from '../utils/AppError'
import { logger } from '../utils/logger'

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Të dhënat ekzistojnë tashmë' })
    if (err.code === 'P2025') return res.status(404).json({ error: 'Nuk u gjet' })
  }

  logger.error(err)
  if (process.env.SENTRY_DSN) Sentry.captureException(err)
  res.status(500).json({ error: 'Gabim i brendshëm i serverit' })
}
