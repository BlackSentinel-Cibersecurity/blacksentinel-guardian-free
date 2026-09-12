import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'
import { editionConfig } from '../config/edition.js'
import crypto from 'crypto'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const endpoints = await prisma.endpoint.findMany({
      where: { registrationToken: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        hostname: true,
        ipAddress: true,
        os: true,
        location: true,
        domain: true,
        status: true,
        agentStatus: true,
        registrationToken: true,
        lastHeartbeat: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const registrations = endpoints.map(ep => ({
      id: ep.id,
      hostname: ep.hostname,
      ipAddress: ep.ipAddress,
      os: ep.os,
      location: ep.location,
      department: ep.domain,
      registrationToken: ep.registrationToken || '',
      installCommand: `curl -sSL https://releases.blacksentinel.io/agent/install.sh | bash -s -- --token ${ep.registrationToken || ''}`,
      status: ep.status === 'ONLINE' ? 'online' :
              ep.status === 'OFFLINE' ? 'offline' :
              ep.agentStatus === 'HEALTHY' ? 'agent_installed' :
              'pending_registration',
      registeredAt: ep.createdAt,
      lastHeartbeat: ep.lastHeartbeat,
      agentInstalledAt: ep.agentStatus !== 'UNINSTALLED' ? ep.updatedAt : null,
      registeredBy: '',
    }))

    res.json(registrations)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch registrations' })
  }
})

router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'IT'), async (req: AuthRequest, res: Response) => {
  try {
    const { hostname, ipAddress, os, location, department } = req.body

    if (!hostname || !ipAddress) {
      throw new AppError('hostname and ipAddress are required', 400)
    }

    if (editionConfig.limits.maxEndpoints !== Infinity) {
      const currentCount = await prisma.endpoint.count()
      if (currentCount >= editionConfig.limits.maxEndpoints) {
        throw new AppError(
          `Free plan is limited to ${editionConfig.limits.maxEndpoints} endpoints. Upgrade to add more.`,
          403,
        )
      }
    }

    const registrationToken = crypto.randomBytes(32).toString('hex')

    const endpoint = await prisma.endpoint.create({
      data: {
        hostname,
        ipAddress,
        os: os || 'unknown',
        osVersion: '',
        manufacturer: '',
        model: '',
        cpu: '',
        ram: 0,
        diskTotal: '0',
        diskUsed: '0',
        status: 'OFFLINE',
        agentVersion: '',
        agentStatus: 'UNINSTALLED',
        riskScore: 0,
        user: '',
        domain: department || '',
        location: location || '',
        macAddress: '',
        registrationToken,
      },
    })

    res.status(201).json({
      id: endpoint.id,
      hostname: endpoint.hostname,
      ipAddress: endpoint.ipAddress,
      os: endpoint.os,
      location: endpoint.location,
      department: endpoint.domain,
      registrationToken,
      installCommand: `curl -sSL https://releases.blacksentinel.io/agent/install.sh | bash -s -- --token ${registrationToken}`,
      status: 'pending_registration',
      registeredAt: endpoint.createdAt,
      lastHeartbeat: null,
      agentInstalledAt: null,
      registeredBy: req.user!.email,
    })
  } catch (err) {
    if (err instanceof AppError) throw err
    res.status(500).json({ error: 'Failed to create registration' })
  }
})

router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'IT'), async (req: AuthRequest, res: Response) => {
  try {
    const endpoint = await prisma.endpoint.findUnique({ where: { id: req.params.id } })
    if (!endpoint) {
      throw new AppError('Registration not found', 404)
    }

    await prisma.endpoint.delete({ where: { id: req.params.id } })

    res.status(204).send()
  } catch (err) {
    if (err instanceof AppError) throw err
    res.status(500).json({ error: 'Failed to delete registration' })
  }
})

router.get('/:id/install-command', async (req: AuthRequest, res: Response) => {
  try {
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: req.params.id },
      select: { registrationToken: true, hostname: true },
    })

    if (!endpoint || !endpoint.registrationToken) {
      throw new AppError('Registration not found', 404)
    }

    res.json({
      command: `curl -sSL https://releases.blacksentinel.io/agent/install.sh | bash -s -- --token ${endpoint.registrationToken}`,
      token: endpoint.registrationToken,
    })
  } catch (err) {
    if (err instanceof AppError) throw err
    res.status(500).json({ error: 'Failed to get install command' })
  }
})

export default router
