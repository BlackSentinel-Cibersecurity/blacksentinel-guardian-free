import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/audit - list audit logs (paginated, filterable)
router.get('/', async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const userId = req.query.userId as string | undefined
  const action = req.query.action as string | undefined
  const target = req.query.target as string | undefined
  const startDate = req.query.startDate as string | undefined
  const endDate = req.query.endDate as string | undefined

  const where: any = {}
  if (userId) where.userId = userId
  if (action) where.action = { contains: action, mode: 'insensitive' }
  if (target) where.target = { contains: target, mode: 'insensitive' }
  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = new Date(startDate)
    if (endDate) where.timestamp.lte = new Date(endDate)
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  res.json({ logs, total, skip, take })
})

export { router as auditRouter }
