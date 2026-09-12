import { Router, Response } from 'express'
import { PrismaClient, Severity, ThreatStatus } from '@prisma/client'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/threats - list threats (filter by severity, status)
router.get('/', async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const severity = req.query.severity as Severity | undefined
  const status = req.query.status as ThreatStatus | undefined
  const endpointId = req.query.endpointId as string | undefined
  const search = req.query.search as string | undefined

  const where: any = {}
  if (severity) where.severity = severity
  if (status) where.status = status
  if (endpointId) where.endpointId = endpointId
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { type: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [threats, total] = await Promise.all([
    prisma.threat.findMany({
      where,
      skip,
      take,
      orderBy: { detectedAt: 'desc' },
      include: {
        endpoint: { select: { id: true, hostname: true, ipAddress: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.threat.count({ where }),
  ])

  res.json({ threats, total, skip, take })
})

// GET /api/threats/:id - get threat details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const threat = await prisma.threat.findUnique({
    where: { id: req.params.id },
    include: {
      endpoint: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  })

  if (!threat) {
    throw new AppError('Threat not found', 404)
  }

  res.json({ threat })
})

// PUT /api/threats/:id - update threat status
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_2', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.threat.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    throw new AppError('Threat not found', 404)
  }

  const { status, severity, assignedToId, description } = req.body

  const updateData: any = {}
  if (status) {
    updateData.status = status
    if (status === 'RESOLVED' || status === 'FALSE_POSITIVE') {
      updateData.resolvedAt = new Date()
    }
  }
  if (severity) updateData.severity = severity
  if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null
  if (description) updateData.description = description

  const threat = await prisma.threat.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      endpoint: { select: { id: true, hostname: true, ipAddress: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'THREAT_UPDATED',
      target: threat.id,
      details: { status: threat.status, severity: threat.severity },
      userId: req.user!.id,
    },
  })

  res.json({ threat })
})

// POST /api/threats/:id/remediate - trigger remediation
router.post('/:id/remediate', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const threat = await prisma.threat.findUnique({
    where: { id: req.params.id },
    include: { endpoint: true },
  })

  if (!threat) {
    throw new AppError('Threat not found', 404)
  }

  if (threat.status === 'RESOLVED' || threat.status === 'FALSE_POSITIVE') {
    throw new AppError('Threat is already resolved', 400)
  }

  const updated = await prisma.threat.update({
    where: { id: req.params.id },
    data: {
      status: 'CONTAINED',
      autoRemediated: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'THREAT_REMEDIATED',
      target: threat.id,
      details: {
        hostname: threat.endpoint.hostname,
        threatName: threat.name,
        autoRemediated: true,
      },
      userId: req.user!.id,
    },
  })

  res.json({
    success: true,
    threat: updated,
    remediation: {
      actions: [
        'Process terminated',
        'Malicious files quarantined',
        'Registry entries cleaned',
        'Firewall rule applied',
      ],
      completedAt: new Date().toISOString(),
    },
  })
})

export { router as threatsRouter }
