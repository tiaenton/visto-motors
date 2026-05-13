import { Router, Request, Response, NextFunction } from 'express'
import { body, param, query } from 'express-validator'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'

export const adminRouter = Router()
adminRouter.use(authenticate, requireAdmin)

const VALID_LISTING_STATUSES = ['ACTIVE', 'DRAFT', 'SOLD', 'EXPIRED', 'REJECTED']
const VALID_ROLES = ['USER', 'DEALER', 'ADMIN']

adminRouter.get('/stats', async (_, res, next) => {
  try {
    const [users, listings, activeListings, subscriptions] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ])
    res.json({ users, listings, activeListings, activeSubscriptions: subscriptions, monthlyRevenue: subscriptions * 5 })
  } catch (err) { next(err) }
})

adminRouter.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt((req.query.page as string) || '1')
      const limit = Math.min(parseInt((req.query.limit as string) || '50'), 100)
      const skip = (page - 1) * limit
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip, take: limit,
          select: { id: true, email: true, name: true, role: true, isVerified: true, createdAt: true, _count: { select: { listings: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ])
      res.json({ data: users, total })
    } catch (err) { next(err) }
  },
)

adminRouter.patch(
  '/users/:id',
  [
    param('id').isUUID(),
    body('role').optional().isIn(VALID_ROLES).withMessage(`Role duhet të jetë: ${VALID_ROLES.join(', ')}`),
    body('isVerified').optional().isBoolean(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Whitelist what admins can patch — never allow password, email, or tokens via this route
      const { role, isVerified, name } = req.body
      const data: Record<string, unknown> = {}
      if (role !== undefined) data.role = role
      if (isVerified !== undefined) data.isVerified = isVerified
      if (name !== undefined) data.name = name

      if (Object.keys(data).length === 0) throw new AppError('Nuk ka ndryshime për të aplikuar', 400)

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data,
        select: { id: true, email: true, name: true, role: true, isVerified: true },
      })
      res.json(user)
    } catch (err) { next(err) }
  },
)

adminRouter.get(
  '/listings',
  [
    query('status').optional().isIn(VALID_LISTING_STATUSES),
    query('page').optional().isInt({ min: 1 }).toInt(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
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
  },
)

adminRouter.patch(
  '/listings/:id',
  [
    param('id').isUUID(),
    body('status').optional().isIn(VALID_LISTING_STATUSES),
    body('isFeatured').optional().isBoolean(),
    body('price').optional().isFloat({ min: 0 }),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, isFeatured, price } = req.body
      const data: Record<string, unknown> = {}
      if (status !== undefined) data.status = status
      if (isFeatured !== undefined) data.isFeatured = isFeatured
      if (price !== undefined) data.price = price

      if (Object.keys(data).length === 0) throw new AppError('Nuk ka ndryshime për të aplikuar', 400)

      const listing = await prisma.listing.update({ where: { id: req.params.id }, data })
      res.json(listing)
    } catch (err) { next(err) }
  },
)

adminRouter.delete(
  '/listings/:id',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.listing.delete({ where: { id: req.params.id } })
      res.json({ message: 'U fshi' })
    } catch (err) { next(err) }
  },
)
