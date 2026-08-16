import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import ticketRoutes from './routes/tickets.js'
import adminRoutes from './routes/admin.js'
import { startSLACronJob } from './services/slaService.js'

dotenv.config()

const app = express()

// ── Security middleware ──────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser(process.env.COOKIE_SECRET))

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/admin', adminRoutes)

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'DSCA IT Support API is running.' })
})

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' })
})

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, message: 'Internal server error.' })
})
// Start SLA breach monitoring
startSLACronJob()

export default app