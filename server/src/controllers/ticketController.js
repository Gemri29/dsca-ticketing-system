import prisma from '../utils/prismaClient.js'
import generateTicketCode from '../services/ticketCodeService.js'
import uploadFile from '../services/uploadService.js'
import { sendConfirmationEmail, sendStatusUpdateEmail } from '../services/emailService.js'
import { validateTicketFields } from '../utils/validators.js'
import publicTicketShape from '../utils/publicTicketShape.js'

// ─────────────────────────────────────────────
// PUBLIC — POST /api/tickets
// ─────────────────────────────────────────────
export const submitTicket = async (req, res) => {
  try {
    // Validate fields
    const errors = validateTicketFields(req.body)
    if (errors) {
      return res.status(400).json({ success: false, message: 'Validation failed.', errors })
    }

    const {
      fullName, email, laptopNumber,
      siteLocation, issueType, customIssue, priority
    } = req.body

    // Verify laptop exists in DB
    const laptop = await prisma.laptop.findUnique({
      where: { assetCode: laptopNumber }
    })
    if (!laptop || !laptop.active) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: { laptopNumber: 'Laptop not found in registered assets.' }
      })
    }

    // Handle file upload
    let attachmentUrl = null
    if (req.file) {
      attachmentUrl = await uploadFile(req.file.buffer, req.file.mimetype, 'temp')
    }

    // Generate unique ticket code
    const ticketCode = await generateTicketCode()

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        laptopNumber,
        siteLocation,
        issueType,
        customIssue: customIssue?.trim() || null,
        priority,
        attachment: attachmentUrl,
        status: 'PENDING'
      }
    })

    // Send confirmation email
    try {
      await sendConfirmationEmail({
        to: ticket.email,
        fullName: ticket.fullName,
        ticketCode: ticket.ticketCode,
        issueType: ticket.issueType,
        priority: ticket.priority,
        laptopNumber: ticket.laptopNumber
      })
    } catch (emailErr) {
      // Don't fail the request if email fails — log and continue
      console.error('Confirmation email failed:', emailErr)
    }

    return res.status(201).json({
      success: true,
      message: 'Ticket submitted successfully.',
      ticketCode: ticket.ticketCode
    })
  } catch (err) {
    console.error('submitTicket error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// ─────────────────────────────────────────────
// PUBLIC — GET /api/tickets/track
// ─────────────────────────────────────────────
export const trackTicket = async (req, res) => {
  const { email, ticketCode } = req.query

  if (!email || !ticketCode) {
    return res.status(400).json({ success: false, message: 'Email and ticket code are required.' })
  }

  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        ticketCode: ticketCode.toUpperCase(),
        email: email.toLowerCase()
      },
      include: {
        assignedUser: {
          select: { name: true }
        }
      }
    })

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'No ticket found with those details.' })
    }

    return res.status(200).json({
      success: true,
      ticket: publicTicketShape(ticket)
    })
  } catch (err) {
    console.error('trackTicket error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// ─────────────────────────────────────────────
// ADMIN — GET /api/tickets
// ─────────────────────────────────────────────
export const getTickets = async (req, res) => {
  const {
    status, priority, siteLocation,
    issueType, assignedTo,
    sortBy = 'createdAt', order = 'desc',
    page = 1, limit = 25
  } = req.query

  const where = {}

  // Admins only see their own tickets; super admins see all
  if (req.user.role === 'ADMIN') {
    where.assignedTo = req.user.id
  }

  if (status) where.status = status.toUpperCase()
  if (priority) where.priority = priority.toUpperCase()
  if (siteLocation) where.siteLocation = siteLocation
  if (issueType) where.issueType = issueType
  if (assignedTo && req.user.role === 'SUPER_ADMIN') where.assignedTo = assignedTo

  const validSortFields = ['createdAt', 'updatedAt', 'priority']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
  const sortOrder = order === 'asc' ? 'asc' : 'desc'

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  try {
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limitNum,
        include: {
          assignedUser: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.ticket.count({ where })
    ])

    return res.status(200).json({
      success: true,
      tickets,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (err) {
    console.error('getTickets error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// ─────────────────────────────────────────────
// ADMIN — GET /api/tickets/:id
// ─────────────────────────────────────────────
export const getTicketById = async (req, res) => {
  const { id } = req.params

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' })
    }

    // Admins can only view their assigned tickets
    if (req.user.role === 'ADMIN' && ticket.assignedTo !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this ticket.' })
    }

    return res.status(200).json({ success: true, ticket })
  } catch (err) {
    console.error('getTicketById error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// ─────────────────────────────────────────────
// ADMIN — PATCH /api/tickets/:id
// ─────────────────────────────────────────────
export const updateTicket = async (req, res) => {
  const { id } = req.params
  const { status, remark, internalNote } = req.body

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id } })

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' })
    }

    if (req.user.role === 'ADMIN' && ticket.assignedTo !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this ticket.' })
    }

    const updateData = {}
    if (status) updateData.status = status.toUpperCase()
    if (remark !== undefined) updateData.remark = remark
    if (internalNote !== undefined) updateData.internalNote = internalNote

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData
    })

    // Send status update email if status changed
    if (status && status.toUpperCase() !== ticket.status) {
      try {
        await sendStatusUpdateEmail({
          to: ticket.email,
          fullName: ticket.fullName,
          ticketCode: ticket.ticketCode,
          status: updated.status,
          remark: updated.remark
        })
      } catch (emailErr) {
        console.error('Status update email failed:', emailErr)
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Ticket updated.',
      ticket: {
        id: updated.id,
        ticketCode: updated.ticketCode,
        status: updated.status,
        remark: updated.remark,
        internalNote: updated.internalNote,
        updatedAt: updated.updatedAt
      }
    })
  } catch (err) {
    console.error('updateTicket error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// ─────────────────────────────────────────────
// SUPER ADMIN — PATCH /api/tickets/:id/assign
// ─────────────────────────────────────────────
export const assignTicket = async (req, res) => {
  const { id } = req.params
  const { adminId } = req.body

  if (!adminId) {
    return res.status(400).json({ success: false, message: 'adminId is required.' })
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' })
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } })
    if (!admin || !admin.active) {
      return res.status(404).json({ success: false, message: 'Admin not found or inactive.' })
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: { assignedTo: adminId },
      include: {
        assignedUser: { select: { id: true, name: true } }
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Ticket assigned.',
      ticket: {
        id: updated.id,
        ticketCode: updated.ticketCode,
        assignedUser: updated.assignedUser
      }
    })
  } catch (err) {
    console.error('assignTicket error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// ─────────────────────────────────────────────
// PUBLIC — GET /api/laptops
// ─────────────────────────────────────────────
export const getLaptops = async (req, res) => {
  try {
    const laptops = await prisma.laptop.findMany({
      where: { active: true },
      select: { assetCode: true, siteLocation: true },
      orderBy: { assetCode: 'asc' }
    })

    return res.status(200).json({ success: true, laptops })
  } catch (err) {
    console.error('getLaptops error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}