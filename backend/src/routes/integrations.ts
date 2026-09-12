import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/integrations - list
router.get('/', async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const category = req.query.category as string | undefined
  const status = req.query.status as string | undefined

  const where: any = {}
  if (category) where.category = category
  if (status) where.status = status

  const [integrations, total] = await Promise.all([
    prisma.integration.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.integration.count({ where }),
  ])

  res.json({ integrations, total, skip, take })
})

// POST /api/integrations - create
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { name, category, config } = req.body

  if (!name || !category) {
    throw new AppError('name and category are required', 400)
  }

  const integration = await prisma.integration.create({
    data: {
      name,
      category,
      config: config || undefined,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'INTEGRATION_CREATED',
      target: integration.id,
      details: { name: integration.name, category: integration.category },
      userId: req.user!.id,
    },
  })

  res.status(201).json({ integration })
})

// PUT /api/integrations/:id - update
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.integration.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    throw new AppError('Integration not found', 404)
  }

  const { name, category, config, status } = req.body

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (category !== undefined) updateData.category = category
  if (config !== undefined) updateData.config = config
  if (status !== undefined) {
    updateData.status = status
    if (status === 'CONNECTED') updateData.lastSync = new Date()
  }

  const integration = await prisma.integration.update({
    where: { id: req.params.id },
    data: updateData,
  })

  await prisma.auditLog.create({
    data: {
      action: 'INTEGRATION_UPDATED',
      target: integration.id,
      details: { name: integration.name, status: integration.status },
      userId: req.user!.id,
    },
  })

  res.json({ integration })
})

// DELETE /api/integrations/:id - delete
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const integration = await prisma.integration.findUnique({ where: { id: req.params.id } })
  if (!integration) {
    throw new AppError('Integration not found', 404)
  }

  await prisma.auditLog.create({
    data: {
      action: 'INTEGRATION_DELETED',
      target: integration.id,
      details: { name: integration.name },
      userId: req.user!.id,
    },
  })

  await prisma.integration.delete({ where: { id: req.params.id } })

  res.status(204).send()
})

export { router as integrationsRouter }
