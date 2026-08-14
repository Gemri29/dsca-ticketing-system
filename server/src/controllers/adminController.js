import prisma from '../utils/prismaClient.js'
import bcrypt from 'bcrypt'
import { validatePasswordStrength } from '../utils/validators.js'

// ─────────────────────────────────────────────
// SUPER ADMIN — GET /api/admin/users
// ─────────────────────────────────────────────
export const getAdminUsers = async (req, res) => {
  const { active, role } = req.query

  const where = {}
  if (active !== undefined) where.active = active === 'true'
  if (role) where.role = role.toUpperCase()

  try {
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: { assignedTickets: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return res.status(200).json({ success: true, users })
  } catch (err) {
    console.error('getAdminUsers error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// ─────────────────────────────────────────────
// SUPER ADMIN — POST /api/admin/users
// ─────────────────────────────────────────────
export const createAdminUser = async (req, res) => {
  const { name, email, password, role } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' })
  }

  // Validate email domain
  const domain = email.split('@')[1]
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || ['dscacontacting.com']
  if (!allowedDomains.includes(domain)) {
    return res.status(400).json({ success: false, message: 'Email domain not allowed.' })
  }

  // Validate password strength
  const strengthError = validatePasswordStrength(password)
  if (strengthError) {
    return res.status(400).json({ success: false, message: strengthError })
  }

  // Validate role
  const validRoles = ['ADMIN', 'SUPER_ADMIN']
  const assignedRole = role?.toUpperCase()
  if (role && !validRoles.includes(assignedRole)) {
    return res.status(400).json({ success: false, message: 'Invalid role.' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: assignedRole || 'ADMIN',
        active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true
      }
    })

    return res.status(201).json({
      success: true,
      message: 'Admin account created.',
      user
    })
  } catch (err) {
    console.error('createAdminUser error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// ─────────────────────────────────────────────
// SUPER ADMIN — PATCH /api/admin/users/:id
// ─────────────────────────────────────────────
export const updateAdminUser = async (req, res) => {
  const { id } = req.params
  const { name, role, active } = req.body

  // Prevent super admin from deactivating themselves
  if (id === req.user.id && active === false) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    const updateData = {}
    if (name?.trim()) updateData.name = name.trim()
    if (role) {
      const validRoles = ['ADMIN', 'SUPER_ADMIN']
      if (!validRoles.includes(role.toUpperCase())) {
        return res.status(400).json({ success: false, message: 'Invalid role.' })
      }
      updateData.role = role.toUpperCase()
    }
    if (active !== undefined) updateData.active = active

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Admin account updated.',
      user: updated
    })
  } catch (err) {
    console.error('updateAdminUser error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// ─────────────────────────────────────────────
// SUPER ADMIN — GET /api/admin/analytics
// ─────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  const { from, to } = req.query

  const dateFilter = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) dateFilter.lte = new Date(to)
  else dateFilter.lte = new Date()
  if (!from) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    dateFilter.gte = thirtyDaysAgo
  }

  const where = { createdAt: dateFilter }

  try {
    const [
      totalTickets,
      byStatus,
      bySiteLocation,
      byIssueType,
      byPriority,
      resolvedTickets,
      adminUsers
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      prisma.ticket.groupBy({
        by: ['siteLocation'],
        where,
        _count: { siteLocation: true }
      }),
      prisma.ticket.groupBy({
        by: ['issueType'],
        where,
        _count: { issueType: true }
      }),
      prisma.ticket.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true }
      }),
      prisma.ticket.findMany({
        where: { ...where, status: 'RESOLVED' },
        select: { createdAt: true, updatedAt: true, assignedTo: true }
      }),
      prisma.user.findMany({
        where: { role: 'ADMIN', active: true },
        select: {
          id: true,
          name: true,
          assignedTickets: {
            where,
            select: { status: true, createdAt: true, updatedAt: true }
          }
        }
      })
    ])

    // SLA breach count — tickets pending more than threshold
    const SLA_HOURS = parseInt(process.env.SLA_THRESHOLD_HOURS) || 48
    const slaBreaches = await prisma.ticket.count({
      where: {
        ...where,
        status: { not: 'RESOLVED' },
        createdAt: {
          lte: new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000)
        }
      }
    })

    // Average resolution time in hours
    let avgResolutionTimeHours = 0
    if (resolvedTickets.length > 0) {
      const totalMs = resolvedTickets.reduce((sum, t) => {
        return sum + (new Date(t.updatedAt) - new Date(t.createdAt))
      }, 0)
      avgResolutionTimeHours = parseFloat((totalMs / resolvedTickets.length / 3600000).toFixed(1))
    }

    // Admin performance
    const adminPerformance = adminUsers.map(admin => {
      const resolved = admin.assignedTickets.filter(t => t.status === 'RESOLVED')
      let avgTime = 0
      if (resolved.length > 0) {
        const totalMs = resolved.reduce((sum, t) => {
          return sum + (new Date(t.updatedAt) - new Date(t.createdAt))
        }, 0)
        avgTime = parseFloat((totalMs / resolved.length / 3600000).toFixed(1))
      }
      return {
        adminId: admin.id,
        adminName: admin.name,
        assigned: admin.assignedTickets.length,
        resolved: resolved.length,
        avgResolutionTimeHours: avgTime
      }
    })

    // Format grouped results into objects
    const formatGroup = (arr, key) =>
      arr.reduce((acc, item) => {
        acc[item[key]] = item._count[key]
        return acc
      }, {})

    return res.status(200).json({
      success: true,
      analytics: {
        totalTickets,
        byStatus: formatGroup(byStatus, 'status'),
        bySiteLocation: formatGroup(bySiteLocation, 'siteLocation'),
        byIssueType: formatGroup(byIssueType, 'issueType'),
        byPriority: formatGroup(byPriority, 'priority'),
        avgResolutionTimeHours,
        slaBreaches,
        adminPerformance
      }
    })
  } catch (err) {
    console.error('getAnalytics error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}