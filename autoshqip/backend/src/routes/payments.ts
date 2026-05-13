import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  createSubscription,
  createSubscriptionCheckout,
  cancelSubscription,
  getSubscription,
  createBoost,
  handleWebhook,
  getPortalUrl,
} from '../controllers/paymentsController'

export const paymentsRouter = Router()

paymentsRouter.post('/webhook', handleWebhook)
paymentsRouter.use(authenticate)

paymentsRouter.get('/subscription', getSubscription)
paymentsRouter.get('/portal', getPortalUrl)

paymentsRouter.post(
  '/checkout',
  [body('plan').optional().isIn(['basic', 'premium']).withMessage('Plan duhet të jetë basic ose premium')],
  validate,
  createSubscriptionCheckout,
)

paymentsRouter.post(
  '/subscription',
  [
    body('plan').optional().isIn(['basic', 'premium']).withMessage('Plan duhet të jetë basic ose premium'),
    body('paymentMethodId').optional().isString().trim(),
  ],
  validate,
  createSubscription,
)

paymentsRouter.delete('/subscription', cancelSubscription)

paymentsRouter.post(
  '/boost/:listingId',
  [
    param('listingId').isUUID().withMessage('listingId i pavlefshëm'),
    body('days').optional().isInt({ min: 1, max: 30 }).withMessage('Ditët duhet të jenë 1–30'),
    body('useCredits').optional().isBoolean(),
  ],
  validate,
  createBoost,
)
