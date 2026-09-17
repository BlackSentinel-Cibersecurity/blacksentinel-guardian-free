import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Search, Shield, Terminal, Lock, Eye, User, Clock } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { api } from '@/services/api'
import type { AuditEntry } from '@/types'

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const response = await api.audit.list()
        setEntries(response.data)
      } catch {
        setEntries([])
      }
    }
    loadEntries()
  }, [])

  const filtered = entries.filter(e => {
    if (searchQuery && !e.action.includes(searchQuery) && !e.target.includes(searchQuery)) return false
    if (actionFilter !== 'all' && !e.action.startsWith(actionFilter)) return false
    return true
  })

  const getActionIcon = (action: string) => {
    if (action.includes('isolate') || action.includes('release')) return Lock
    if (action.includes('kill') || action.includes('remediate')) return Shield
    if (action.includes('script') || action.includes('scan')) return Terminal
    if (action.includes('usb') || action.includes('firewall')) return Eye
    return FileText
  }

  const getActionColor = (action: string) => {
    if (action.includes('isolate') || action.includes('kill') || action.includes('block')) return 'text-bs-red'
    if (action.includes('remediate') || action.includes('allow') || action.includes('release')) return 'text-bs-green'
    if (action.includes('update') || action.includes('add')) return 'text-bs-blue'
    return 'text-bs-gray-light'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bs-white">Audit Log</h1>
          <p className="text-sm text-bs-gray-mid mt-0.5">Immutable record of all administrative actions</p>
        </div>
        <div className="flex gap-2">
          <button className="bs-btn-secondary text-xs flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Export CSV</button>
          <button className="bs-btn-secondary text-xs flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Export JSON</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bs-card p-4">
          <div className="text-xl font-bold text-bs-white">{entries.length}</div>
          <div className="text-xs text-bs-gray-mid">Total Events</div>
        </div>
        <div className="bs-card p-4">
          <div className="text-xl font-bold text-bs-red">{entries.filter(e => e.action.includes('isolate') || e.action.includes('kill')).length}</div>
          <div className="text-xs text-bs-gray-mid">Critical Actions</div>
        </div>
        <div className="bs-card p-4">
          <div className="text-xl font-bold text-bs-green">{entries.filter(e => e.action.includes('remediate')).length}</div>
          <div className="text-xs text-bs-gray-mid">Remediations</div>
        </div>
        <div className="bs-card p-4">
          <div className="text-xl font-bold text-bs-blue">{entries.filter(e => e.action.includes('update')).length}</div>
          <div className="text-xs text-bs-gray-mid">Agent Updates</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bs-gray-mid" />
          <input type="text" placeholder="Search audit entries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bs-input pl-10" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="bs-input text-sm">
          <option value="all">All Actions</option>
          <option value="isolate">Isolation</option>
          <option value="kill">Process Kill</option>
          <option value="remediate">Remediation</option>
          <option value="update">Updates</option>
          <option value="block">Blocking</option>
          <option value="collect">Evidence</option>
        </select>
      </div>

      <div className="bs-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bs-border">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Timestamp</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Action</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Target</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">User</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => {
              const Icon = getActionIcon(entry.action)
              return (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-bs-gray-mid">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono">{entry.timestamp.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('w-4 h-4', getActionColor(entry.action))} />
                      <span className={cn('text-xs font-medium', getActionColor(entry.action))}>{entry.action.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-bs-white">{entry.target}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-bs-gray-mid" />
                      <span className="text-xs text-bs-gray-light">{entry.userName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-bs-gray-mid font-mono max-w-xs truncate">{JSON.stringify(entry.details)}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-bs-gray-mid">No audit entries found</div>
        )}
      </div>
    </div>
  )
}
