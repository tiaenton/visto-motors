import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'

export const referralRouter = Router()

referralRouter.use(authenticate)

referralRouter.get('/stats', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, creditBalance: true, _count: { select: { referrals: true } } },
    })
    if (!user) throw new AppError('Nuk u gjet', 404)

    const transactions = await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    res.json({
      referralCode: user.referralCode,
      creditBalance: user.creditBalance,
      totalReferrals: user._count.referrals,
      totalEarned: transactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
      transactions,
    })
  } catch (err) {
    next(err)
  }
})

referralRouter.get('/link', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    })
    if (!user) throw new AppError('Nuk u gjet', 404)

    const link = `${process.env.FRONTEND_URL}/register?ref=${user.referralCode}`
    res.json({ link, code: user.referralCode })
  } catch (err) {
    next(err)
  }
})
