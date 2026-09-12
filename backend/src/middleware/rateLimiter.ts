import rateLimit from 'express-rate-limit'

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown'
  },
})

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later' },
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown'
  },
})

export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, account temporarily locked' },
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown'
  },
})
