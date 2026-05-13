import { Router } from 'express'
import { body } from 'express-validator'
import {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'

export const authRouter = Router()

authRouter.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Fjalëkalimi duhet të ketë të paktën 8 karaktere'),
    body('name').trim().isLength({ min: 2 }),
    body('phone').optional().isMobilePhone('any'),
    body('referralCode').optional().isString(),
  ],
  validate,
  register
)

authRouter.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  login
)

authRouter.post('/refresh', refreshToken)
authRouter.post('/logout', authenticate, logout)
authRouter.get('/verify-email/:token', verifyEmail)
authRouter.post('/forgot-password', [body('email').isEmail()], validate, forgotPassword)
authRouter.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  resetPassword
)
authRouter.get('/me', authenticate, getMe)
