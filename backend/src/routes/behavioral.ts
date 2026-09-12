import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

interface BehavioralProfile {
  id: number
  name: string
  endpoint: string
  riskLevel: string
  deviations: number
  lastUpdated: string
  processes: number
  connections: number
}

interface Anomaly {
  id: number
  user: string
  endpoint: string
  type: string
  description: string
  severity: string
  timestamp: string
  baseline: string
  deviation: string
}

const behavioralProfiles: BehavioralProfile[] = []
const anomalies: Anomaly[] = []

router.use(authenticateToken)

router.get('/profiles', async (_req: AuthRequest, res: Response) => {
  try {
    res.json(behavioralProfiles)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch behavioral profiles' })
  }
})

router.get('/anomalies', async (_req: AuthRequest, res: Response) => {
  try {
    res.json(anomalies)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch anomalies' })
  }
})

export default router
