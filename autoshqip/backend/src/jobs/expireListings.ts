import cron from 'node-cron'
import { execFile } from 'child_process'
import path from 'path'
import { prisma } from '../utils/prisma'
import { logger } from '../utils/logger'

export function startExpireListingsJob() {
  // Expire stale listings — daily at 00:05
  cron.schedule('5 0 * * *', async () => {
    try {
      const result = await prisma.listing.updateMany({
        where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
        data: { status: 'EXPIRED' },
      })
      if (result.count > 0) logger.info(`Expire job: marked ${result.count} listing(s) as EXPIRED`)
    } catch (err) {
      logger.error('Expire job failed', err)
    }
  })

  // Database backup — daily at 02:00
  cron.schedule('0 2 * * *', () => {
    const script = path.resolve(process.cwd(), 'scripts/backup.sh')
    execFile('bash', [script], (err, stdout, stderr) => {
      if (err) {
        logger.error('Backup job failed', err)
        if (stderr) logger.error(stderr)
      } else {
        logger.info(stdout.trim())
      }
    })
  })

  logger.info('Cron jobs scheduled: expire listings (00:05), DB backup (02:00)')
}
