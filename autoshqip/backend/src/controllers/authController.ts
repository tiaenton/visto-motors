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

const BRUTE_WINDOW_SECS = 15 * 60        // 15-minute sliding window + lockout duration
const BRUTE_MAX_ATTEMPTS = 5             // lock after 5 failures

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '15m' })
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' })
  return { accessToken, refreshToken }
}

function getIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
    || req.socket.remoteAddress
    || 'unknown'
}

async function recordFailedLogin(ip: string, email: string): Promise<number> {
  const ipKey = `brute:ip:${ip}`
  const emailKey = `brute:email:${email}`
  const [ipCount] = await Promise.all([
    redis.incr(ipKey),
    redis.incr(emailKey),
  ])
  // Only set TTL on first increment (so the window slides from first failure)
  if (ipCount === 1) await redis.expire(ipKey, BRUTE_WINDOW_SECS)
  await redis.expire(emailKey, BRUTE_WINDOW_SECS)
  return ipCount
}

async function clearLoginFailures(ip: string, email: string) {
  await Promise.all([
    redis.del(`brute:ip:${ip}`),
    redis.del(`brute:email:${email}`),
  ])
}

async function isLockedOut(ip: string, email: string): Promise<boolean> {
  const [ipCount, emailCount] = await Promise.all([
    redis.get(`brute:ip:${ip}`),
    redis.get(`brute:email:${email}`),
  ])
  return parseInt(ipCount || '0') >= BRUTE_MAX_ATTEMPTS
    || parseInt(emailCount || '0') >= BRUTE_MAX_ATTEMPTS
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
      data: { email, password: hashedPassword, name, phone, verifyToken, referredById },
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
    const ip = getIp(req)

    // Check lockout before touching the DB
    if (await isLockedOut(ip, email)) {
      throw new AppError('Shumë tentativa të dështuara. Provo përsëri pas 15 minutash.', 429)
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always compare password to prevent user-enumeration timing attacks
    const dummyHash = '$2a$12$invalidhashinvalidhashinvalidhashinvalidhashinvalidhashxx'
    const valid = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash).then(() => false)

    if (!user || !valid) {
      await recordFailedLogin(ip, email)
      const remaining = BRUTE_MAX_ATTEMPTS - parseInt((await redis.get(`brute:ip:${ip}`)) || '0')
      throw new AppError(
        remaining <= 2
          ? `Email ose fjalëkalim i pasaktë. Mbeten ${Math.max(0, remaining)} tentativa.`
          : 'Email ose fjalëkalim i pasaktë',
        401,
      )
    }

    if (!user.isVerified) {
      throw new AppError('Llogaria nuk është verifikuar. Kontrollo emailin tënd.', 403)
    }

    // Successful login — clear failure counters
    await clearLoginFailures(ip, email)

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

    let payload: { userId: string }
    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
    } catch {
      throw new AppError('Token i pavlefshëm ose ka skaduar', 401)
    }

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
    if (!user) throw new AppError('Ky link verifikimi është i pavlefshëm ose ka skaduar.', 400)

    if (user.isVerified) {
      return res.json({ message: 'Email është tashmë i verifikuar.' })
    }

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

    // Always return the same message (anti-enumeration)
    const genericMsg = { message: 'Nëse emaili ekziston, do të marrësh një link.' }

    if (!user) return res.json(genericMsg)

    // Rate-limit reset requests per email (max 3 per hour)
    const rlKey = `pwreset:${email}`
    const attempts = await redis.incr(rlKey)
    if (attempts === 1) await redis.expire(rlKey, 3600)
    if (attempts > 3) return res.json(genericMsg)

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
      ...genericMsg,
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
    if (!user) throw new AppError('Link i pavlefshëm ose ka skaduar. Kërko një link të ri.', 400)

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    })

    // Invalidate all active sessions on password change
    await redis.del(`refresh:${user.id}`)
    res.json({ message: 'Fjalëkalimi u ndryshua me sukses. Hyr me fjalëkalimin e ri.' })
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
