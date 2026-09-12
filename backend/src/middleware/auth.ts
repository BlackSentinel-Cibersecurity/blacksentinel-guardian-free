import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt.js'
import { verifyBootstrapToken, BootstrapTokenPayload } from '../utils/bootstrap.js'

export interface AuthRequest extends Request {
  user?: AccessTokenPayload
  bootstrapUser?: BootstrapTokenPayload
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' })
  }

  const token = authHeader.split(' ')[1]

  const bootstrapPayload = verifyBootstrapToken(token)
  if (bootstrapPayload) {
    req.bootstrapUser = bootstrapPayload
    req.user = {
      id: bootstrapPayload.id,
      email: bootstrapPayload.email,
      role: bootstrapPayload.role,
    }
    return next()
  }

  try {
    const decoded = verifyAccessToken(token)
    req.user = decoded
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]

  const bootstrapPayload = verifyBootstrapToken(token)
  if (bootstrapPayload) {
    req.bootstrapUser = bootstrapPayload
    req.user = {
      id: bootstrapPayload.id,
      email: bootstrapPayload.email,
      role: bootstrapPayload.role,
    }
    return next()
  }

  try {
    const decoded = verifyAccessToken(token)
    req.user = decoded
  } catch {
    // Ignore invalid token for optional auth
  }
  next()
}
