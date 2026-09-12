import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/firewall - list rules (filter by endpointId)
router.get('/', async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const endpointId = req.query.endpointId as string | undefined
  const action = req.query.action as string | undefined
  const enabled = req.query.enabled as string | undefined

  const where: any = {}
  if (endpointId) where.endpointId = endpointId
  if (action) where.action = action
  if (enabled !== undefined) where.enabled = enabled === 'true'

  const [rules, total] = await Promise.all([
    prisma.firewallRule.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        endpoint: { select: { id: true, hostname: true, ipAddress: true } },
      },
    }),
    prisma.firewallRule.count({ where }),
  ])

  res.json({ rules, total, skip, take })
})

// POST /api/firewall - create rule
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5', 'IT'), async (req: AuthRequest, res: Response) => {
  const { name, action, direction, protocol, localPort, remoteAddress, remotePort, endpointId, enabled } = req.body

  if (!name || !action || !direction || !protocol || !endpointId) {
    throw new AppError('name, action, direction, protocol, and endpointId are required', 400)
  }

  const endpoint = await prisma.endpoint.findUnique({ where: { id: endpointId } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  const rule = await prisma.firewallRule.create({
    data: {
      name,
      action,
      direction,
      protocol,
      localPort: localPort || null,
      remoteAddress: remoteAddress || null,
      remotePort: remotePort || null,
      endpointId,
      enabled: enabled !== undefined ? enabled : true,
    },
    include: {
      endpoint: { select: { id: true, hostname: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'FIREWALL_RULE_CREATED',
      target: rule.id,
      details: { name: rule.name, action: rule.action, endpointId },
      userId: req.user!.id,
    },
  })

  res.status(201).json({ rule })
})

// PUT /api/firewall/:id - update rule
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5', 'IT'), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.firewallRule.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    throw new AppError('Rule not found', 404)
  }

  const { name, action, direction, protocol, localPort, remoteAddress, remotePort, enabled } = req.body

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (action !== undefined) updateData.action = action
  if (direction !== undefined) updateData.direction = direction
  if (protocol !== undefined) updateData.protocol = protocol
  if (localPort !== undefined) updateData.localPort = localPort
  if (remoteAddress !== undefined) updateData.remoteAddress = remoteAddress
  if (remotePort !== undefined) updateData.remotePort = remotePort
  if (enabled !== undefined) updateData.enabled = enabled

  const rule = await prisma.firewallRule.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      endpoint: { select: { id: true, hostname: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'FIREWALL_RULE_UPDATED',
      target: rule.id,
      details: { name: rule.name, action: rule.action },
      userId: req.user!.id,
    },
  })

  res.json({ rule })
})

// DELETE /api/firewall/:id - delete rule
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5', 'IT'), async (req: AuthRequest, res: Response) => {
  const rule = await prisma.firewallRule.findUnique({ where: { id: req.params.id } })
  if (!rule) {
    throw new AppError('Rule not found', 404)
  }

  await prisma.auditLog.create({
    data: {
      action: 'FIREWALL_RULE_DELETED',
      target: rule.id,
      details: { name: rule.name },
      userId: req.user!.id,
    },
  })

  await prisma.firewallRule.delete({ where: { id: req.params.id } })

  res.status(204).send()
})

export { router as firewallRouter }
