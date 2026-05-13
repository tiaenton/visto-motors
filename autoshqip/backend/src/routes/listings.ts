import { Router, Request, Response, NextFunction } from 'express'
import { body, param, query } from 'express-validator'
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
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'

const NHTSA_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin'
const VIN_FIELDS = ['Make', 'Model', 'Model Year', 'Body Class', 'Engine Number of Cylinders', 'Displacement (L)', 'Fuel Type - Primary', 'Drive Type', 'Transmission Style', 'Doors', 'Error Text']

export const listingsRouter = Router()

listingsRouter.get('/', optionalAuth, getListings)
listingsRouter.get('/saved', authenticate, getSavedListings)
listingsRouter.get('/my', authenticate, getMyListings)

listingsRouter.get(
  '/:id/vin',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await prisma.listing.findUnique({ where: { id: req.params.id }, select: { vin: true, vinChecked: true, id: true } })
      if (!listing) throw new AppError('Njoftime nuk u gjet', 404)
      if (!listing.vin) throw new AppError('Ky njoftim nuk ka VIN', 400)

      const response = await fetch(`${NHTSA_URL}/${encodeURIComponent(listing.vin)}?format=json`)
      if (!response.ok) throw new AppError('Shërbimi VIN nuk u përgjigj', 502)

      const data = await response.json() as { Results: { Variable: string; Value: string | null }[] }
      const info: Record<string, string> = {}
      for (const r of data.Results ?? []) {
        if (VIN_FIELDS.includes(r.Variable) && r.Value && r.Value !== 'Not Applicable') {
          info[r.Variable] = r.Value
        }
      }

      await prisma.listing.update({ where: { id: req.params.id }, data: { vinChecked: true } })

      res.json({ vin: listing.vin, info, checkedAt: new Date() })
    } catch (err) { next(err) }
  },
)

listingsRouter.get('/:id', optionalAuth, getListing)
listingsRouter.post('/:id/views', [param('id').isUUID()], validate, incrementViews)
listingsRouter.post('/:id/save', authenticate, [param('id').isUUID()], validate, saveListing)
listingsRouter.delete('/:id/save', authenticate, [param('id').isUUID()], validate, unsaveListing)
listingsRouter.post('/:id/sold', authenticate, [param('id').isUUID()], validate, markAsSold)

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
