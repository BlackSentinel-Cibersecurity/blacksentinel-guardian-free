import 'dotenv/config'

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'blacksentinel-guardian-secret-key-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'blacksentinel-guardian-refresh-secret-key-change-in-production',
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
