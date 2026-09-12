import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Monitor, Shield, AlertTriangle, Bug, Lock, Brain, Activity,
  TrendingUp, TrendingDown, Server, Users, Wifi, WifiOff,
  Zap, Eye, ShieldAlert, Clock, ArrowUpRight, ArrowDownRight,
  ChevronRight, MoreVertical, RefreshCw, Target
} from 'lucide-react'
import { cn, formatNumber } from '@/utils/helpers'
import { api } from '@/services/api'
import { useEndpoints, useThreats, useAlerts } from '@/hooks'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DashboardStats } from '@/types'

const threatTimeline = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  critical: Math.floor(Math.random() * 5),
  high: Math.floor(Math.random() * 10) + 2,
  medium: Math.floor(Math.random() * 15) + 5,
  low: Math.floor(Math.random() * 20) + 10,
}))

const eventDistribution = [
  { name: 'Process', value: 3421, color: '#FF6B00' },
  { name: 'Network', value: 5678, color: '#3B82F6' },
  { name: 'File', value: 2345, color: '#22C55E' },
  { name: 'Auth', value: 1234, color: '#FACC15' },
  { name: 'Registry', value: 890, color: '#EF4444' },
  { name: 'USB', value: 324, color: '#8B5CF6' },
]

const protectionTrend = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  blocked: Math.floor(Math.random() * 100) + 50,
  detected: Math.floor(Math.random() * 30) + 10,
  incidents: Math.floor(Math.random() * 5),
}))

const riskHistory = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  score: Math.max(20, Math.min(80, 65 + Math.floor(Math.random() * 20) - 10)),
}))

const StatCard = ({ icon: Icon, label, value, change, changeType, color, glowClass }: {
  icon: React.ElementType; label: string; value: string | number; change?: string; changeType?: 'up' | 'down'; color: string; glowClass?: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn('bs-card p-5 hover:border-bs-gray-mid transition-all group', glowClass)}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {change && (
        <div className={cn('flex items-center gap-0.5 text-xs font-medium', changeType === 'up' ? 'text-bs-red' : 'text-bs-green')}>
          {changeType === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {change}
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-bs-white mb-0.5">{value}</div>
    <div className="text-xs text-bs-gray-mid">{label}</div>
  </motion.div>
)

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { endpoints: endpointsData } = useEndpoints()
  const { threats: threatsData } = useThreats()
  const { alerts: alertsData } = useAlerts()

  useEffect(() => {
    api.dashboard.getStats().then(data => {
      setStats(data)
      setLoading(false)
    }).catch(() => setLoading(false))
    const unsub = api.on('endpoint:heartbeat', () => {
      api.dashboard.getStats().then(data => setStats(data))
    })
    return unsub
  }, [])

  const s = stats || {
    totalEndpoints: 0, onlineEndpoints: 0, offlineEndpoints: 0, totalThreats: 0,
    activeThreats: 0, criticalThreats: 0, blockedToday: 0, ransomwareStopped: 0,
    riskScore: 0, protectedAssets: 0, protectedUsers: 0, eventsLast24h: 0,
    blockedConnections: 0, vulnerabilitiesFound: 0, criticalVulns: 0,
    aiEngineStatus: 'idle', agentIntegrity: 0, anomalyScore: 0
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bs-white">Security Dashboard</h1>
          <p className="text-sm text-bs-gray-mid mt-0.5">Real-time overview of your security posture</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => api.dashboard.getStats().then(data => setStats(data))} className="bs-btn-secondary flex items-center gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bs-gray-dark border border-bs-border">
            <Clock className="w-3.5 h-3.5 text-bs-gray-mid" />
            <span className="text-xs text-bs-gray-light">Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Monitor} label="Total Endpoints" value={s.totalEndpoints || 8} change={`${s.onlineEndpoints || 7} online`} changeType="down" color="bg-bs-blue" />
        <StatCard icon={Shield} label="Risk Score" value={s.riskScore || 67} change="+5 today" changeType="up" color="bg-bs-orange" glowClass="glow-orange" />
        <StatCard icon={AlertTriangle} label="Active Threats" value={s.activeThreats || 5} change={`${s.criticalThreats || 2} critical`} changeType="up" color="bg-bs-red" glowClass="glow-red" />
        <StatCard icon={Zap} label="Blocked Today" value={s.blockedToday || 47} change="-12% vs avg" changeType="down" color="bg-bs-green" glowClass="glow-green" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Lock} label="Ransomware Stopped" value={s.ransomwareStopped || 3} color="bg-purple-600" />
        <StatCard icon={Eye} label="Anomaly Score" value={s.anomalyScore || 72} change="+3" changeType="up" color="bg-bs-yellow" />
        <StatCard icon={Brain} label="AI Engine" value="Active" color="bg-gradient-to-br from-bs-orange to-bs-orange-bright" />
        <StatCard icon={ShieldAlert} label="Vulnerabilities" value={s.vulnerabilitiesFound || 8} change={`${s.criticalVulns || 4} critical`} changeType="up" color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bs-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-bs-white">Threat Activity (24h)</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-bs-red" /><span className="text-[10px] text-bs-gray-mid">Critical</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-bs-orange-alert" /><span className="text-[10px] text-bs-gray-mid">High</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-bs-yellow" /><span className="text-[10px] text-bs-gray-mid">Medium</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-bs-blue" /><span className="text-[10px] text-bs-gray-mid">Low</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={threatTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232323" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#3C3C3C' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#3C3C3C' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="low" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="medium" stackId="1" stroke="#FACC15" fill="#FACC15" fillOpacity={0.3} />
              <Area type="monotone" dataKey="high" stackId="1" stroke="#FF5500" fill="#FF5500" fillOpacity={0.3} />
              <Area type="monotone" dataKey="critical" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bs-card p-5">
          <h3 className="text-sm font-semibold text-bs-white mb-4">Event Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={eventDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {eventDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {eventDistribution.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] text-bs-gray-mid">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bs-card p-5">
          <h3 className="text-sm font-semibold text-bs-white mb-4">Weekly Protection Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={protectionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232323" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#3C3C3C' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#3C3C3C' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="blocked" fill="#FF6B00" radius={[3, 3, 0, 0]} />
              <Bar dataKey="detected" fill="#3B82F6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bs-card p-5">
          <h3 className="text-sm font-semibold text-bs-white mb-4">Risk Score Trend (30d)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={riskHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232323" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#3C3C3C' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#3C3C3C' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1C1C1C', border: '1px solid #333', borderRadius: '8px', fontSize: '11px' }} />
              <Line type="monotone" dataKey="score" stroke="#FF6B00" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bs-card p-5">
          <h3 className="text-sm font-semibold text-bs-white mb-4">Endpoint Status</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-xs text-bs-gray-mid text-center py-4">Loading endpoints...</div>
            ) : endpointsData.length === 0 ? (
              <div className="text-xs text-bs-gray-mid text-center py-4">No endpoints available</div>
            ) : (
              endpointsData.slice(0, 5).map((ep) => (
              <div key={ep.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-bs-gray-dark/50 transition-colors cursor-pointer">
                <div className={cn('w-2 h-2 rounded-full', ep.status === 'online' ? 'bg-bs-green' : ep.status === 'offline' ? 'bg-bs-gray-mid' : 'bg-bs-yellow')} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-bs-white truncate">{ep.hostname}</p>
                  <p className="text-[10px] text-bs-gray-mid">{ep.os} · {ep.ipAddress}</p>
                </div>
                <div className={cn('text-xs font-medium', ep.riskScore > 50 ? 'text-bs-red' : ep.riskScore > 25 ? 'text-bs-yellow' : 'text-bs-green')}>
                  {ep.riskScore}
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bs-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-bs-white">Active Threats</h3>
            <span className="bs-badge-danger">{threatsData.filter(t => t.status === 'active').length} active</span>
          </div>
          <div className="space-y-2">
            {threatsData.filter(t => t.status === 'active').slice(0, 5).map((threat) => (
              <div key={threat.id} className="flex items-center gap-3 p-3 rounded-lg bg-bs-gray-dark/50 border border-bs-border/50 hover:border-bs-gray-mid transition-colors cursor-pointer">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  threat.severity === 'critical' ? 'bg-bs-red/15' : 'bg-bs-orange/15'
                )}>
                  <Bug className={cn('w-4 h-4', threat.severity === 'critical' ? 'text-bs-red' : 'text-bs-orange')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-bs-white truncate">{threat.name}</p>
                  <p className="text-[10px] text-bs-gray-mid">{threat.endpointName} · {threat.detectedAt.toLocaleTimeString()}</p>
                </div>
                <span className={cn('bs-badge', threat.severity === 'critical' ? 'bs-badge-danger' : 'bs-badge-orange')}>
                  {threat.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bs-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-bs-white">Recent Alerts</h3>
            <button className="text-xs text-bs-orange hover:text-bs-orange-bright transition-colors">View all</button>
          </div>
          <div className="space-y-2">
            {alertsData.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-bs-gray-dark/50 border border-bs-border/50 hover:border-bs-gray-mid transition-colors cursor-pointer">
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  alert.severity === 'critical' ? 'bg-bs-red animate-pulse' :
                  alert.severity === 'high' ? 'bg-bs-orange-alert' :
                  alert.severity === 'medium' ? 'bg-bs-yellow' : 'bg-bs-blue'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-bs-white truncate">{alert.title}</p>
                  <p className="text-[10px] text-bs-gray-mid">{alert.source} · {alert.timestamp.toLocaleTimeString()}</p>
                </div>
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full',
                  alert.status === 'new' ? 'bg-bs-red/10 text-bs-red' :
                  alert.status === 'acknowledged' ? 'bg-bs-yellow/10 text-bs-yellow' :
                  'bg-bs-green/10 text-bs-green'
                )}>
                  {alert.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
