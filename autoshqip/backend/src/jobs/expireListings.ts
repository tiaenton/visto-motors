import cron from 'node-cron'
import { prisma } from '../utils/prisma'
import { logger } from '../utils/logger'

export function startExpireListingsJob() {
  // Runs every day at 00:05
  cron.schedule('5 0 * * *', async () => {
    try {
      const result = await prisma.listing.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lt: new Date() },
        },
        data: { status: 'EXPIRED' },
      })

      if (result.count > 0) {
        logger.info(`Expire job: marked ${result.count} listing(s) as EXPIRED`)
      }
    } catch (err) {
      logger.error('Expire job failed', err)
    }
  })

  logger.info('Listing expiry cron job scheduled (daily 00:05)')
}
