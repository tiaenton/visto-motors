import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  createSubscription,
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
paymentsRouter.post('/subscription', createSubscription)
paymentsRouter.delete('/subscription', cancelSubscription)
paymentsRouter.post('/boost/:listingId', createBoost)
paymentsRouter.get('/portal', getPortalUrl)
