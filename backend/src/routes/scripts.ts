import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

interface ScriptRule {
  id: number
  name: string
  engine: string
  mode: string
  status: string
  endpoints: number
  blocks: number
}

interface ScriptBlock {
  id: number
  script: string
  command: string
  endpoint: string
  timestamp: string
  reason: string
}

const scriptRules: ScriptRule[] = []
const scriptBlocks: ScriptBlock[] = []
let ruleIdCounter = 1
let blockIdCounter = 1

router.use(authenticateToken)

router.get('/rules', async (_req: AuthRequest, res: Response) => {
  try {
    res.json(scriptRules)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch script rules' })
  }
})

router.post('/rules', async (req: AuthRequest, res: Response) => {
  try {
    const { name, engine, mode, status, endpoints, blocks } = req.body
    const rule: ScriptRule = {
      id: ruleIdCounter++,
      name: name || '',
      engine: engine || 'powershell',
      mode: mode || 'Constrained',
      status: status || 'active',
      endpoints: endpoints || 0,
      blocks: blocks || 0,
    }
    scriptRules.push(rule)
    res.status(201).json(rule)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create script rule' })
  }
})

router.delete('/rules/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const index = scriptRules.findIndex(r => r.id === id)
    if (index === -1) {
      return res.status(404).json({ error: 'Rule not found' })
    }
    scriptRules.splice(index, 1)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete script rule' })
  }
})

router.get('/blocks', async (_req: AuthRequest, res: Response) => {
  try {
    res.json(scriptBlocks)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch script blocks' })
  }
})

router.post('/blocks', async (req: AuthRequest, res: Response) => {
  try {
    const { script, command, endpoint, reason } = req.body
    const block: ScriptBlock = {
      id: blockIdCounter++,
      script: script || '',
      command: command || '',
      endpoint: endpoint || '',
      timestamp: new Date().toISOString(),
      reason: reason || '',
    }
    scriptBlocks.push(block)
    res.status(201).json(block)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create script block' })
  }
})

export default router
