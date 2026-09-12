import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/usb - list devices
router.get('/', async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const endpointId = req.query.endpointId as string | undefined
  const status = req.query.status as string | undefined
  const search = req.query.search as string | undefined

  const where: any = {}
  if (endpointId) where.endpointId = endpointId
  if (status) where.status = status
  if (search) {
    where.OR = [
      { deviceName: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
      { vendorId: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [devices, total] = await Promise.all([
    prisma.uSBDevice.findMany({
      where,
      skip,
      take,
      orderBy: { lastSeen: 'desc' },
      include: {
        endpoint: { select: { id: true, hostname: true, ipAddress: true } },
      },
    }),
    prisma.uSBDevice.count({ where }),
  ])

  res.json({ devices, total, skip, take })
})

// POST /api/usb - register device
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'IT'), async (req: AuthRequest, res: Response) => {
  const { vendorId, productId, deviceName, serialNumber, endpointId, deviceType } = req.body

  if (!vendorId || !productId || !deviceName || !serialNumber || !endpointId) {
    throw new AppError('vendorId, productId, deviceName, serialNumber, and endpointId are required', 400)
  }

  const endpoint = await prisma.endpoint.findUnique({ where: { id: endpointId } })
  if (!endpoint) {
    throw new AppError('Endpoint not found', 404)
  }

  const device = await prisma.uSBDevice.create({
    data: {
      vendorId,
      productId,
      deviceName,
      serialNumber,
      endpointId,
      deviceType: deviceType || 'unknown',
    },
    include: {
      endpoint: { select: { id: true, hostname: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'USB_DEVICE_REGISTERED',
      target: device.id,
      details: { deviceName: device.deviceName, serialNumber: device.serialNumber },
      userId: req.user!.id,
    },
  })

  res.status(201).json({ device })
})

// PUT /api/usb/:id - update device status
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'IT', 'SOC_TIER_2', 'SOC_TIER_3'), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.uSBDevice.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    throw new AppError('Device not found', 404)
  }

  const { status, deviceName } = req.body

  const updateData: any = {}
  if (status) updateData.status = status
  if (deviceName) updateData.deviceName = deviceName
  updateData.lastSeen = new Date()

  const device = await prisma.uSBDevice.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      endpoint: { select: { id: true, hostname: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'USB_DEVICE_UPDATED',
      target: device.id,
      details: { status: device.status, deviceName: device.deviceName },
      userId: req.user!.id,
    },
  })

  res.json({ device })
})

// DELETE /api/usb/:id - delete device
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN', 'IT'), async (req: AuthRequest, res: Response) => {
  const device = await prisma.uSBDevice.findUnique({ where: { id: req.params.id } })
  if (!device) {
    throw new AppError('Device not found', 404)
  }

  await prisma.auditLog.create({
    data: {
      action: 'USB_DEVICE_DELETED',
      target: device.id,
      details: { deviceName: device.deviceName },
      userId: req.user!.id,
    },
  })

  await prisma.uSBDevice.delete({ where: { id: req.params.id } })

  res.status(204).send()
})

export { router as usbRouter }
