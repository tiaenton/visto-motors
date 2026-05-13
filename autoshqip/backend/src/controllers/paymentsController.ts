import { Request, Response, NextFunction } from 'express'
import Stripe from 'stripe'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/AppError'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' })

async function getOrCreateStripeCustomer(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('Përdoruesi nuk u gjet', 404)

  if (user.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId },
  })

  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } })
  return customer.id
}

export async function createSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const { plan = 'basic', paymentMethodId } = req.body

    const priceId = plan === 'premium'
      ? process.env.STRIPE_PRICE_ID_PREMIUM!
      : process.env.STRIPE_PRICE_ID_BASIC!

    const customerId = await getOrCreateStripeCustomer(userId)

    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      })
    }

    const existingSub = await prisma.subscription.findUnique({ where: { userId } })
    if (existingSub?.status === 'ACTIVE') {
      throw new AppError('Tashmë ke abonim aktiv', 400)
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { userId, plan },
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent

    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
    })
  } catch (err) {
    next(err)
  }
}

export async function createSubscriptionCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const { plan = 'basic' } = req.body

    const existingSub = await prisma.subscription.findUnique({ where: { userId } })
    if (existingSub?.status === 'ACTIVE') {
      throw new AppError('Tashmë ke abonim aktiv', 400)
    }

    const priceId = plan === 'premium'
      ? process.env.STRIPE_PRICE_ID_PREMIUM!
      : process.env.STRIPE_PRICE_ID_BASIC!

    const customerId = await getOrCreateStripeCustomer(userId)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan },
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    })

    res.json({ checkoutUrl: session.url })
  } catch (err) {
    next(err)
  }
}

export async function cancelSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const sub = await prisma.subscription.findUnique({ where: { userId } })
    if (!sub) throw new AppError('Nuk ka abonim aktiv', 404)

    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true })
    await prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    })

    res.json({ message: 'Abonimit do të anulohet në fund të periudhës' })
  } catch (err) {
    next(err)
  }
}

export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const sub = await prisma.subscription.findUnique({ where: { userId } })
    res.json(sub)
  } catch (err) {
    next(err)
  }
}

export async function createBoost(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const { listingId } = req.params
    const { days = 7, useCredits = false } = req.body

    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing) throw new AppError('Njoftime nuk u gjet', 404)
    if (listing.userId !== userId) throw new AppError('Pa leje', 403)

    const pricePerDay = 0.5
    const totalCost = days * pricePerDay

    if (useCredits) {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user || user.creditBalance < totalCost) {
        throw new AppError('Kredite të pamjaftueshme', 402)
      }

      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

      await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { creditBalance: { decrement: totalCost } } }),
        prisma.creditTransaction.create({
          data: { userId, amount: -totalCost, type: 'BOOST_SPEND', description: `Boost ${days} ditë`, referenceId: listingId },
        }),
        prisma.boost.create({
          data: { listingId, userId, days, expiresAt },
        }),
        prisma.listing.update({
          where: { id: listingId },
          data: { isFeatured: true, featuredUntil: expiresAt },
        }),
      ])

      return res.json({ message: 'Boost aktiv me kredite', expiresAt })
    }

    const customerId = await getOrCreateStripeCustomer(userId)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: `Boost ${days} ditë — ${listing.title}` },
          unit_amount: Math.round(totalCost * 100),
        },
        quantity: 1,
      }],
      metadata: { userId, listingId, days: days.toString(), type: 'BOOST' },
      success_url: `${process.env.FRONTEND_URL}/dashboard?boost=success`,
      cancel_url: `${process.env.FRONTEND_URL}/listings/${listingId}`,
    })

    res.json({ checkoutUrl: session.url })
  } catch (err) {
    next(err)
  }
}

export async function getPortalUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.userId
    const customerId = await getOrCreateStripeCustomer(userId)
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    })
    res.json({ url: session.url })
  } catch (err) {
    next(err)
  }
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return res.status(400).json({ error: 'Webhook signature invalid' })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata.userId
        const plan = sub.metadata.plan || 'basic'

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0].price.id,
            status: sub.status.toUpperCase() as any,
            plan,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            status: sub.status.toUpperCase() as any,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'CANCELED' },
        })
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type === 'BOOST') {
          const { userId, listingId, days } = session.metadata
          const daysNum = parseInt(days)
          const expiresAt = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000)

          await prisma.$transaction([
            prisma.boost.create({ data: { listingId, userId, days: daysNum, expiresAt, stripePId: session.payment_intent as string } }),
            prisma.listing.update({ where: { id: listingId }, data: { isFeatured: true, featuredUntil: expiresAt } }),
          ])
        }
        break
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
