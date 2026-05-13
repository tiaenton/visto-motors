import { Router, Request, Response, NextFunction } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { prisma } from '../utils/prisma'

export const usersRouter = Router()
usersRouter.use(authenticate)

usersRouter.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Emri duhet të jetë 2–100 karaktere'),
    body('phone').optional({ nullable: true }).trim().isMobilePhone('any').withMessage('Numri i telefonit është i pavlefshëm'),
    body('city').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('avatarUrl').optional({ nullable: true }).trim().isURL().withMessage('URL e avatarit është e pavlefshme'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
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
  },
)

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
