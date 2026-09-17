import { Lock } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { useEndpoints } from '@/hooks'

export default function DeviceIsolation() {
  const { endpoints } = useEndpoints()
  const isolatable = endpoints.filter(ep => ep.status === 'online')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bs-white">Device Isolation</h1>
        <p className="text-sm text-bs-gray-mid mt-0.5">Network quarantine and isolation management</p>
      </div>

      <div className="bs-card-elevated p-6 glow-orange">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-bs-orange to-bs-orange-bright flex items-center justify-center">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-bs-white">Quick Isolation</h2>
            <p className="text-sm text-bs-gray-mid">Select an endpoint to instantly isolate from the network</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Target Endpoint</label>
            <select className="bs-input text-sm w-full">
              <option value="">Select endpoint...</option>
              {isolatable.map(ep => (
                <option key={ep.id} value={ep.id}>{ep.hostname} ({ep.ipAddress})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Isolation Mode</label>
            <select className="bs-input text-sm w-full">
              <option>Full Isolation (Console only)</option>
              <option>Selective (Allow management traffic)</option>
              <option>Monitoring Only (Passive)</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-[10px] text-bs-gray-mid uppercase mb-1 block">Reason</label>
          <input type="text" placeholder="e.g., Active ransomware detected..." className="bs-input text-sm w-full" />
        </div>
        <div className="mt-4 flex gap-2">
          <button className="bs-btn-danger flex items-center gap-2"><Lock className="w-4 h-4" /> Isolate Now</button>
          <button className="bs-btn-secondary">Schedule Isolation</button>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-bs-white">Endpoint Isolation Status</h3>
      <div className="bs-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bs-border">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Endpoint</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Network Access</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Console Access</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Duration</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map(ep => (
              <tr key={ep.id} className="border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', ep.status === 'online' ? 'bg-bs-green' : ep.status === 'offline' ? 'bg-bs-gray-mid' : 'bg-bs-yellow')} />
                    <span className="text-xs text-bs-white">{ep.hostname}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={cn('bs-badge text-[10px]', ep.status === 'isolated' ? 'bs-badge-warning' : 'bs-badge-success')}>{ep.status}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-bs-green">Full Access</span></td>
                <td className="px-4 py-3"><span className="text-xs text-bs-green">Connected</span></td>
                <td className="px-4 py-3"><span className="text-xs text-bs-gray-mid">—</span></td>
                <td className="px-4 py-3">
                  <button className="bs-btn-secondary text-[10px] py-1 px-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Isolate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
