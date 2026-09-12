import { Router, Response } from 'express'
import { PrismaClient, Role } from '@prisma/client'
import { hashPassword } from '../utils/password.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()
const prisma = new PrismaClient()

const VALID_ROLES: Role[] = [
  'SUPER_ADMIN', 'ADMIN', 'SOC_TIER_1', 'SOC_TIER_2', 'SOC_TIER_3',
  'SOC_TIER_4', 'SOC_TIER_5', 'AUDITOR_1', 'AUDITOR_2', 'AUDITOR_3',
  'IT', 'ANALYST', 'VIEWER',
]

router.use(authenticateToken)

// GET /api/users - list all users (paginated)
router.get('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const skip = Math.max(0, parseInt(req.query.skip as string) || 0)
  const take = Math.min(100, Math.max(1, parseInt(req.query.take as string) || 20))
  const search = req.query.search as string | undefined
  const role = req.query.role as Role | undefined

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (role && VALID_ROLES.includes(role)) {
    where.role = role
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ])

  res.json({ users, total, skip, take })
})

// GET /api/users/:id - get user by id
router.get('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mfaEnabled: true,
      mfaVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.json({ user })
})

// POST /api/users - create user
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { email, password, name, role } = req.body

  if (!email || !password || !name || !role) {
    throw new AppError('Email, password, name, and role are required', 400)
  }

  if (!VALID_ROLES.includes(role as Role)) {
    throw new AppError(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, 400)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new AppError('Email already registered', 409)
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role as Role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mfaEnabled: true,
      createdAt: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'USER_CREATED',
      target: user.id,
      details: { email: user.email, role: user.role },
      userId: req.user!.id,
    },
  })

  res.status(201).json({ user })
})

// PUT /api/users/:id - update user
router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { email, name, role, password } = req.body

  const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!existing) {
    throw new AppError('User not found', 404)
  }

  if (email && email !== existing.email) {
    const duplicate = await prisma.user.findUnique({ where: { email } })
    if (duplicate) {
      throw new AppError('Email already in use', 409)
    }
  }

  if (role && !VALID_ROLES.includes(role as Role)) {
    throw new AppError(`Invalid role`, 400)
  }

  const updateData: any = {}
  if (email) updateData.email = email
  if (name) updateData.name = name
  if (role) updateData.role = role as Role
  if (password) updateData.password = await hashPassword(password)

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mfaEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'USER_UPDATED',
      target: user.id,
      details: { email: user.email, role: user.role },
      userId: req.user!.id,
    },
  })

  res.json({ user })
})

// DELETE /api/users/:id - delete user
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.role === 'SUPER_ADMIN') {
    const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } })
    if (superAdminCount <= 1) {
      throw new AppError('Cannot delete the last SUPER_ADMIN', 400)
    }
  }

  if (user.id === req.user!.id) {
    throw new AppError('Cannot delete your own account', 400)
  }

  await prisma.auditLog.create({
    data: {
      action: 'USER_DELETED',
      target: user.id,
      details: { email: user.email, role: user.role },
      userId: req.user!.id,
    },
  })

  await prisma.user.delete({ where: { id: req.params.id } })

  res.status(204).send()
})

export { router as usersRouter }
