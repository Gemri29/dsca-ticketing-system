import { Router } from 'express'
import {
  submitTicket,
  trackTicket,
  getTickets,
  getTicketById,
  updateTicket,
  assignTicket,
  getLaptops
} from '../controllers/ticketController.js'
import isAuthenticated from '../middleware/isAuthenticated.js'
import hasRole from '../middleware/hasRole.js'
import { submitLimiter, trackLimiter } from '../middleware/rateLimiter.js'
import honeypot from '../middleware/honeypot.js'
import upload from '../middleware/uploadHandler.js'

const router = Router()

// ── Public routes ─────────────────────────────
router.post(
  '/',
  submitLimiter,
  honeypot,
  upload.single('attachment'),
  submitTicket
)
router.get('/track', trackLimiter, trackTicket)
router.get('/laptops', getLaptops)

// ── Admin routes ──────────────────────────────
router.get(
  '/',
  isAuthenticated,
  hasRole('ADMIN', 'SUPER_ADMIN'),
  getTickets
)
router.get(
  '/:id',
  isAuthenticated,
  hasRole('ADMIN', 'SUPER_ADMIN'),
  getTicketById
)
router.patch(
  '/:id',
  isAuthenticated,
  hasRole('ADMIN', 'SUPER_ADMIN'),
  updateTicket
)

// ── Super Admin routes ────────────────────────
router.patch(
  '/:id/assign',
  isAuthenticated,
  hasRole('SUPER_ADMIN'),
  assignTicket
)

export default router