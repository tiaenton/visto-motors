import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@autoshqip.al' },
    update: {},
    create: {
      email: 'admin@autoshqip.al',
      password: adminPassword,
      name: 'Admin AutoShqip',
      role: 'ADMIN',
      isVerified: true,
      city: 'Tiranë',
    },
  })

  const dealerPassword = await bcrypt.hash('dealer123', 12)
  const dealer = await prisma.user.upsert({
    where: { email: 'dealer@test.com' },
    update: {},
    create: {
      email: 'dealer@test.com',
      password: dealerPassword,
      name: 'Test Dealer',
      role: 'DEALER',
      isVerified: true,
      city: 'Tiranë',
      phone: '+355 69 123 4567',
    },
  })

  const makes = ['BMW', 'Mercedes', 'Volkswagen', 'Toyota', 'Ford', 'Audi', 'Opel', 'Fiat']
  const models: Record<string, string[]> = {
    BMW: ['Serie 3', 'Serie 5', 'X5', 'X3'],
    Mercedes: ['C-Class', 'E-Class', 'GLE', 'A-Class'],
    Volkswagen: ['Golf', 'Passat', 'Tiguan', 'Polo'],
    Toyota: ['Corolla', 'RAV4', 'Yaris', 'Camry'],
    Ford: ['Focus', 'Mondeo', 'Kuga', 'Fiesta'],
    Audi: ['A3', 'A4', 'A6', 'Q5'],
    Opel: ['Astra', 'Insignia', 'Mokka', 'Corsa'],
    Fiat: ['500', 'Punto', 'Tipo', 'Bravo'],
  }
  const cities = ['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë']
  const fuels = ['BENZINE', 'DIESEL', 'HIBRID', 'ELEKTRIK'] as const
  const transmissions = ['MANUAL', 'AUTOMATIK'] as const

  for (let i = 0; i < 20; i++) {
    const make = makes[Math.floor(Math.random() * makes.length)]
    const modelList = models[make]
    const model = modelList[Math.floor(Math.random() * modelList.length)]
    const year = 2010 + Math.floor(Math.random() * 14)
    const price = (3000 + Math.floor(Math.random() * 27000))

    await prisma.listing.create({
      data: {
        userId: dealer.id,
        status: 'ACTIVE',
        title: `${make} ${model} ${year}`,
        description: `${make} ${model} i vitit ${year} në gjendje shumë të mirë. Mirëmbajtur rregullisht. I gatshëm për regjistrim. Çmim i negociueshëm.`,
        price,
        year,
        make,
        model,
        mileage: 20000 + Math.floor(Math.random() * 180000),
        fuelType: fuels[Math.floor(Math.random() * fuels.length)],
        transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
        engineSize: [1.4, 1.6, 1.8, 2.0, 2.2, 3.0][Math.floor(Math.random() * 6)],
        power: [90, 110, 130, 150, 180, 200, 250][Math.floor(Math.random() * 7)],
        city: cities[Math.floor(Math.random() * cities.length)],
        doors: [3, 5][Math.floor(Math.random() * 2)],
        seats: 5,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        images: {
          create: [
            {
              url: `https://placehold.co/800x600/e2e8f0/64748b?text=${encodeURIComponent(make + ' ' + model)}`,
              isPrimary: true,
              order: 0,
            },
          ],
        },
      },
    })
  }

  console.log('Seed complete!')
  console.log('Admin: admin@autoshqip.al / admin123')
  console.log('Dealer: dealer@test.com / dealer123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
