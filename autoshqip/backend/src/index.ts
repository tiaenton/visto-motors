import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import path from 'path'

import { authRouter } from './routes/auth'
import { listingsRouter } from './routes/listings'
import { usersRouter } from './routes/users'
import { paymentsRouter } from './routes/payments'
import { referralRouter } from './routes/referral'
import { messagesRouter } from './routes/messages'
import { adminRouter } from './routes/admin'
import { uploadRouter } from './routes/upload'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(compression())
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Shumë kërkesa. Provo përsëri pas 15 minutash.' },
})

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api/auth', authLimiter, authRouter)
app.use('/api/listings', listingsRouter)
app.use('/api/users', usersRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/referral', referralRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/admin', adminRouter)
app.use('/api/upload', uploadRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`AutoShqip API running on port ${PORT}`)
})

export default app
