import { Router, Response } from 'express'
import { PrismaClient, Severity } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticateToken)

// GET /api/dashboard/stats - aggregate statistics
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalEndpoints,
    onlineEndpoints,
    offlineEndpoints,
    totalThreats,
    activeThreats,
    criticalThreats,
    totalAlerts,
    newAlerts,
    criticalAlerts,
    totalVulnerabilities,
    criticalVulns,
    highVulns,
    totalFirewallRules,
    blockedFirewallRules,
    totalUsbDevices,
    blockedUsbDevices,
    eventsLast24h,
  ] = await Promise.all([
    prisma.endpoint.count(),
    prisma.endpoint.count({ where: { status: 'ONLINE' } }),
    prisma.endpoint.count({ where: { status: 'OFFLINE' } }),
    prisma.threat.count(),
    prisma.threat.count({ where: { status: 'ACTIVE' } }),
    prisma.threat.count({ where: { severity: 'CRITICAL', status: { notIn: ['RESOLVED', 'FALSE_POSITIVE'] } } }),
    prisma.alert.count(),
    prisma.alert.count({ where: { status: 'NEW' } }),
    prisma.alert.count({ where: { severity: 'CRITICAL', status: { notIn: ['RESOLVED'] } } }),
    prisma.vulnerability.count(),
    prisma.vulnerability.count({ where: { severity: 'CRITICAL' } }),
    prisma.vulnerability.count({ where: { severity: 'HIGH' } }),
    prisma.firewallRule.count(),
    prisma.firewallRule.count({ where: { action: 'deny', enabled: true } }),
    prisma.uSBDevice.count(),
    prisma.uSBDevice.count({ where: { status: 'BLOCKED' } }),
    prisma.timelineEvent.count({ where: { timestamp: { gte: twentyFourHoursAgo } } }),
  ])

  const avgRiskScore = await prisma.endpoint.aggregate({ _avg: { riskScore: true } })

  res.json({
    endpoints: {
      total: totalEndpoints,
      online: onlineEndpoints,
      offline: offlineEndpoints,
      maintenance: totalEndpoints - onlineEndpoints - offlineEndpoints,
    },
    threats: {
      total: totalThreats,
      active: activeThreats,
      critical: criticalThreats,
    },
    alerts: {
      total: totalAlerts,
      new: newAlerts,
      critical: criticalAlerts,
    },
    vulnerabilities: {
      total: totalVulnerabilities,
      critical: criticalVulns,
      high: highVulns,
    },
    firewall: {
      totalRules: totalFirewallRules,
      blockedRules: blockedFirewallRules,
    },
    usb: {
      totalDevices: totalUsbDevices,
      blockedDevices: blockedUsbDevices,
    },
    eventsLast24h,
    riskScore: Math.round(avgRiskScore._avg.riskScore || 0),
  })
})

// GET /api/dashboard/threats-by-severity - chart data
router.get('/threats-by-severity', async (_req: AuthRequest, res: Response) => {
  const severities: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

  const data = await Promise.all(
    severities.map(async (severity) => ({
      severity,
      count: await prisma.threat.count({ where: { severity } }),
      active: await prisma.threat.count({
        where: { severity, status: { notIn: ['RESOLVED', 'FALSE_POSITIVE'] } },
      }),
    }))
  )

  res.json({ data })
})

// GET /api/dashboard/endpoints-by-os - chart data
router.get('/endpoints-by-os', async (_req: AuthRequest, res: Response) => {
  const results = await prisma.endpoint.groupBy({
    by: ['os'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  const data = results.map((r) => ({
    os: r.os,
    count: r._count.id,
  }))

  res.json({ data })
})

// GET /api/dashboard/alerts-timeline - chart data
router.get('/alerts-timeline', async (req: AuthRequest, res: Response) => {
  const period = (req.query.period as string) || '7d'

  let startDate: Date
  const now = new Date()

  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  const alerts = await prisma.alert.findMany({
    where: { timestamp: { gte: startDate } },
    select: { timestamp: true, severity: true, status: true },
    orderBy: { timestamp: 'asc' },
  })

  const severityCounts: Record<string, number> = {}
  const hourlyData: Record<string, Record<string, number>> = {}

  for (const alert of alerts) {
    const hour = alert.timestamp.toISOString().slice(0, 13) + ':00:00Z'
    severityCounts[alert.severity] = (severityCounts[alert.severity] || 0) + 1
    if (!hourlyData[hour]) {
      hourlyData[hour] = {}
    }
    hourlyData[hour][alert.severity] = (hourlyData[hour][alert.severity] || 0) + 1
  }

  res.json({
    period,
    summary: severityCounts,
    timeline: Object.entries(hourlyData).map(([hour, severities]) => ({
      timestamp: hour,
      ...severities,
    })),
  })
})

export { router as dashboardRouter }
