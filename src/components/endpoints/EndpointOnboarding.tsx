import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Monitor, Search, Trash2, Copy, Clock, Wifi,
  Package, Plus, RefreshCw, Loader2, Inbox, X
} from 'lucide-react'
import { cn, timeAgo } from '@/utils/helpers'
import { api } from '@/services/api'
import { useRegistrations, useToast } from '@/hooks'
import type { RegistrationStatus } from '@/types'
import AddEndpointModal from './AddEndpointModal'
import AgentInstaller from './AgentInstaller'

const statusConfig: Record<RegistrationStatus, { label: string; color: string; dot: string; badge: string }> = {
  pending_registration: {
    label: 'Pending Registration',
    color: 'text-bs-yellow',
    dot: 'bg-bs-yellow',
    badge: 'bs-badge-warning',
  },
  agent_installed: {
    label: 'Agent Installed',
    color: 'text-bs-blue',
    dot: 'bg-bs-blue',
    badge: 'bs-badge-info',
  },
  online: {
    label: 'Online',
    color: 'text-bs-green',
    dot: 'bg-bs-green',
    badge: 'bs-badge-success',
  },
  offline: {
    label: 'Offline',
    color: 'text-bs-gray-mid',
    dot: 'bg-bs-gray-mid',
    badge: 'bs-badge',
  },
}

export default function EndpointOnboarding() {
  const { registrations, loading, refresh } = useRegistrations()
  const { addToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedInstallerId, setExpandedInstallerId] = useState<string | null>(null)

  const filteredRegistrations = registrations.filter((reg) => {
    if (searchQuery && !reg.hostname.toLowerCase().includes(searchQuery.toLowerCase()) && !reg.ipAddress.includes(searchQuery)) return false
    if (statusFilter !== 'all' && reg.status !== statusFilter) return false
    return true
  })

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.registrations.delete(id)
      addToast('Registration deleted', 'success')
      refresh()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete registration', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const getOsIcon = (os: string) => {
    switch (os) {
      case 'windows': return 'W'
      case 'linux': return 'L'
      case 'macos': return 'M'
      default: return '?'
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === 'pending_registration').length,
    installed: registrations.filter((r) => r.status === 'agent_installed').length,
    online: registrations.filter((r) => r.status === 'online').length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bs-white">Endpoint Onboarding</h1>
          <p className="text-sm text-bs-gray-mid mt-0.5">
            Register and deploy agents to new endpoints
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="bs-btn-secondary text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bs-btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Endpoint
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-orange/15 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-bs-orange" />
            </div>
            <div>
              <div className="text-xl font-bold text-bs-white">{stats.total}</div>
              <div className="text-xs text-bs-gray-mid">Total Registered</div>
            </div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-yellow/15 flex items-center justify-center">
              <Clock className="w-5 h-5 text-bs-yellow" />
            </div>
            <div>
              <div className="text-xl font-bold text-bs-white">{stats.pending}</div>
              <div className="text-xs text-bs-gray-mid">Pending</div>
            </div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center">
              <Package className="w-5 h-5 text-bs-blue" />
            </div>
            <div>
              <div className="text-xl font-bold text-bs-white">{stats.installed}</div>
              <div className="text-xs text-bs-gray-mid">Agent Installed</div>
            </div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-bs-green" />
            </div>
            <div>
              <div className="text-xl font-bold text-bs-white">{stats.online}</div>
              <div className="text-xs text-bs-gray-mid">Online</div>
            </div>
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
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | 'all')}
          className="bs-input text-sm cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="pending_registration">Pending Registration</option>
          <option value="agent_installed">Agent Installed</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      <div className="bs-card overflow-hidden">
        {loading && registrations.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-bs-gray-mid animate-spin" />
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-14 h-14 rounded-2xl bg-bs-gray-dark flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-bs-gray-mid" />
            </div>
            <h3 className="text-sm font-medium text-bs-white mb-1">No registrations found</h3>
            <p className="text-xs text-bs-gray-mid text-center max-w-sm mb-4">
              {registrations.length === 0
                ? 'Register your first endpoint to get started with agent deployment.'
                : 'No registrations match your current filters. Try adjusting your search.'}
            </p>
            {registrations.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bs-btn-primary text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Register Endpoint
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-bs-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Endpoint</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">OS</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">IP Address</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Registered</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Last Heartbeat</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Department</th>
                <th className="w-[140px] px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg, i) => {
                const status = statusConfig[reg.status]
                return (
                  <motion.tr
                    key={reg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-bs-gray-dark flex items-center justify-center text-sm">
                          {getOsIcon(reg.os)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-bs-white">{reg.hostname}</p>
                          <p className="text-[11px] text-bs-gray-mid">{reg.location || 'No location'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-bs-gray-light capitalize">{reg.os}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-bs-gray-light">{reg.ipAddress}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', status.dot)} />
                        <span className={cn('text-xs', status.color)}>{status.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-bs-gray-mid">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-bs-gray-mid">
                        {reg.lastHeartbeat ? timeAgo(new Date(reg.lastHeartbeat)) : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-bs-gray-light">{reg.department || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setExpandedInstallerId(expandedInstallerId === reg.id ? null : reg.id)
                          }
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            expandedInstallerId === reg.id
                              ? 'bg-bs-orange/15 text-bs-orange'
                              : 'hover:bg-bs-gray-dark text-bs-gray-mid hover:text-bs-white'
                          )}
                          title="View install command"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(reg.id)}
                          disabled={deletingId === reg.id}
                          className="p-1.5 rounded-lg hover:bg-bs-red/15 text-bs-gray-mid hover:text-bs-red transition-colors disabled:opacity-50"
                          title="Delete registration"
                        >
                          {deletingId === reg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {expandedInstallerId && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bs-card-elevated p-5 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-bs-white">
              Install Command — {registrations.find((r) => r.id === expandedInstallerId)?.hostname}
            </h3>
            <button
              onClick={() => setExpandedInstallerId(null)}
              className="p-1.5 rounded-lg hover:bg-bs-gray-dark text-bs-gray-mid hover:text-bs-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {(() => {
            const reg = registrations.find((r) => r.id === expandedInstallerId)
            if (!reg) return null
            return <AgentInstaller registrationToken={reg.registrationToken} os={reg.os} />
          })()}
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
