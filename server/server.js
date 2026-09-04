import app from './src/app.js'
import dotenv from 'dotenv'
import { startSLACronJob } from './src/services/slaService.js'

dotenv.config()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  startSLACronJob()
})