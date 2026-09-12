import { Router, Response } from 'express'
import { PrismaClient, Severity } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/vulnerabilities - list vulnerabilities
router.get('/', async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const severity = req.query.severity as Severity | undefined
  const search = req.query.search as string | undefined
  const exploited = req.query.exploited as string | undefined

  const where: any = {}
  if (severity) where.severity = severity
  if (exploited !== undefined) where.exploitedInWild = exploited === 'true'
  if (search) {
    where.OR = [
      { cveId: { contains: search, mode: 'insensitive' } },
      { software: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [vulnerabilities, total] = await Promise.all([
    prisma.vulnerability.findMany({
      where,
      skip,
      take,
      orderBy: { publishDate: 'desc' },
      include: {
        _count: { select: { endpoints: true } },
      },
    }),
    prisma.vulnerability.count({ where }),
  ])

  res.json({ vulnerabilities, total, skip, take })
})

// GET /api/vulnerabilities/:id - get vulnerability
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const vulnerability = await prisma.vulnerability.findUnique({
    where: { id: req.params.id },
    include: {
      endpoints: {
        include: {
          endpoint: { select: { id: true, hostname: true, ipAddress: true } },
        },
      },
    },
  })

  if (!vulnerability) {
    throw new AppError('Vulnerability not found', 404)
  }

  res.json({ vulnerability })
})

// PUT /api/vulnerabilities/:id - update vulnerability
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.vulnerability.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    throw new AppError('Vulnerability not found', 404)
  }

  const { patchAvailable, exploitedInTheWild, details, references } = req.body

  const updateData: any = {}
  if (patchAvailable !== undefined) updateData.patchAvailable = patchAvailable
  if (exploitedInTheWild !== undefined) updateData.exploitedInTheWild = exploitedInTheWild
  if (details !== undefined) updateData.details = details
  if (references !== undefined) updateData.references = references

  const vulnerability = await prisma.vulnerability.update({
    where: { id: req.params.id },
    data: updateData,
  })

  res.json({ vulnerability })
})

export { router as vulnerabilitiesRouter }
