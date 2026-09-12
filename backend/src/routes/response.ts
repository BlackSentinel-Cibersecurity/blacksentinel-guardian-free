import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// POST /api/response/isolate - isolate endpoint
router.post('/isolate', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const { endpointId } = req.body

  if (!endpointId) {
    throw new AppError('endpointId is required', 400)
  }

  const endpoint = await prisma.endpoint.findUnique({ where: { id: endpointId } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  const updated = await prisma.endpoint.update({
    where: { id: endpointId },
    data: { status: 'ISOLATED' },
  })

  await prisma.auditLog.create({
    data: {
      action: 'ENDPOINT_ISOLATED',
      target: endpointId,
      details: { hostname: endpoint.hostname, action: 'isolate' },
      userId: req.user!.id,
    },
  })

  res.json({
    success: true,
    actionId: `ra-${Date.now()}`,
    endpoint: updated,
    message: `Endpoint ${endpoint.hostname} has been isolated`,
  })
})

// POST /api/response/restore - restore endpoint
router.post('/restore', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const { endpointId } = req.body

  if (!endpointId) {
    throw new AppError('endpointId is required', 400)
  }

  const endpoint = await prisma.endpoint.findUnique({ where: { id: endpointId } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  const updated = await prisma.endpoint.update({
    where: { id: endpointId },
    data: { status: 'ONLINE' },
  })

  await prisma.auditLog.create({
    data: {
      action: 'ENDPOINT_RESTORED',
      target: endpointId,
      details: { hostname: endpoint.hostname, action: 'restore' },
      userId: req.user!.id,
    },
  })

  res.json({
    success: true,
    actionId: `ra-${Date.now()}`,
    endpoint: updated,
    message: `Endpoint ${endpoint.hostname} has been restored`,
  })
})

// POST /api/response/block-ip - add firewall block
router.post('/block-ip', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const { endpointId, ipAddress, protocol, remotePort } = req.body

  if (!endpointId || !ipAddress) {
    throw new AppError('endpointId and ipAddress are required', 400)
  }

  const endpoint = await prisma.endpoint.findUnique({ where: { id: endpointId } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  const rule = await prisma.firewallRule.create({
    data: {
      name: `Block IP ${ipAddress}`,
      action: 'deny',
      direction: 'inbound',
      protocol: protocol || 'any',
      remoteAddress: ipAddress,
      remotePort: remotePort || null,
      endpointId,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'IP_BLOCKED',
      target: rule.id,
      details: { ipAddress, endpointId, hostname: endpoint.hostname },
      userId: req.user!.id,
    },
  })

  res.json({
    success: true,
    actionId: `ra-${Date.now()}`,
    rule,
    message: `IP ${ipAddress} has been blocked on ${endpoint.hostname}`,
  })
})

// POST /api/response/quarantine-file - quarantine file
router.post('/quarantine-file', requireRole('SUPER_ADMIN', 'ADMIN', 'SOC_TIER_3', 'SOC_TIER_4', 'SOC_TIER_5'), async (req: AuthRequest, res: Response) => {
  const { endpointId, filePath, fileHash } = req.body

  if (!endpointId || !filePath) {
    throw new AppError('endpointId and filePath are required', 400)
  }

  const endpoint = await prisma.endpoint.findUnique({ where: { id: endpointId } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  await prisma.auditLog.create({
    data: {
      action: 'FILE_QUARANTINED',
      target: endpointId,
      details: { filePath, fileHash, hostname: endpoint.hostname },
      userId: req.user!.id,
    },
  })

  res.json({
    success: true,
    actionId: `ra-${Date.now()}`,
    message: `File ${filePath} has been quarantined on ${endpoint.hostname}`,
    quarantine: {
      originalPath: filePath,
      quarantinePath: `/quarantine/${Date.now()}_${filePath.split('/').pop()}`,
      hash: fileHash || 'pending',
      quarantinedAt: new Date().toISOString(),
    },
  })
})

export { router as responseRouter }
