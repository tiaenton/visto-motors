import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'

export const usersRouter = Router()
usersRouter.use(authenticate)

usersRouter.put('/profile', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId
    const { name, phone, city, avatarUrl } = req.body
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, city, avatarUrl },
      select: { id: true, name: true, phone: true, city: true, avatarUrl: true, email: true },
    })
    res.json(user)
  } catch (err) { next(err) }
})

usersRouter.get('/credits', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId
    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { creditBalance: true } }),
      prisma.creditTransaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 }),
    ])
    res.json({ balance: user?.creditBalance ?? 0, transactions })
  } catch (err) { next(err) }
})
