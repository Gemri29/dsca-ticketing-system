import dotenv from 'dotenv'
dotenv.config()

import prisma from '../src/utils/prismaClient.js'
import bcrypt from 'bcrypt'

async function main() {
  console.log('🌱 Seeding database...')

  // ── Super Admin ───────────────────────────────
  const existing = await prisma.user.findUnique({
    where: { email: 'super_admin@dscacontacting.com' }
  })

  if (!existing) {
    const hashedPassword = await bcrypt.hash('heisenberg', 12)
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'super_admin@dscacontacting.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        active: true
      }
    })
    console.log('✅ Super Admin created')
  } else {
    console.log('⏭️  Super Admin already exists — skipping')
  }

  // ── Laptop assets ─────────────────────────────
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
  console.log('✅ Laptop assets seeded')

  console.log('🎉 Seeding complete!')
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })