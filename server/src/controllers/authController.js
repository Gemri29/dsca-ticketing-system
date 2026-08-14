import prisma from '../utils/prismaClient.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { validatePasswordStrength } from '../utils/validators.js'


// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact your Super Admin.' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    })

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('token')
  return res.status(200).json({ success: true, message: 'Logged out.' })
}

// GET /api/auth/me
export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    return res.status(200).json(user)
  } catch (err) {
    console.error('Me error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

// PATCH /api/users/me
export const updateMe = async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    const updateData = {}

    if (name?.trim()) updateData.name = name.trim()

    if (email?.trim()) {
      const domain = email.split('@')[1]
      const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || ['dscacontacting.com']
      if (!allowedDomains.includes(domain)) {
        return res.status(400).json({ success: false, message: 'Email domain not allowed.' })
      }
      updateData.email = email.trim()
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required.' })
      }
      const match = await bcrypt.compare(currentPassword, user.password)
      if (!match) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' })
      }
      const strengthError = validatePasswordStrength(newPassword)
      if (strengthError) {
        return res.status(400).json({ success: false, message: strengthError })
      }
      updateData.password = await bcrypt.hash(newPassword, 12)
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    })

    return res.status(200).json({ success: true, message: 'Profile updated.', user: updated })
  } catch (err) {
    console.error('UpdateMe error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}