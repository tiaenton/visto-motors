import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth'
import { prisma } from '../utils/prisma'

export const adminRouter = Router()
adminRouter.use(authenticate, requireAdmin)

adminRouter.get('/stats', async (_, res, next) => {
  try {
    const [users, listings, activeListings, subscriptions, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ])
    res.json({ users, listings, activeListings, activeSubscriptions: subscriptions, monthlyRevenue: revenue * 5 })
  } catch (err) { next(err) }
})

adminRouter.get('/users', async (req, res, next) => {
  try {
    const { page = '1', limit = '50' } = req.query as any
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip, take: parseInt(limit),
        select: { id: true, email: true, name: true, role: true, isVerified: true, createdAt: true, _count: { select: { listings: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ])
    res.json({ data: users, total })
  } catch (err) { next(err) }
})

adminRouter.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body })
    res.json(user)
  } catch (err) { next(err) }
})

adminRouter.get('/listings', async (req, res, next) => {
  try {
    const { status, page = '1' } = req.query as any
    const skip = (parseInt(page) - 1) * 50
    const where = status ? { status } : {}
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where, skip, take: 50,
        include: { user: { select: { name: true, email: true } }, images: { where: { isPrimary: true }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.listing.count({ where }),
    ])
    res.json({ data: listings, total })
  } catch (err) { next(err) }
})

adminRouter.patch('/listings/:id', async (req, res, next) => {
  try {
    const listing = await prisma.listing.update({ where: { id: req.params.id }, data: req.body })
    res.json(listing)
  } catch (err) { next(err) }
})

adminRouter.delete('/listings/:id', async (req, res, next) => {
  try {
    await prisma.listing.delete({ where: { id: req.params.id } })
    res.json({ message: 'U fshi' })
  } catch (err) { next(err) }
})
