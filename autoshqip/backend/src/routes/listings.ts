import { Router } from 'express'
import { body, query } from 'express-validator'
import {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  saveListing,
  unsaveListing,
  getSavedListings,
  markAsSold,
  incrementViews,
} from '../controllers/listingsController'
import { authenticate, optionalAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'

export const listingsRouter = Router()

listingsRouter.get('/', optionalAuth, getListings)
listingsRouter.get('/saved', authenticate, getSavedListings)
listingsRouter.get('/my', authenticate, getMyListings)
listingsRouter.get('/:id', optionalAuth, getListing)
listingsRouter.post('/:id/views', incrementViews)
listingsRouter.post('/:id/save', authenticate, saveListing)
listingsRouter.delete('/:id/save', authenticate, unsaveListing)
listingsRouter.post('/:id/sold', authenticate, markAsSold)

listingsRouter.post('/',
  authenticate,
  [
    body('title').trim().isLength({ min: 5 }),
    body('price').isFloat({ min: 0 }),
    body('year').isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
    body('make').trim().notEmpty(),
    body('model').trim().notEmpty(),
    body('mileage').isInt({ min: 0 }),
    body('fuelType').isIn(['BENZINE', 'DIESEL', 'ELEKTRIK', 'HIBRID', 'GAS']),
    body('transmission').isIn(['MANUAL', 'AUTOMATIK']),
    body('city').trim().notEmpty(),
    body('description').trim().isLength({ min: 20 }),
  ],
  validate,
  createListing
)

listingsRouter.put('/:id', authenticate, updateListing)
listingsRouter.delete('/:id', authenticate, deleteListing)
