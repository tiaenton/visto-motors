import { prisma } from '../utils/prisma'

export async function checkSubscription(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true, currentPeriodEnd: true },
  })
  if (!sub) return false
  if (sub.status === 'ACTIVE' || sub.status === 'TRIALING') return true
  if (sub.currentPeriodEnd > new Date()) return true
  return false
}
