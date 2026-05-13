import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { prisma } from '../utils/prisma'
import { redis } from '../utils/redis'
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService'
import { AppError } from '../utils/AppError'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' })
  return { accessToken, refreshToken }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, phone, referralCode } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new AppError('Email ekziston tashmë', 409)

    const hashedPassword = await bcrypt.hash(password, 12)
    const verifyToken = uuid()

    let referredById: string | undefined
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } })
      if (referrer) referredById = referrer.id
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        verifyToken,
        referredById,
      },
      select: { id: true, email: true, name: true, role: true, referralCode: true },
    })

    let emailSent = true
    try {
      await sendVerificationEmail(email, name, verifyToken)
    } catch {
      emailSent = false
    }

    const isDev = process.env.NODE_ENV !== 'production'

    res.status(201).json({
      message: 'Regjistrim i suksesshëm. Kontrollo emailin për verifikim.',
      user,
      ...(isDev && !emailSent && { verifyToken, _devNote: 'SMTP not configured — use verifyToken directly' }),
    })
  } catch (err) {
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new AppError('Email ose fjalëkalim i pasaktë', 401)

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw new AppError('Email ose fjalëkalim i pasaktë', 401)

    if (!user.isVerified) throw new AppError('Verifiko emailin para se të hysh', 403)

    const { accessToken, refreshToken } = generateTokens(user.id, user.role)

    await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, refreshToken)

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        creditBalance: user.creditBalance,
        referralCode: user.referralCode,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: token } = req.body
    if (!token) throw new AppError('Token mungon', 401)

    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
    const stored = await redis.get(`refresh:${payload.userId}`)
    if (stored !== token) throw new AppError('Token i pavlefshëm', 401)

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) throw new AppError('Përdoruesi nuk u gjet', 404)

    const tokens = generateTokens(user.id, user.role)
    await redis.setex(`refresh:${user.id}`, 30 * 24 * 60 * 60, tokens.refreshToken)

    res.json(tokens)
  } catch (err) {
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    await redis.del(`refresh:${userId}`)
    res.json({ message: 'Doli me sukses' })
  } catch (err) {
    next(err)
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params
    const user = await prisma.user.findFirst({ where: { verifyToken: token } })
    if (!user) throw new AppError('Token i pavlefshëm', 400)

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyToken: null },
    })

    if (user.referredById) {
      await prisma.$transaction([
        prisma.creditTransaction.create({
          data: {
            userId: user.referredById,
            amount: 2.5,
            type: 'REFERRAL_BONUS',
            description: `Bonus referimi nga ${user.email}`,
            referenceId: user.id,
          },
        }),
        prisma.user.update({
          where: { id: user.referredById },
          data: { creditBalance: { increment: 2.5 } },
        }),
      ])
    }

    res.json({ message: 'Email u verifikua me sukses!' })
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.json({ message: 'Nëse emaili ekziston, do të marrësh një link.' })
    }

    const resetToken = uuid()
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
    })

    let emailSent = true
    try {
      await sendPasswordResetEmail(email, user.name, resetToken)
    } catch {
      emailSent = false
    }

    const isDev = process.env.NODE_ENV !== 'production'
    res.json({
      message: 'Nëse emaili ekziston, do të marrësh një link.',
      ...(isDev && !emailSent && { resetToken, _devNote: 'SMTP not configured — use resetToken directly' }),
    })
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    })
    if (!user) throw new AppError('Token i pavlefshëm ose ka skaduar', 400)

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    })

    await redis.del(`refresh:${user.id}`)
    res.json({ message: 'Fjalëkalimi u ndryshua me sukses' })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, phone: true,
        role: true, city: true, avatarUrl: true,
        creditBalance: true, referralCode: true,
        isVerified: true, createdAt: true,
        _count: { select: { listings: true, referrals: true } },
      },
    })
    if (!user) throw new AppError('Përdoruesi nuk u gjet', 404)
    res.json(user)
  } catch (err) {
    next(err)
  }
}
