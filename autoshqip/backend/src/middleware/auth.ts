import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../utils/AppError'

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return next(new AppError('Autentifikim i nevojshëm', 401))

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!)
    ;(req as any).user = payload
    next()
  } catch {
    next(new AppError('Token i pavlefshëm', 401))
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!)
      ;(req as any).user = payload
    } catch {}
  }
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req as any).user?.role !== 'ADMIN') return next(new AppError('Vetëm për admin', 403))
  next()
}
