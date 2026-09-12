import { Router, Response } from 'express'
import { PrismaClient, Role } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { generateMfaSecret, generateQrCode, verifyMfaToken } from '../utils/mfa.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'
import { AppError } from '../middleware/errorHandler.js'
import {
  isBootstrapMode,
  validateBootstrapCredentials,
  generateBootstrapToken,
  disableBootstrapMode,
} from '../utils/bootstrap.js'
import { BOOTSTRAP_CREDENTIALS } from '../config/bootstrap.js'

const router = Router()
const prisma = new PrismaClient()

const VALID_ROLES: Role[] = [
  'SUPER_ADMIN', 'ADMIN', 'SOC_TIER_1', 'SOC_TIER_2', 'SOC_TIER_3',
  'SOC_TIER_4', 'SOC_TIER_5', 'AUDITOR_1', 'AUDITOR_2', 'AUDITOR_3',
  'IT', 'ANALYST', 'VIEWER',
]

// GET /api/auth/status - bootstrap status check
router.get('/status', async (_req: AuthRequest, res: Response) => {
  try {
    let dbConnected = true
    let hasUsers = false
    try {
      await prisma.$queryRaw`SELECT 1`
      const count = await prisma.user.count()
      hasUsers = count > 0
    } catch {
      dbConnected = false
    }

    const bootstrapMode = !dbConnected || !hasUsers

    res.json({
      bootstrapMode,
      dbConnected,
      hasUsers,
      defaultCredentials: bootstrapMode ? {
        email: BOOTSTRAP_CREDENTIALS.email,
        password: BOOTSTRAP_CREDENTIALS.password,
      } : undefined,
    })
  } catch {
    res.json({
      bootstrapMode: true,
      dbConnected: false,
      hasUsers: false,
      defaultCredentials: {
        email: BOOTSTRAP_CREDENTIALS.email,
        password: BOOTSTRAP_CREDENTIALS.password,
      },
    })
  }
})

// POST /api/auth/bootstrap/login
router.post('/bootstrap/login', authRateLimiter, async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }

  if (!isBootstrapMode()) {
    throw new AppError('Bootstrap mode is not active. System is already configured.', 403)
  }

  if (!validateBootstrapCredentials(email, password)) {
    throw new AppError('Invalid bootstrap credentials', 401)
  }

  const token = generateBootstrapToken()

  console.log(`[BOOTSTRAP] Login successful from ${req.ip} at ${new Date().toISOString()}`)

  res.json({
    token,
    bootstrap: true,
    user: {
      id: 'bootstrap-user',
      email: BOOTSTRAP_CREDENTIALS.email,
      name: BOOTSTRAP_CREDENTIALS.name,
      role: BOOTSTRAP_CREDENTIALS.role,
    },
  })
})

// POST /api/auth/bootstrap/complete - create first real user and disable bootstrap
router.post('/bootstrap/complete', authRateLimiter, async (req: AuthRequest, res: Response) => {
  const { email, password, name, confirmPassword } = req.body

  if (!isBootstrapMode()) {
    throw new AppError('Bootstrap mode is not active', 403)
  }

  if (!email || !password || !name || !confirmPassword) {
    throw new AppError('All fields are required', 400)
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400)
  }

  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.valid) {
    throw new AppError(`Weak password: ${passwordValidation.errors.join(', ')}`, 400)
  }

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    throw new AppError('Database is not connected. Please configure your database first.', 503)
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new AppError('Email already registered', 409)
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'SUPER_ADMIN',
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

  disableBootstrapMode()

  console.log(`[BOOTSTRAP] First user created: ${user.email} (${user.id}) at ${new Date().toISOString()}`)

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  })

  const tokenId = uuidv4()
  const refreshToken = signRefreshToken(user.id, tokenId)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.session.create({
    data: {
      token: refreshToken,
      userId: user.id,
      type: 'refresh',
      expiresAt,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'BOOTSTRAP_COMPLETED',
      target: user.id,
      details: { email: user.email, role: user.role },
      userId: user.id,
    },
  })

  res.json({
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
    },
  })
})

// POST /api/auth/bootstrap/test-db - test database connection
router.post('/bootstrap/test-db', async (_req: AuthRequest, res: Response) => {
  const { host, port, database, user, password } = _req.body

  if (!host || !port || !database || !user || !password) {
    throw new AppError('All database fields are required', 400)
  }

  const { Client } = await import('pg')
  const client = new Client({
    host,
    port: parseInt(port, 10),
    database,
    user,
    password,
    connectionTimeoutMillis: 5000,
  })

  try {
    await client.connect()
    await client.query('SELECT 1')
    await client.end()
    res.json({ success: true, message: 'Connection successful' })
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Connection failed' })
  }
})

// POST /api/auth/register (admin only)
router.post('/register', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  if (req.bootstrapUser) {
    throw new AppError('Cannot register users while in bootstrap mode. Use /api/auth/bootstrap/complete instead.', 403)
  }

  const { email, password, name, role } = req.body

  if (!email || !password || !name || !role) {
    throw new AppError('Email, password, name, and role are required', 400)
  }

  if (!VALID_ROLES.includes(role as Role)) {
    throw new AppError(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, 400)
  }

  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.valid) {
    throw new AppError(`Weak password: ${passwordValidation.errors.join(', ')}`, 400)
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
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

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  })
})

// POST /api/auth/login
router.post('/login', authRateLimiter, async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new AppError('Email and password are required', 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new AppError('Invalid credentials', 401)
  }

  const isValidPassword = await comparePassword(password, user.password)
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401)
  }

  if (user.mfaEnabled) {
    const tempToken = signAccessToken({
      id: user.id,
      email: user.email,
      role: '_MFA_PENDING',
    })
    return res.json({
      mfaRequired: true,
      tempToken,
      userId: user.id,
    })
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  })

  const tokenId = uuidv4()
  const refreshToken = signRefreshToken(user.id, tokenId)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.session.create({
    data: {
      token: refreshToken,
      userId: user.id,
      type: 'refresh',
      expiresAt,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'USER_LOGIN',
      target: user.id,
      details: { email: user.email },
      userId: user.id,
    },
  })

  res.json({
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
    },
  })
})

// POST /api/auth/refresh
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  const { token: refreshToken, refreshToken: refreshTokenAlt } = req.body
  const refreshTokenValue = refreshToken || refreshTokenAlt

  if (!refreshTokenValue) {
    throw new AppError('Refresh token required', 400)
  }

  let decoded
  try {
    decoded = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const storedSession = await prisma.session.findUnique({
    where: { token: refreshTokenValue },
    include: { user: true },
  })

  if (!storedSession) {
    throw new AppError('Refresh token not found', 401)
  }

  if (storedSession.type !== 'refresh') {
    throw new AppError('Invalid session type', 401)
  }

  if (new Date() > storedSession.expiresAt) {
    await prisma.session.delete({ where: { id: storedSession.id } })
    throw new AppError('Refresh token expired', 401)
  }

  if (storedSession.userId !== decoded.userId) {
    throw new AppError('Invalid refresh token', 401)
  }

  await prisma.session.delete({ where: { id: storedSession.id } })

  const newAccessToken = signAccessToken({
    id: storedSession.user.id,
    email: storedSession.user.email,
    role: storedSession.user.role,
  })

  const newTokenId = uuidv4()
  const newRefreshToken = signRefreshToken(storedSession.user.id, newTokenId)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.session.create({
    data: {
      token: newRefreshToken,
      userId: storedSession.user.id,
      type: 'refresh',
      expiresAt,
    },
  })

  res.json({
    token: newAccessToken,
    refreshToken: newRefreshToken,
  })
})

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body

  if (refreshToken) {
    await prisma.session.deleteMany({
      where: {
        token: refreshToken,
        userId: req.user!.id,
        type: 'refresh',
      },
    })
  }

  await prisma.auditLog.create({
    data: {
      action: 'USER_LOGOUT',
      target: req.user!.id,
      details: { email: req.user!.email },
      userId: req.user!.id,
    },
  })

  res.json({ message: 'Logged out successfully' })
})

// POST /api/auth/mfa/setup
router.post('/mfa/setup', authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.mfaEnabled) {
    throw new AppError('MFA is already enabled', 400)
  }

  const mfaSetup = generateMfaSecret(user.email)
  const qrCodeDataUrl = await generateQrCode(mfaSetup.otpauthUrl)

  await prisma.user.update({
    where: { id: user.id },
    data: { mfaSecret: mfaSetup.secret },
  })

  res.json({
    secret: mfaSetup.secret,
    otpauthUrl: mfaSetup.otpauthUrl,
    qrCode: qrCodeDataUrl,
  })
})

// POST /api/auth/mfa/verify
router.post('/mfa/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { code } = req.body

  if (!code) {
    throw new AppError('Verification code required', 400)
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.mfaEnabled) {
    throw new AppError('MFA is already enabled', 400)
  }

  if (!user.mfaSecret) {
    throw new AppError('MFA setup required. Call /mfa/setup first', 400)
  }

  const isValid = verifyMfaToken(user.mfaSecret, code)

  if (!isValid) {
    throw new AppError('Invalid verification code', 400)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { mfaEnabled: true, mfaVerified: true },
  })

  await prisma.auditLog.create({
    data: {
      action: 'MFA_ENABLED',
      target: user.id,
      details: { email: user.email },
      userId: user.id,
    },
  })

  res.json({ message: 'MFA enabled successfully' })
})

// POST /api/auth/mfa/validate
router.post('/mfa/validate', authRateLimiter, async (req: AuthRequest, res: Response) => {
  const { tempToken, code } = req.body

  if (!tempToken || !code) {
    throw new AppError('Temp token and verification code required', 400)
  }

  let decoded
  try {
    decoded = verifyRefreshToken(tempToken)
  } catch {
    throw new AppError('Invalid or expired temp token', 401)
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (!user.mfaEnabled || !user.mfaSecret) {
    throw new AppError('MFA is not enabled for this user', 400)
  }

  const isValid = verifyMfaToken(user.mfaSecret, code)

  if (!isValid) {
    throw new AppError('Invalid MFA code', 401)
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  })

  const tokenId = uuidv4()
  const refreshToken = signRefreshToken(user.id, tokenId)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.session.create({
    data: {
      token: refreshToken,
      userId: user.id,
      type: 'refresh',
      expiresAt,
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'MFA_VALIDATED',
      target: user.id,
      details: { email: user.email },
      userId: user.id,
    },
  })

  res.json({
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
    },
  })
})

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (req.bootstrapUser) {
    return res.json({
      id: req.bootstrapUser.id,
      email: req.bootstrapUser.email,
      name: 'System Setup',
      role: req.bootstrapUser.role,
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mfaEnabled: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
    createdAt: user.createdAt.toISOString(),
    lastLogin: new Date().toISOString(),
  })
})

// PUT /api/auth/password
router.put('/password', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password required', 400)
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  const isValidPassword = await comparePassword(currentPassword, user.password)
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 401)
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from current password', 400)
  }

  const passwordValidation = validatePasswordStrength(newPassword)
  if (!passwordValidation.valid) {
    throw new AppError(`Weak password: ${passwordValidation.errors.join(', ')}`, 400)
  }

  const hashedPassword = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  })

  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      type: 'refresh',
    },
  })

  await prisma.auditLog.create({
    data: {
      action: 'PASSWORD_CHANGED',
      target: user.id,
      details: { email: user.email },
      userId: user.id,
    },
  })

  res.json({ message: 'Password changed successfully. Please login again.' })
})

export { router as authRouter }
