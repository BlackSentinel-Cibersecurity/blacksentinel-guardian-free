import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Search, Filter, MoreVertical, Shield, Cpu, HardDrive, MemoryStick, Wifi, WifiOff, ArrowUpDown, ChevronDown, ExternalLink, Terminal, Plus } from 'lucide-react'
import { cn, formatNumber, formatBytes, getStatusColor } from '@/utils/helpers'
import { useEndpoints } from '@/hooks'
import type { Endpoint, OS } from '@/types'
import AddEndpointModal from './AddEndpointModal'

export default function EndpointInventory() {
  const { endpoints, loading, refresh } = useEndpoints()
  const [searchQuery, setSearchQuery] = useState('')
  const [osFilter, setOsFilter] = useState<OS | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null)
  const [sortField, setSortField] = useState<string>('riskScore')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredEndpoints = endpoints.filter(ep => {
    if (searchQuery && !ep.hostname.toLowerCase().includes(searchQuery.toLowerCase()) && !ep.ipAddress.includes(searchQuery)) return false
    if (osFilter !== 'all' && ep.os !== osFilter) return false
    if (statusFilter !== 'all' && ep.status !== statusFilter) return false
    return true
  }).sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sortField]
    const bVal = (b as unknown as Record<string, unknown>)[sortField]
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })

  const getOsIcon = (os: OS) => {
    switch (os) {
      case 'windows': return 'W'
      case 'linux': return 'L'
      case 'macos': return 'M'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bs-white">Endpoint Inventory</h1>
          <p className="text-sm text-bs-gray-mid mt-0.5">{endpoints.length} endpoints discovered and monitored</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bs-btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Endpoint
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center"><Monitor className="w-5 h-5 text-bs-blue" /></div>
            <div><div className="text-xl font-bold text-bs-white">{endpoints.length}</div><div className="text-xs text-bs-gray-mid">Total Endpoints</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><Wifi className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">{endpoints.filter(e => e.status === 'online').length}</div><div className="text-xs text-bs-gray-mid">Online</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-gray-mid/30 flex items-center justify-center"><WifiOff className="w-5 h-5 text-bs-gray-mid" /></div>
            <div><div className="text-xl font-bold text-bs-white">{endpoints.filter(e => e.status === 'offline').length}</div><div className="text-xs text-bs-gray-mid">Offline</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-orange/15 flex items-center justify-center"><Shield className="w-5 h-5 text-bs-orange" /></div>
            <div><div className="text-xl font-bold text-bs-white">{endpoints.filter(e => e.agentStatus === 'healthy').length}</div><div className="text-xs text-bs-gray-mid">Agent Healthy</div></div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bs-gray-mid" />
          <input
            type="text"
            placeholder="Search by hostname or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bs-input pl-10"
          />
        </div>
        <select
          value={osFilter}
          onChange={(e) => setOsFilter(e.target.value as OS | 'all')}
          className="bs-input text-sm cursor-pointer"
        >
          <option value="all">All OS</option>
          <option value="windows">Windows</option>
          <option value="linux">Linux</option>
          <option value="macos">macOS</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bs-input text-sm cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="isolated">Isolated</option>
        </select>
      </div>

      <div className="bs-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bs-border">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Endpoint</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">OS</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">IP Address</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Agent</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Risk</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Last Seen</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Location</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredEndpoints.map((ep, i) => (
              <motion.tr
                key={ep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors cursor-pointer',
                  selectedEndpoint?.id === ep.id && 'bg-bs-orange/5 border-l-2 border-l-bs-orange'
                )}
                onClick={() => setSelectedEndpoint(ep)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bs-gray-dark flex items-center justify-center text-sm">
                      {getOsIcon(ep.os)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-bs-white">{ep.hostname}</p>
                      <p className="text-[11px] text-bs-gray-mid">{ep.manufacturer} {ep.model}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-bs-gray-light capitalize">{ep.os}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-bs-gray-light">{ep.ipAddress}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-bs-gray-light">{ep.user}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', ep.status === 'online' ? 'bg-bs-green' : ep.status === 'offline' ? 'bg-bs-gray-mid' : 'bg-bs-yellow')} />
                    <span className={cn('text-xs capitalize', getStatusColor(ep.status))}>{ep.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs', ep.agentStatus === 'healthy' ? 'text-bs-green' : ep.agentStatus === 'updating' ? 'text-bs-yellow' : 'text-bs-red')}>
                    v{ep.agentVersion}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-bs-gray-dark rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', ep.riskScore > 50 ? 'bg-bs-red' : ep.riskScore > 25 ? 'bg-bs-yellow' : 'bg-bs-green')}
                        style={{ width: `${ep.riskScore}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-medium', ep.riskScore > 50 ? 'text-bs-red' : ep.riskScore > 25 ? 'text-bs-yellow' : 'text-bs-green')}>
                      {ep.riskScore}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-bs-gray-mid">{ep.lastSeen.toLocaleTimeString()}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-bs-gray-light">{ep.location}</span>
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 rounded hover:bg-bs-gray-dark transition-colors">
                    <MoreVertical className="w-4 h-4 text-bs-gray-mid" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEndpoint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bs-card-elevated p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-bs-gray-dark flex items-center justify-center text-xl">
                {getOsIcon(selectedEndpoint.os)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-bs-white">{selectedEndpoint.hostname}</h2>
                <p className="text-sm text-bs-gray-mid">{selectedEndpoint.ipAddress} · {selectedEndpoint.location}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="bs-btn-secondary text-xs">Isolate</button>
              <button className="bs-btn-primary text-xs">Response Actions</button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-bs-gray-dark/50">
              <div className="flex items-center gap-2 mb-1"><Cpu className="w-3.5 h-3.5 text-bs-blue" /><span className="text-[10px] text-bs-gray-mid uppercase">CPU</span></div>
              <p className="text-sm font-medium text-bs-white">{selectedEndpoint.cpu}</p>
            </div>
            <div className="p-3 rounded-lg bg-bs-gray-dark/50">
              <div className="flex items-center gap-2 mb-1"><MemoryStick className="w-3.5 h-3.5 text-bs-purple" /><span className="text-[10px] text-bs-gray-mid uppercase">RAM</span></div>
              <p className="text-sm font-medium text-bs-white">{formatBytes(selectedEndpoint.ram * 1024)}</p>
            </div>
            <div className="p-3 rounded-lg bg-bs-gray-dark/50">
              <div className="flex items-center gap-2 mb-1"><HardDrive className="w-3.5 h-3.5 text-bs-green" /><span className="text-[10px] text-bs-gray-mid uppercase">Disk</span></div>
              <p className="text-sm font-medium text-bs-white">{formatBytes(selectedEndpoint.diskUsed)} / {formatBytes(selectedEndpoint.diskTotal)}</p>
            </div>
            <div className="p-3 rounded-lg bg-bs-gray-dark/50">
              <div className="flex items-center gap-2 mb-1"><Shield className="w-3.5 h-3.5 text-bs-orange" /><span className="text-[10px] text-bs-gray-mid uppercase">Risk Score</span></div>
              <p className={cn('text-sm font-medium', selectedEndpoint.riskScore > 50 ? 'text-bs-red' : selectedEndpoint.riskScore > 25 ? 'text-bs-yellow' : 'text-bs-green')}>
                {selectedEndpoint.riskScore}/100
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-bs-gray-mid uppercase mb-3">Installed Software ({selectedEndpoint.installedSoftware.length})</h3>
              <div className="space-y-2">
                {selectedEndpoint.installedSoftware.map((sw, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-bs-gray-dark/30">
                    <div>
                      <p className="text-xs font-medium text-bs-white">{sw.name}</p>
                      <p className="text-[10px] text-bs-gray-mid">{sw.publisher}</p>
                    </div>
                    <span className="text-[10px] text-bs-gray-mid">v{sw.version}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-bs-gray-mid uppercase mb-3">Running Processes ({selectedEndpoint.processes.length})</h3>
              <div className="space-y-2">
                {selectedEndpoint.processes.map((proc, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-bs-gray-dark/30">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-bs-gray-mid" />
                      <div>
                        <p className="text-xs font-medium text-bs-white">{proc.name}</p>
                        <p className="text-[10px] text-bs-gray-mid">PID: {proc.pid}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-bs-gray-mid">CPU: {proc.cpu}%</p>
                      <p className="text-[10px] text-bs-gray-mid">MEM: {formatBytes(proc.memory)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <AddEndpointModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={refresh}
      />
    </div>
  )
}
