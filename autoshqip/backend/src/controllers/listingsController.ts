import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'
import { checkSubscription } from '../services/subscriptionService'

export async function getListings(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      make, model, fuelType, transmission, city,
      minPrice, maxPrice, minYear, maxYear, minMileage, maxMileage,
      featured, page = '1', limit = '20', sort = 'newest',
    } = req.query as Record<string, string>

    const where: any = { status: 'ACTIVE' }

    if (make) where.make = { equals: make, mode: 'insensitive' }
    if (model) where.model = { contains: model, mode: 'insensitive' }
    if (fuelType) where.fuelType = fuelType
    if (transmission) where.transmission = transmission
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (featured === 'true') where.isFeatured = true

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }
    if (minYear || maxYear) {
      where.year = {}
      if (minYear) where.year.gte = parseInt(minYear)
      if (maxYear) where.year.lte = parseInt(maxYear)
    }

    const orderBy: any = {
      newest: { createdAt: 'desc' },
      oldest: { createdAt: 'asc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      mileage_asc: { mileage: 'asc' },
    }[sort] || { createdAt: 'desc' }

    const pageNum = parseInt(page)
    const limitNum = Math.min(parseInt(limit), 50)
    const skip = (pageNum - 1) * limitNum

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, orderBy],
        skip,
        take: limitNum,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          user: { select: { id: true, name: true, phone: true, city: true } },
        },
      }),
      prisma.listing.count({ where }),
    ])

    res.json({
      data: listings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const userId = (req as any).user?.userId

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        user: { select: { id: true, name: true, phone: true, city: true, avatarUrl: true, createdAt: true } },
      },
    })

    if (!listing || (listing.status !== 'ACTIVE' && listing.userId !== userId)) {
      throw new AppError('Njoftime nuk u gjet', 404)
    }

    const isSaved = userId
      ? !!(await prisma.savedListing.findUnique({ where: { userId_listingId: { userId, listingId: id } } }))
      : false

    res.json({ ...listing, isSaved })
  } catch (err) {
    next(err)
  }
}

export async function createListing(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new AppError('Përdoruesi nuk u gjet', 404)

    const canPost = await checkSubscription(userId)
    if (!canPost) {
      throw new AppError('Duhet një abonim aktiv për të postuar njoftime', 402)
    }

    const {
      title, description, price, year, make, model, variant,
      mileage, fuelType, transmission, engineSize, power,
      color, doors, seats, vin, city, region, imageUrls,
    } = req.body

    const listing = await prisma.listing.create({
      data: {
        userId,
        title,
        description,
        price: parseFloat(price),
        year: parseInt(year),
        make,
        model,
        variant,
        mileage: parseInt(mileage),
        fuelType,
        transmission,
        engineSize: engineSize ? parseFloat(engineSize) : null,
        power: power ? parseInt(power) : null,
        color,
        doors: doors ? parseInt(doors) : null,
        seats: seats ? parseInt(seats) : null,
        vin,
        city,
        region,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        images: imageUrls?.length
          ? { create: imageUrls.map((url: string, i: number) => ({ url, isPrimary: i === 0, order: i })) }
          : undefined,
      },
      include: { images: true },
    })

    res.status(201).json(listing)
  } catch (err) {
    next(err)
  }
}

export async function updateListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const userId = (req as any).user.userId
    const user = (req as any).user

    const listing = await prisma.listing.findUnique({ where: { id } })
    if (!listing) throw new AppError('Njoftime nuk u gjet', 404)
    if (listing.userId !== userId && user.role !== 'ADMIN') throw new AppError('Pa leje', 403)

    const updated = await prisma.listing.update({
      where: { id },
      data: req.body,
      include: { images: true },
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
}

export async function deleteListing(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const userId = (req as any).user.userId
    const user = (req as any).user

    const listing = await prisma.listing.findUnique({ where: { id } })
    if (!listing) throw new AppError('Njoftime nuk u gjet', 404)
    if (listing.userId !== userId && user.role !== 'ADMIN') throw new AppError('Pa leje', 403)

    await prisma.listing.delete({ where: { id } })
    res.json({ message: 'Njoftime u fshi' })
  } catch (err) {
    next(err)
  }
}

export async function getMyListings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const listings = await prisma.listing.findMany({
      where: { userId },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(listings)
  } catch (err) {
    next(err)
  }
}

export async function saveListing(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const { id: listingId } = req.params
    await prisma.savedListing.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId },
      update: {},
    })
    res.json({ saved: true })
  } catch (err) {
    next(err)
  }
}

export async function unsaveListing(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const { id: listingId } = req.params
    await prisma.savedListing.deleteMany({ where: { userId, listingId } })
    res.json({ saved: false })
  } catch (err) {
    next(err)
  }
}

export async function getSavedListings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const saved = await prisma.savedListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(saved.map((s) => s.listing))
  } catch (err) {
    next(err)
  }
}

export async function markAsSold(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const userId = (req as any).user.userId
    const listing = await prisma.listing.findUnique({ where: { id } })
    if (!listing) throw new AppError('Nuk u gjet', 404)
    if (listing.userId !== userId) throw new AppError('Pa leje', 403)
    await prisma.listing.update({ where: { id }, data: { status: 'SOLD' } })
    res.json({ message: 'Shënuar si i shitur' })
  } catch (err) {
    next(err)
  }
}

export async function incrementViews(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    await prisma.listing.updateMany({
      where: { id, status: 'ACTIVE' },
      data: { views: { increment: 1 } },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
