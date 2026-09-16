import { Router } from 'express'
import { runSLABreachCheck } from '../services/slaService.js'

const router = Router()

// GET /api/cron/sla-check?secret=...
// Called by an external scheduler (GitHub Actions) once a day.
// No cookie/login auth here on purpose — the caller is a script, not a browser —
// so it's protected by a shared secret instead, checked against CRON_SECRET.
// Hitting ANY endpoint wakes a sleeping Railway app back up, which is the whole
// point: this request itself is what makes the daily digest possible again.
router.get('/sla-check', async (req, res) => {
  if (!process.env.CRON_SECRET || req.query.secret !== process.env.CRON_SECRET) {
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