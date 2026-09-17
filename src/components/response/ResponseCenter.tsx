import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Terminal, RefreshCw, Download, Search, Play, Trash2, Lock, Wifi, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { useEndpoints } from '@/hooks'

const responseActions = [
  { id: 'isolate', label: 'Isolate Endpoint', icon: Lock, description: 'Block all network except console communication', color: 'bg-bs-red/15 text-bs-red', danger: true },
  { id: 'kill', label: 'Kill Process', icon: XCircle, description: 'Terminate a running process by PID', color: 'bg-bs-orange/15 text-bs-orange', danger: true },
  { id: 'quarantine', label: 'Quarantine File', icon: Shield, description: 'Move file to isolated quarantine', color: 'bg-bs-yellow/15 text-bs-yellow', danger: false },
  { id: 'delete', label: 'Delete File', icon: Trash2, description: 'Permanently remove file from endpoint', color: 'bg-bs-red/15 text-bs-red', danger: true },
  { id: 'collect', label: 'Collect Evidence', icon: Download, description: 'Gather forensic artifacts', color: 'bg-bs-blue/15 text-bs-blue', danger: false },
  { id: 'script', label: 'Run Script', icon: Terminal, description: 'Execute custom script on endpoint', color: 'bg-purple-500/15 text-purple-400', danger: false },
  { id: 'update', label: 'Update Agent', icon: RefreshCw, description: 'Force agent update to latest version', color: 'bg-bs-green/15 text-bs-green', danger: false },
  { id: 'scan', label: 'Full Scan', icon: Search, description: 'Run comprehensive endpoint scan', color: 'bg-cyan-500/15 text-cyan-400', danger: false },
  { id: 'restore', label: 'Restore Changes', icon: RefreshCw, description: 'Undo recent file system changes', color: 'bg-bs-green/15 text-bs-green', danger: false },
  { id: 'blockhash', label: 'Block Hash', icon: Shield, description: 'Add file hash to global blocklist', color: 'bg-indigo-500/15 text-indigo-400', danger: false },
  { id: 'blockip', label: 'Block IP', icon: Wifi, description: 'Block IP address at all endpoints', color: 'bg-indigo-500/15 text-indigo-400', danger: false },
  { id: 'forensic', label: 'Forensic Package', icon: Download, description: 'Generate complete forensic image', color: 'bg-cyan-500/15 text-cyan-400', danger: false },
]

const recentActions = [
  { id: 1, action: 'Isolate Endpoint', target: 'WS-HR-004', status: 'completed', timestamp: '10m ago', initiatedBy: 'System (Auto)' },
  { id: 2, action: 'Quarantine File', target: 'invoice_march_2024.docm', status: 'completed', timestamp: '1h ago', initiatedBy: 'Alex Kumar' },
  { id: 3, action: 'Kill Process', target: 'procdump.exe (PID:9012)', status: 'pending', timestamp: '2m ago', initiatedBy: 'Alex Kumar' },
  { id: 4, action: 'Block IP', target: '198.51.100.42', status: 'completed', timestamp: '15m ago', initiatedBy: 'System (Auto)' },
  { id: 5, action: 'Full Scan', target: 'WS-CORP-001', status: 'running', timestamp: '5m ago', initiatedBy: 'Alex Kumar' },
]

export default function ResponseCenter() {
  const { endpoints } = useEndpoints()
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('')
  const [selectedAction, setSelectedAction] = useState<string>('')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bs-white">Response Center</h1>
        <p className="text-sm text-bs-gray-mid mt-0.5">Remote response actions and incident remediation</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">3</div><div className="text-xs text-bs-gray-mid">Completed</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-yellow/15 flex items-center justify-center"><Clock className="w-5 h-5 text-bs-yellow" /></div>
            <div><div className="text-xl font-bold text-bs-white">1</div><div className="text-xs text-bs-gray-mid">Pending</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center"><Play className="w-5 h-5 text-bs-blue" /></div>
            <div><div className="text-xl font-bold text-bs-white">1</div><div className="text-xs text-bs-gray-mid">Running</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-red/15 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-bs-red" /></div>
            <div><div className="text-xl font-bold text-bs-white">0</div><div className="text-xs text-bs-gray-mid">Failed</div></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-bs-white">Available Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {responseActions.map((action) => (
              <motion.div
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAction(action.id)}
                className={cn(
                  'bs-card p-4 cursor-pointer transition-all',
                  selectedAction === action.id && 'border-bs-orange glow-orange',
                  action.danger && 'border-l-2 border-l-bs-red/50'
                )}
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', action.color)}>
                  <action.icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs font-medium text-bs-white">{action.label}</p>
                <p className="text-[10px] text-bs-gray-mid mt-0.5">{action.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-bs-white">Execute Action</h3>
          <div className="bs-card p-4 space-y-3">
            <div>
              <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Target Endpoint</label>
              <select value={selectedEndpoint} onChange={(e) => setSelectedEndpoint(e.target.value)} className="bs-input text-sm w-full">
                <option value="">Select endpoint...</option>
                {endpoints.map(ep => <option key={ep.id} value={ep.id}>{ep.hostname} ({ep.ipAddress})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Action</label>
              <div className="text-sm text-bs-white">{selectedAction ? responseActions.find(a => a.id === selectedAction)?.label : 'No action selected'}</div>
            </div>
            <div>
              <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Parameters</label>
              <input type="text" placeholder="e.g., PID, file path, IP address..." className="bs-input text-sm w-full" />
            </div>
            <div>
              <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Justification</label>
              <textarea placeholder="Reason for this action..." className="bs-input text-sm w-full resize-none" rows={2} />
            </div>
            <button className="bs-btn-primary w-full text-sm">Execute Action</button>
            <p className="text-[10px] text-bs-gray-mid text-center">All actions are logged and auditable</p>
          </div>

          <h3 className="text-sm font-semibold text-bs-white mt-4">Recent Actions</h3>
          <div className="space-y-2">
            {recentActions.map((ra) => (
              <div key={ra.id} className="bs-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-bs-white">{ra.action}</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full',
                    ra.status === 'completed' ? 'bg-bs-green/10 text-bs-green' :
                    ra.status === 'running' ? 'bg-bs-blue/10 text-bs-blue' :
                    ra.status === 'pending' ? 'bg-bs-yellow/10 text-bs-yellow' :
                    'bg-bs-red/10 text-bs-red'
                  )}>{ra.status}</span>
                </div>
                <p className="text-[10px] text-bs-gray-mid">{ra.target}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-bs-gray-mid">{ra.initiatedBy}</span>
                  <span className="text-[10px] text-bs-gray-mid">{ra.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
