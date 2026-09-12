import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

export interface AccessTokenPayload {
  id: string
  email: string
  role: string
}

export interface RefreshTokenPayload {
  id: string
  userId: string
}

function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/)
  if (!match) return 900
  const num = parseInt(match[1], 10)
  switch (match[2]) {
    case 's': return num
    case 'm': return num * 60
    case 'h': return num * 3600
    case 'd': return num * 86400
    default: return 900
  }
}

export function signAccessToken(user: { id: string; email: string; role: string }): string {
  const payload: AccessTokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  }
  return jwt.sign(payload, config.jwtSecret, { expiresIn: parseExpiresIn(config.jwtExpiresIn) })
}

export function signRefreshToken(userId: string, tokenId: string): string {
  const payload: RefreshTokenPayload = {
    id: tokenId,
    userId,
  }
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: parseExpiresIn(config.jwtRefreshExpiresIn) })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwtRefreshSecret) as RefreshTokenPayload
}

export function decodeToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.decode(token) as AccessTokenPayload
  } catch {
    return null
  }
}
