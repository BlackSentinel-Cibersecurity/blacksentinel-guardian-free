import { Router, Response } from 'express'
import { PrismaClient, Severity, AlertStatus } from '@prisma/client'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/alerts - list alerts (filter by severity, status)
router.get('/', async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const severity = req.query.severity as Severity | undefined
  const status = req.query.status as AlertStatus | undefined
  const endpointId = req.query.endpointId as string | undefined
  const search = req.query.search as string | undefined

  const where: any = {}
  if (severity) where.severity = severity
  if (status) where.status = status
  if (endpointId) where.endpointId = endpointId
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { source: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      skip,
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        endpoint: { select: { id: true, hostname: true, ipAddress: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.alert.count({ where }),
  ])

  res.json({ alerts, total, skip, take })
})

// GET /api/alerts/:id - get alert
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const alert = await prisma.alert.findUnique({
    where: { id: req.params.id },
    include: {
      endpoint: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  })

  if (!alert) {
    throw new AppError('Alert not found', 404)
  }

  res.json({ alert })
})

// PUT /api/alerts/:id/acknowledge - acknowledge alert
router.put('/:id/acknowledge', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_1', 'SOC_TIER_2', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const alert = await prisma.alert.findUnique({ where: { id: req.params.id } })
  if (!alert) {
    throw new AppError('Alert not found', 404)
  }

  if (alert.status !== 'NEW') {
    throw new AppError('Alert has already been acknowledged', 400)
  }

  const updated = await prisma.alert.update({
    where: { id: req.params.id },
    data: {
      status: 'INVESTIGATING',
      acknowledgedAt: new Date(),
      createdById: alert.createdById || req.user!.id,
    },
    include: {
      endpoint: { select: { id: true, hostname: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'ALERT_ACKNOWLEDGED',
      target: alert.id,
      details: { title: alert.title, severity: alert.severity },
      userId: req.user!.id,
    },
  })

  res.json({ alert: updated })
})

// PUT /api/alerts/:id/resolve - resolve alert
router.put('/:id/resolve', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_2', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const alert = await prisma.alert.findUnique({ where: { id: req.params.id } })
  if (!alert) {
    throw new AppError('Alert not found', 404)
  }

  if (alert.status === 'RESOLVED') {
    throw new AppError('Alert is already resolved', 400)
  }

  const { resolution } = req.body
  const isFalsePositive = resolution === 'false_positive'

  const updated = await prisma.alert.update({
    where: { id: req.params.id },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
    include: {
      endpoint: { select: { id: true, hostname: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      action: isFalsePositive ? 'ALERT_FALSE_POSITIVE' : 'ALERT_RESOLVED',
      target: alert.id,
      details: { title: alert.title, resolution },
      userId: req.user!.id,
    },
  })

  res.json({ alert: updated })
})

// PUT /api/alerts/:id/assign - assign to user
router.put('/:id/assign', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_2', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const alert = await prisma.alert.findUnique({ where: { id: req.params.id } })
  if (!alert) {
    throw new AppError('Alert not found', 404)
  }

  const { assignedToId } = req.body

  if (assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: assignedToId } })
    if (!assignee) {
      throw new AppError('Assignee not found', 404)
    }
  }

  const updated = await prisma.alert.update({
    where: { id: req.params.id },
    data: {
      assignedToId: assignedToId || null,
      ...(alert.status === 'NEW' && { status: 'INVESTIGATING' }),
    },
    include: {
      endpoint: { select: { id: true, hostname: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'ALERT_ASSIGNED',
      target: alert.id,
      details: { title: alert.title, assignedToId },
      userId: req.user!.id,
    },
  })

  res.json({ alert: updated })
})

export { router as alertsRouter }
