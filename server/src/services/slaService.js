import cron from 'node-cron'
import prisma from '../utils/prismaClient.js'
import { sendSLADigestEmail } from './emailService.js'
import dotenv from 'dotenv'

dotenv.config()

const SLA_HOURS = parseInt(process.env.SLA_THRESHOLD_HOURS) || 48
const REMINDER_INTERVAL_HOURS = 23
const PRIORITY_WEIGHT = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

// Extracted so it can be called both by the daily cron AND manually (e.g. an admin test-trigger route)
export const runSLABreachCheck = async () => {
  console.log('Running SLA breach check...')

  try {
    const breachThreshold = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000)
    const reminderThreshold = new Date(Date.now() - REMINDER_INTERVAL_HOURS * 60 * 60 * 1000)

    // Find tickets that are breached, not resolved, and either
    // never had a reminder sent, or their last reminder was 24+ hours ago.
    const breachedTickets = await prisma.ticket.findMany({
      where: {
        status: { not: 'RESOLVED' },
        createdAt: { lte: breachThreshold },
        OR: [
          { lastSlaEmailAt: null },
          { lastSlaEmailAt: { lte: reminderThreshold } }
        ]
      }
    })

    console.log(`Found ${breachedTickets.length} SLA breached ticket(s) due for a reminder`)

    if (breachedTickets.length === 0) {
      return { checked: 0, emailed: 0 }
    }

    // Notify every active admin/super admin — never the ticket submitter
    const admins = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true }
    })

    if (admins.length === 0) {
      console.warn('No active admins found — skipping SLA digest emails')
      return { checked: breachedTickets.length, emailed: 0 }
    }

    // Sort: priority first (Critical → Low), then oldest breach first within the same priority
    const sorted = [...breachedTickets].sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
      if (weightDiff !== 0) return weightDiff
      return new Date(a.createdAt) - new Date(b.createdAt)
    })

    const digestTickets = sorted.map(ticket => ({
      ticketId: ticket.id,
      ticketCode: ticket.ticketCode,
      fullName: ticket.fullName,
      laptopNumber: ticket.laptopNumber,
      desktopNumber: ticket.desktopNumber,
      issueType: ticket.issueType,
      customIssue: ticket.customIssue,
      priority: ticket.priority,
      hoursElapsed: Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 3600000)
    }))

    // One email per admin (not per ticket) — each contains the full table
    const results = await Promise.allSettled(
      admins.map(admin =>
        sendSLADigestEmail({ to: admin.email, adminName: admin.name, tickets: digestTickets })
      )
    )

    let emailedCount = 0
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        emailedCount++
      } else {
        console.error(`SLA digest failed for ${admins[i].email}:`, result.reason)
      }
    })

    // Mark all included tickets as reminded, once — regardless of how many admins got emailed
    await prisma.ticket.updateMany({
      where: { id: { in: digestTickets.map(t => t.ticketId) } },
      data: { lastSlaEmailAt: new Date() }
    })

    console.log(`SLA digest sent to ${emailedCount}/${admins.length} admin(s), covering ${digestTickets.length} ticket(s)`)

    return { checked: breachedTickets.length, emailed: emailedCount }
  } catch (err) {
    console.error('SLA cron error:', err)
    throw err
  }
}

export const startSLACronJob = () => {
  // Runs once daily at 8:00 AM (Asia/Dubai). Adjust the timezone below if your admins are elsewhere.
  cron.schedule('0 8 * * *', () => {
    runSLABreachCheck()
  }, {
    timezone: 'Asia/Dubai'
  })

  console.log('SLA breach cron job started — runs daily at 8:00 AM (Asia/Dubai), digest repeats every 24h until resolved')
}