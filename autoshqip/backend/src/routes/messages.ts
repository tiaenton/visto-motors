import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'
import { rateLimit } from 'express-rate-limit'

export const messagesRouter = Router()
messagesRouter.use(authenticate)

const msgLimit = rateLimit({ windowMs: 60 * 1000, max: 20 })

messagesRouter.get('/conversations', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId

    const conversations = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        listing: { select: { id: true, title: true, images: { where: { isPrimary: true }, take: 1 } } },
        sender: { select: { id: true, name: true, avatarUrl: true } },
        receiver: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['listingId'],
    })

    res.json(conversations)
  } catch (err) {
    next(err)
  }
})

messagesRouter.get('/:listingId', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId
    const { listingId } = req.params
    const { withUser } = req.query

    const messages = await prisma.message.findMany({
      where: {
        listingId,
        OR: [
          { senderId: userId, receiverId: withUser as string },
          { senderId: withUser as string, receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    await prisma.message.updateMany({
      where: { listingId, receiverId: userId, isRead: false },
      data: { isRead: true },
    })

    res.json(messages)
  } catch (err) {
    next(err)
  }
})

messagesRouter.post('/', msgLimit, async (req, res, next) => {
  try {
    const senderId = (req as any).user.userId
    const { listingId, receiverId, content } = req.body

    if (!content?.trim()) throw new AppError('Mesazhi është bosh', 400)
    if (senderId === receiverId) throw new AppError('Nuk mund të dërgosh mesazh vetes', 400)

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new AppError('Njoftime nuk u gjet', 404)

    const badWords = ['spam', 'xxx']
    const lower = content.toLowerCase()
    if (badWords.some((w) => lower.includes(w))) throw new AppError('Mesazh i papranuar', 400)

    const message = await prisma.message.create({
      data: { listingId, senderId, receiverId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    })

    res.status(201).json(message)
  } catch (err) {
    next(err)
  }
})
