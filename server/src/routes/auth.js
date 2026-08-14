import { Router } from 'express'
import { login, logout, me, updateMe } from '../controllers/authController.js'
import isAuthenticated from '../middleware/isAuthenticated.js'
import { loginLimiter } from '../middleware/rateLimiter.js'

const router = Router()

router.post('/login', loginLimiter, login)
router.post('/logout', isAuthenticated, logout)
router.get('/me', isAuthenticated, me)
router.patch('/me', isAuthenticated, updateMe)

export default router