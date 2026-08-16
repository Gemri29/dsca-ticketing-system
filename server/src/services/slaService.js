import cron from 'node-cron'
import prisma from '../utils/prismaClient.js'
import { sendSLABreachEmail } from './emailService.js'
import dotenv from 'dotenv'
dotenv.config()

const SLA_HOURS = parseInt(process.env.SLA_THRESHOLD_HOURS) || 48

export const startSLACronJob = () => {
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running SLA breach check...')

    try {
      const breachThreshold = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000)

      // Find tickets that are breached, not resolved, assigned to someone
      // and haven't had an SLA email sent yet
      const breachedTickets = await prisma.ticket.findMany({
        where: {
          status: { not: 'RESOLVED' },
          createdAt: { lte: breachThreshold },
          assignedTo: { not: null },
          slaEmailSent: false
        },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      console.log(`Found ${breachedTickets.length} SLA breached tickets`)

      for (const ticket of breachedTickets) {
        const hoursElapsed = Math.floor(
          (Date.now() - new Date(ticket.createdAt).getTime()) / 3600000
        )

        try {
          await sendSLABreachEmail({
            to: ticket.assignedUser.email,
            adminName: ticket.assignedUser.name,
            ticketCode: ticket.ticketCode,
            fullName: ticket.fullName,
            issueType: ticket.issueType,
            priority: ticket.priority,
            siteLocation: ticket.siteLocation,
            hoursElapsed,
            ticketId: ticket.id
          })

          // Mark SLA email as sent so we don't spam
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: { slaEmailSent: true }
          })

          console.log(`✅ SLA breach email sent for ${ticket.ticketCode}`)
        } catch (emailErr) {
          console.error(`❌ SLA email failed for ${ticket.ticketCode}:`, emailErr)
        }
      }
    } catch (err) {
      console.error('SLA cron error:', err)
    }
  })

  console.log('✅ SLA breach cron job started — runs every hour')
}