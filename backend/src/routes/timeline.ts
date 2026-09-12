import { Router, Response } from 'express'
import { PrismaClient, Severity } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/timeline - list events (filter by endpointId, category, date range)
router.get('/', async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const endpointId = req.query.endpointId as string | undefined
  const category = req.query.category as string | undefined
  const severity = req.query.severity as Severity | undefined
  const startDate = req.query.startDate as string | undefined
  const endDate = req.query.endDate as string | undefined

  const where: any = {}
  if (endpointId) where.endpointId = endpointId
  if (category) where.category = category
  if (severity) where.severity = severity
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate)
    if (endDate) where.timestamp.lte = new Date(endDate)
  }

  const [events, total] = await Promise.all([
    prisma.timelineEvent.findMany({
      where,
      skip,
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        endpoint: { select: { id: true, hostname: true, ipAddress: true } },
      },
    }),
    prisma.timelineEvent.count({ where }),
  ])

  res.json({ events, total, skip, take })
})

// POST /api/timeline - create event (used by agents)
router.post('/', async (req: AuthRequest, res: Response) => {
  const { endpointId, category, title, description, details, severity } = req.body

  if (!endpointId || !category || !title || !description) {
    throw new AppError('endpointId, category, title, and description are required', 400)
  }

  const endpoint = await prisma.endpoint.findUnique({ where: { id: endpointId } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  const event = await prisma.timelineEvent.create({
    data: {
      endpointId,
      category,
      title,
      description,
      details: details || undefined,
      severity: severity || 'INFO',
    },
    include: {
      endpoint: { select: { id: true, hostname: true } },
    },
  })

  res.status(201).json({ event })
})

export { router as timelineRouter }
