import 'dotenv/config'
import { randomBytes } from 'crypto'

// SECURITY FIX: both secrets used to fall back to values written in this file,
// so an install without JWT_SECRET accepted tokens anyone could sign. Without a
// real secret (32+ characters) the API now uses a random one per run; sessions
// end on restart. Run scripts/init-env.sh to keep them in .env.
function secret(name: string): string {
  const value = process.env[name]?.trim()
  if (value && value.length >= 32 && !/change|your[-_]|example|placeholder|fallback/i.test(value)) return value
  console.warn(`[SECURITY] ${name} is ${value ? 'too short or a placeholder' : 'not set'}; using a random secret for this run.`)
  return randomBytes(32).toString('hex')
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: secret('JWT_SECRET'),
  jwtRefreshSecret: secret('JWT_REFRESH_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  mfaIssuer: process.env.MFA_ISSUER || 'BlackSentinel Guardian',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  rateLimitWindow: 15 * 60 * 1000,
  rateLimitMax: 100,
  wsHeartbeatInterval: 30000,
  agentHeartbeatTimeout: 120000,
  maxConcurrentScans: 10,
  logLevel: process.env.LOG_LEVEL || 'info',
}
