import { Router } from 'express'
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  getAnalytics
} from '../controllers/adminController.js'
import isAuthenticated from '../middleware/isAuthenticated.js'
import hasRole from '../middleware/hasRole.js'

const router = Router()

// All routes here are Super Admin only
router.use(isAuthenticated)
router.use(hasRole('SUPER_ADMIN'))

router.get('/users', getAdminUsers)
router.post('/users', createAdminUser)
router.patch('/users/:id', updateAdminUser)
router.get('/analytics', getAnalytics)

export default router