import { Router } from 'express'
import { runSLABreachCheck } from '../services/slaService.js'

const router = Router()

router.get('/sla-check', async (req, res) => {
  const providedSecret = req.headers['x-cron-key']

  if (!process.env.CRON_SECRET || providedSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' })
  }

  try {
    const result = await runSLABreachCheck()
    return res.status(200).json({ success: true, ...result })
  } catch (err) {
    console.error('External cron trigger error:', err)
    return res.status(500).json({ success: false, message: 'SLA check failed.' })
  }
})

export default router