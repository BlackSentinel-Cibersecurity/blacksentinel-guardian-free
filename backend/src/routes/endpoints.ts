import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/endpoints - list endpoints (filter by status, os, location)
router.get('/', async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const status = req.query.status as string | undefined
  const os = req.query.os as string | undefined
  const location = req.query.location as string | undefined
  const search = req.query.search as string | undefined

  const where: any = {}
  if (status) where.status = status
  if (os) where.os = { contains: os, mode: 'insensitive' }
  if (location) where.location = { contains: location, mode: 'insensitive' }
  if (search) {
    where.OR = [
      { hostname: { contains: search, mode: 'insensitive' } },
      { ipAddress: { contains: search, mode: 'insensitive' } },
      { user: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [endpoints, total] = await Promise.all([
    prisma.endpoint.findMany({
      where,
      skip,
      take,
      orderBy: { lastSeen: 'desc' },
      include: {
        _count: {
          select: { threats: true, alerts: true, vulnerabilities: true },
        },
      },
    }),
    prisma.endpoint.count({ where }),
  ])

  res.json(endpoints)
})

// GET /api/endpoints/:id - get endpoint with details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const endpoint = await prisma.endpoint.findUnique({
    where: { id: req.params.id },
    include: {
      threats: { orderBy: { detectedAt: 'desc' }, take: 10 },
      alerts: { orderBy: { timestamp: 'desc' }, take: 10 },
      firewallRules: true,
      usbDevices: true,
      departments: { include: { department: true } },
      tags: { include: { tag: true } },
      vulnerabilities: {
        include: { vulnerability: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: { threats: true, alerts: true, firewallRules: true, usbDevices: true },
      },
    },
  })

  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  res.json({ endpoint })
})

// POST /api/endpoints - register new endpoint
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'IT'), async (req: AuthRequest, res: Response) => {
  const {
    hostname, ipAddress, os, osVersion, manufacturer, model: deviceModel,
    cpu, ram, diskTotal, diskUsed, agentVersion, user: endpointUser,
    domain, location, macAddress,
  } = req.body

  if (!hostname || !ipAddress || !os) {
    throw new AppError('hostname, ipAddress, and os are required', 400)
  }

  const registrationToken = uuidv4()

  const endpoint = await prisma.endpoint.create({
    data: {
      hostname,
      ipAddress,
      os: os || 'Unknown',
      osVersion: osVersion || 'Unknown',
      manufacturer: manufacturer || 'Unknown',
      model: deviceModel || 'Unknown',
      cpu: cpu || 'Unknown',
      ram: ram || 0,
      diskTotal: diskTotal || '0',
      diskUsed: diskUsed || '0',
      agentVersion: agentVersion || 'Unknown',
      user: endpointUser || 'Unknown',
      domain: domain || '',
      location: location || 'Unknown',
      macAddress: macAddress || '00:00:00:00:00:00',
      registrationToken,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'ENDPOINT_REGISTERED',
      target: endpoint.id,
      details: { hostname: endpoint.hostname, ipAddress: endpoint.ipAddress },
      userId: req.user!.id,
    },
  })

  res.status(201).json({ endpoint })
})

// PUT /api/endpoints/:id - update endpoint
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'IT'), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.endpoint.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    throw new AppError('Endpoint not found', 404)
  }

  const {
    hostname, ipAddress, os, osVersion, manufacturer, model: deviceModel,
    cpu, ram, diskTotal, diskUsed, status, agentVersion, agentStatus,
    riskScore, user: endpointUser, domain, location, macAddress,
  } = req.body

  const updateData: any = {}
  if (hostname !== undefined) updateData.hostname = hostname
  if (ipAddress !== undefined) updateData.ipAddress = ipAddress
  if (os !== undefined) updateData.os = os
  if (osVersion !== undefined) updateData.osVersion = osVersion
  if (manufacturer !== undefined) updateData.manufacturer = manufacturer
  if (deviceModel !== undefined) updateData.model = deviceModel
  if (cpu !== undefined) updateData.cpu = cpu
  if (ram !== undefined) updateData.ram = ram
  if (diskTotal !== undefined) updateData.diskTotal = diskTotal
  if (diskUsed !== undefined) updateData.diskUsed = diskUsed
  if (status !== undefined) updateData.status = status
  if (agentVersion !== undefined) updateData.agentVersion = agentVersion
  if (agentStatus !== undefined) updateData.agentStatus = agentStatus
  if (riskScore !== undefined) updateData.riskScore = riskScore
  if (endpointUser !== undefined) updateData.user = endpointUser
  if (domain !== undefined) updateData.domain = domain
  if (location !== undefined) updateData.location = location
  if (macAddress !== undefined) updateData.macAddress = macAddress

  const endpoint = await prisma.endpoint.update({
    where: { id: req.params.id },
    data: updateData,
  })

  res.json({ endpoint })
})

// DELETE /api/endpoints/:id - delete endpoint
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const endpoint = await prisma.endpoint.findUnique({ where: { id: req.params.id } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  await prisma.auditLog.create({
    data: {
      action: 'ENDPOINT_DELETED',
      target: endpoint.id,
      details: { hostname: endpoint.hostname },
      userId: req.user!.id,
    },
  })

  await prisma.endpoint.delete({ where: { id: req.params.id } })

  res.status(204).send()
})

// POST /api/endpoints/:id/isolate - isolate endpoint
router.post('/:id/isolate', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const endpoint = await prisma.endpoint.findUnique({ where: { id: req.params.id } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  const updated = await prisma.endpoint.update({
    where: { id: req.params.id },
    data: { status: 'ISOLATED' },
  })

  await prisma.auditLog.create({
    data: {
      action: 'ENDPOINT_ISOLATED',
      target: endpoint.id,
      details: { hostname: endpoint.hostname, previousStatus: endpoint.status },
      userId: req.user!.id,
    },
  })

  res.json({ success: true, endpoint: updated })
})

// POST /api/endpoints/:id/restore - restore endpoint
router.post('/:id/restore', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const endpoint = await prisma.endpoint.findUnique({ where: { id: req.params.id } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  const updated = await prisma.endpoint.update({
    where: { id: req.params.id },
    data: { status: 'ONLINE' },
  })

  await prisma.auditLog.create({
    data: {
      action: 'ENDPOINT_RESTORED',
      target: endpoint.id,
      details: { hostname: endpoint.hostname },
      userId: req.user!.id,
    },
  })

  res.json({ success: true, endpoint: updated })
})

// POST /api/endpoints/agent/register - agent registration
router.post('/agent/register', async (req: AuthRequest, res: Response) => {
  const { registrationToken, hostname, os, osVersion, agentVersion } = req.body

  if (!registrationToken) {
    throw new AppError('Registration token required', 400)
  }

  const endpoint = await prisma.endpoint.findFirst({
    where: { registrationToken },
  })

  if (!endpoint) {
    throw new AppError('Invalid registration token', 401)
  }

  const updated = await prisma.endpoint.update({
    where: { id: endpoint.id },
    data: {
      registrationToken: null,
      status: 'ONLINE',
      agentStatus: 'HEALTHY',
      lastHeartbeat: new Date(),
      lastSeen: new Date(),
      ...(hostname && { hostname }),
      ...(os && { os }),
      ...(osVersion && { osVersion }),
      ...(agentVersion && { agentVersion }),
    },
  })

  res.json({
    endpointId: updated.id,
    config: {
      heartbeatInterval: 30000,
      scanInterval: 300000,
      logLevel: 'info',
    },
  })
})

// POST /api/endpoints/agent/heartbeat - agent heartbeat
router.post('/agent/heartbeat', async (req: AuthRequest, res: Response) => {
  const { endpointId, agentStatus, cpu, ram, diskUsed } = req.body

  if (!endpointId) {
    throw new AppError('Endpoint ID required', 400)
  }

  const endpoint = await prisma.endpoint.findUnique({ where: { id: endpointId } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  const updateData: any = {
    lastHeartbeat: new Date(),
    lastSeen: new Date(),
    status: 'ONLINE',
  }
  if (agentStatus) updateData.agentStatus = agentStatus
  if (cpu !== undefined) updateData.cpu = cpu
  if (ram !== undefined) updateData.ram = ram
  if (diskUsed !== undefined) updateData.diskUsed = diskUsed

  const updated = await prisma.endpoint.update({
    where: { id: endpointId },
    data: updateData,
  })

  res.json({ success: true, lastSeen: updated.lastSeen })
})

export { router as endpointsRouter }
