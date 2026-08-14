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
  const laptops = [
    { assetCode: 'DSCA-LAPTOP-001', siteLocation: 'Moe' },
    { assetCode: 'DSCA-LAPTOP-002', siteLocation: 'Moe' },
    { assetCode: 'DSCA-LAPTOP-003', siteLocation: 'Moe' },
    { assetCode: 'DSCA-LAPTOP-004', siteLocation: 'Dubai Mall' },
    { assetCode: 'DSCA-LAPTOP-005', siteLocation: 'Dubai Mall' },
    { assetCode: 'DSCA-LAPTOP-006', siteLocation: 'Dubai Mall' },
    { assetCode: 'DSCA-LAPTOP-007', siteLocation: 'ADCB' },
    { assetCode: 'DSCA-LAPTOP-008', siteLocation: 'ADCB' },
    { assetCode: 'DSCA-LAPTOP-009', siteLocation: 'ADCB' },
    { assetCode: 'DSCA-LAPTOP-010', siteLocation: 'JBR' },
    { assetCode: 'DSCA-LAPTOP-011', siteLocation: 'JBR' },
    { assetCode: 'DSCA-LAPTOP-012', siteLocation: 'JBR' },
  ]

  for (const laptop of laptops) {
    await prisma.laptop.upsert({
      where: { assetCode: laptop.assetCode },
      update: {},
      create: { ...laptop, active: true }
    })
  }
  console.log('✅ Laptop assets seeded (12 laptops)')

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