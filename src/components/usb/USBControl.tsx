import { useState } from 'react'
import { motion } from 'framer-motion'
import { Usb, Shield, ShieldOff, AlertTriangle, CheckCircle, Clock, Settings, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { useUSBDevices } from '@/hooks'

export default function USBControl() {
  const { devices: usbDevices } = useUSBDevices()
  const [policyFilter, setPolicyFilter] = useState<'all' | 'allowed' | 'blocked' | 'pending'>('all')

  const filtered = usbDevices.filter(d => policyFilter === 'all' || d.status === policyFilter)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bs-white">USB Control</h1>
          <p className="text-sm text-bs-gray-mid mt-0.5">Device allowlisting, blocklisting, and policy enforcement</p>
        </div>
        <button className="bs-btn-primary text-xs flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Add Policy</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center"><Usb className="w-5 h-5 text-bs-blue" /></div>
            <div><div className="text-xl font-bold text-bs-white">{usbDevices.length}</div><div className="text-xs text-bs-gray-mid">Total Devices</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><Shield className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">{usbDevices.filter(d => d.status === 'allowed').length}</div><div className="text-xs text-bs-gray-mid">Allowed</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-red/15 flex items-center justify-center"><ShieldOff className="w-5 h-5 text-bs-red" /></div>
            <div><div className="text-xl font-bold text-bs-white">{usbDevices.filter(d => d.status === 'blocked').length}</div><div className="text-xs text-bs-gray-mid">Blocked</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-yellow/15 flex items-center justify-center"><Clock className="w-5 h-5 text-bs-yellow" /></div>
            <div><div className="text-xl font-bold text-bs-white">{usbDevices.filter(d => d.status === 'pending').length}</div><div className="text-xs text-bs-gray-mid">Pending Review</div></div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'allowed', 'blocked', 'pending'] as const).map(s => (
          <button key={s} onClick={() => setPolicyFilter(s)} className={cn('bs-btn-secondary text-xs capitalize', policyFilter === s && 'bg-bs-orange/10 text-bs-orange border-bs-orange/30')}>{s}</button>
        ))}
      </div>

      <div className="bs-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bs-border">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Device</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Type</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Endpoint</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Vendor ID</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Serial</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Last Seen</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((device) => (
              <tr key={device.id} className="border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Usb className="w-4 h-4 text-bs-gray-mid" />
                    <span className="text-xs text-bs-white">{device.deviceName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-bs-gray-light">{device.deviceType}</td>
                <td className="px-4 py-3 text-xs text-bs-gray-light">{device.endpointName}</td>
                <td className="px-4 py-3 text-xs text-bs-gray-mid font-mono">{device.vendorId}:{device.productId}</td>
                <td className="px-4 py-3 text-xs text-bs-gray-mid font-mono">{device.serialNumber}</td>
                <td className="px-4 py-3">
                  <span className={cn('bs-badge text-[10px]',
                    device.status === 'allowed' ? 'bs-badge-success' :
                    device.status === 'blocked' ? 'bs-badge-danger' : 'bs-badge-warning'
                  )}>{device.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-bs-gray-mid">{device.lastSeen.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button className="p-1 rounded hover:bg-bs-gray-dark transition-colors"><Settings className="w-4 h-4 text-bs-gray-mid" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
