import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/settings - get all settings
router.get('/', async (_req: AuthRequest, res: Response) => {
  const settings = await prisma.setting.findMany({
    orderBy: [{ group: 'asc' }, { key: 'asc' }],
  })

  const grouped: Record<string, Record<string, any>> = {}
  for (const setting of settings) {
    if (!grouped[setting.group]) {
      grouped[setting.group] = {}
    }
    grouped[setting.group][setting.key] = setting.value
  }

  res.json({ settings: grouped, flat: settings })
})

// PUT /api/settings - update settings (key-value)
router.put('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { settings } = req.body

  if (!settings || !Array.isArray(settings)) {
    throw new AppError('settings array is required', 400)
  }

  const results = await Promise.all(
    settings.map(async (s: { key: string; value: any; group?: string }) => {
      if (!s.key || s.value === undefined) {
        throw new AppError('Each setting must have key and value', 400)
      }

      return prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value, ...(s.group && { group: s.group }) },
        create: { key: s.key, value: s.value, group: s.group || 'general' },
      })
    })
  )

  await prisma.auditLog.create({
    data: {
      action: 'SETTINGS_UPDATED',
      target: 'settings',
      details: { keys: results.map((r) => r.key) },
      userId: req.user!.id,
    },
  })

  res.json({ settings: results })
})

export { router as settingsRouter }
