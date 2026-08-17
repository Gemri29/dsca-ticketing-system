import dotenv from 'dotenv'
dotenv.config()

import prisma from '../src/utils/prismaClient.js'
import bcrypt from 'bcrypt'

async function main() {
  console.log('Seeding database...')

const seedEmail = process.env.SEED_ADMIN_EMAIL
const seedPassword = process.env.SEED_ADMIN_PASSWORD

if (!seedEmail || !seedPassword) {
  console.log('SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set — skipping Super Admin seed')
} else {
  const existing = await prisma.user.findUnique({
    where: { email: seedEmail }
  })

  if (!existing) {
    const hashedPassword = await bcrypt.hash(seedPassword, 12)
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: seedEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        active: true
      }
    })
    console.log('Super Admin created')
  } else {
    console.log('Super Admin already exists — skipping')
  }
}

// ── Test Admin 
const testEmail = process.env.SEED_TEST_ADMIN_EMAIL
const testPassword = process.env.SEED_TEST_ADMIN_PASSWORD

if (!testEmail || !testPassword) {
  console.log('⚠️ SEED_TEST_ADMIN_EMAIL or SEED_TEST_ADMIN_PASSWORD not set — skipping Test Admin seed')
} else {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: testEmail }
  })

  if (!existingAdmin) {
    const adminHash = await bcrypt.hash(testPassword, 12)
    await prisma.user.create({
      data: {
        name: 'Test Admin',
        email: testEmail,
        password: adminHash,
        role: 'ADMIN',
        active: true
      }
    })
    console.log('Test Admin created')
  } else {
    console.log('Test Admin already exists — skipping')
  }
}

  // ── Laptop assets 
  const laptops = Array.from({ length: 1000 }, (_, index) => ({
    assetCode: `DSCA-IT-L-${String(index + 1).padStart(3, '0')}`,
  }));

  await prisma.laptop.deleteMany()

  for (const laptop of laptops) {
    await prisma.laptop.upsert({
      where: { assetCode: laptop.assetCode },
      update: {
        active: true
      },
      create: {
        ...laptop,
        active: true
      }
    })
  }
  console.log('Laptop assets seeded')

  // ── Desktop assets 
  const desktops = Array.from({ length: 100 }, (_, index) => ({
    assetCode: `DSCA-IT-D-${String(index + 1).padStart(3, '0')}`,
  }))

  await prisma.desktop.deleteMany()

  for (const desktop of desktops) {
    await prisma.desktop.upsert({
      where: { assetCode: desktop.assetCode },
      update: { active: true },
      create: { ...desktop, active: true }
    })
  }
  console.log('Desktop assets seeded')

  console.log('Seeding complete!')
}

main()
  .catch((err) => {
    console.error('Seed error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })