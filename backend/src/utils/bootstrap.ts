import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { BOOTSTRAP_CREDENTIALS, BOOTSTRAP_CONFIG } from '../config/bootstrap.js'

const BOOTSTRAP_JWT_SECRET = 'blacksentinel-bootstrap-secret-do-not-use-in-production'
const BOOTSTRAP_TOKEN_EXPIRY = '1h'

export interface BootstrapTokenPayload {
  id: string
  email: string
  role: string
  bootstrap: true
}

export async function checkDatabaseConnection(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export async function checkUsersExist(prisma: PrismaClient): Promise<boolean> {
  try {
    const count = await prisma.user.count()
    return count > 0
  } catch {
    return false
  }
}

export function isBootstrapMode(): boolean {
  return BOOTSTRAP_CONFIG.enabled
}

export function validateBootstrapCredentials(email: string, password: string): boolean {
  return (
    email === BOOTSTRAP_CREDENTIALS.email &&
    password === BOOTSTRAP_CREDENTIALS.password
  )
}

export function generateBootstrapToken(): string {
  const payload: BootstrapTokenPayload = {
    id: 'bootstrap-user',
    email: BOOTSTRAP_CREDENTIALS.email,
    role: BOOTSTRAP_CREDENTIALS.role,
    bootstrap: true,
  }
  return jwt.sign(payload, BOOTSTRAP_JWT_SECRET, { expiresIn: BOOTSTRAP_TOKEN_EXPIRY })
}

export function verifyBootstrapToken(token: string): BootstrapTokenPayload | null {
  try {
    const decoded = jwt.verify(token, BOOTSTRAP_JWT_SECRET) as BootstrapTokenPayload
    if (decoded.bootstrap === true) {
      return decoded
    }
    return null
  } catch {
    return null
  }
}

export function disableBootstrapMode(): void {
  BOOTSTRAP_CONFIG.enabled = false
  BOOTSTRAP_CONFIG.checkedAt = new Date()
}

export function enableBootstrapMode(): void {
  BOOTSTRAP_CONFIG.enabled = true
  BOOTSTRAP_CONFIG.checkedAt = new Date()
}
