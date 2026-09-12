import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { PrismaClient } from '@prisma/client'
import { config } from './config/index.js'
import { BOOTSTRAP_CONFIG } from './config/bootstrap.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { endpointsRouter } from './routes/endpoints.js'
import { threatsRouter } from './routes/threats.js'
import { alertsRouter } from './routes/alerts.js'
import { timelineRouter } from './routes/timeline.js'
import { vulnerabilitiesRouter } from './routes/vulnerabilities.js'
import { firewallRouter } from './routes/firewall.js'
import { usbRouter } from './routes/usb.js'
import { responseRouter } from './routes/response.js'
import { auditRouter } from './routes/audit.js'
import { dashboardRouter } from './routes/dashboard.js'
import { settingsRouter } from './routes/settings.js'
import { integrationsRouter } from './routes/integrations.js'
import { default as scriptsRouter } from './routes/scripts.js'
import { default as behavioralRouter } from './routes/behavioral.js'
import { default as registrationsRouter } from './routes/registrations.js'
// Free edition: the AI copilot, threat hunting, deception, and memory
// forensics modules are paid-plan only — their route files, and the
// frontend components that call them, are not included in this repo at
// all (not just disabled behind a flag). See the full product for those.
import { authenticateToken } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'
import { rateLimiter } from './middleware/rateLimiter.js'
import { enableBootstrapMode, disableBootstrapMode } from './utils/bootstrap.js'

const app = express()
const server = createServer(app)
const prisma = new PrismaClient()

// Middleware
app.use(helmet())
app.use(compression())
app.use(morgan('combined'))
app.use(cors({ origin: config.corsOrigins, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(rateLimiter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime() })
})

// Public routes (bootstrap status must be accessible without auth)
app.use('/api/auth', authRouter)

// Protected routes
app.use('/api/users', authenticateToken, usersRouter)
app.use('/api/endpoints', authenticateToken, endpointsRouter)
app.use('/api/threats', authenticateToken, threatsRouter)
app.use('/api/alerts', authenticateToken, alertsRouter)
app.use('/api/timeline', authenticateToken, timelineRouter)
app.use('/api/vulnerabilities', authenticateToken, vulnerabilitiesRouter)
app.use('/api/firewall', authenticateToken, firewallRouter)
app.use('/api/usb', authenticateToken, usbRouter)
app.use('/api/response', authenticateToken, responseRouter)
app.use('/api/audit', authenticateToken, auditRouter)
app.use('/api/dashboard', authenticateToken, dashboardRouter)
app.use('/api/settings', authenticateToken, settingsRouter)
app.use('/api/integrations', authenticateToken, integrationsRouter)
app.use('/api/scripts', authenticateToken, scriptsRouter)
app.use('/api/behavioral', authenticateToken, behavioralRouter)
app.use('/api/registrations', authenticateToken, registrationsRouter)

// Error handler
app.use(errorHandler)

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' })

const clients = new Map<string, WebSocket>()

wss.on('connection', (ws, req) => {
  const clientId = new URL(req.url || '', `http://${req.headers.host}`).searchParams.get('client_id') || 'unknown'
  clients.set(clientId, ws)

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      handleMessage(clientId, message)
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
    }
  })

  ws.on('close', () => {
    clients.delete(clientId)
  })

  ws.send(JSON.stringify({ type: 'connected', clientId }))
})

function handleMessage(clientId: string, message: { type: string; data?: unknown }) {
  switch (message.type) {
    case 'subscribe':
      break
    case 'unsubscribe':
      break
    case 'ping':
      broadcast({ type: 'pong', timestamp: Date.now() })
      break
  }
}

export function broadcast(message: unknown) {
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  })
}

export function sendToClient(clientId: string, message: unknown) {
  const ws = clients.get(clientId)
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}

// Simulate real-time events
setInterval(() => {
  const events = [
    { type: 'endpoint:heartbeat', data: { timestamp: new Date().toISOString() } },
    { type: 'metrics:update', data: { cpu: Math.random() * 100, memory: Math.random() * 100 } },
  ]
  const event = events[Math.floor(Math.random() * events.length)]
  broadcast(event)
}, 10000)

// Bootstrap mode check on startup
async function checkBootstrapMode() {
  try {
    await prisma.$queryRaw`SELECT 1`
    const count = await prisma.user.count()
    if (count === 0) {
      enableBootstrapMode()
      console.log('[BOOTSTRAP] Database connected but no users found. Bootstrap mode ENABLED.')
      console.log('[BOOTSTRAP] Default credentials: setup@blacksentinel.io / Guardian$etup2024!')
    } else {
      disableBootstrapMode()
      console.log(`[BOOTSTRAP] Database connected with ${count} user(s). Bootstrap mode DISABLED.`)
    }
  } catch (err) {
    enableBootstrapMode()
    console.log('[BOOTSTRAP] Database not reachable. Bootstrap mode ENABLED.')
    console.log('[BOOTSTRAP] Default credentials: setup@blacksentinel.io / Guardian$etup2024!')
  }
}

async function start() {
  await checkBootstrapMode()

  server.listen(config.port, () => {
    console.log(`BlackSentinel Guardian API running on port ${config.port}`)
    console.log(`WebSocket server running on ws://localhost:${config.port}/ws`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export default app
