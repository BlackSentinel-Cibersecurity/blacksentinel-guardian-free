import { useState } from 'react'
import { motion } from 'framer-motion'
import { Network, Shield, ShieldOff, Plus, Trash2, Edit, ToggleLeft, ToggleRight, Globe, Lock } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { useFirewallRules, useEndpoints } from '@/hooks'

export default function FirewallManagement() {
  const { rules: firewallRules } = useFirewallRules()
  const { endpoints } = useEndpoints()
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all')

  const filtered = firewallRules.filter(r => directionFilter === 'all' || r.direction === directionFilter)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bs-white">Firewall Management</h1>
          <p className="text-sm text-bs-gray-mid mt-0.5">Rule management, traffic visualization, and policy enforcement</p>
        </div>
        <button className="bs-btn-primary text-xs flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Add Rule</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center"><Network className="w-5 h-5 text-bs-blue" /></div>
            <div><div className="text-xl font-bold text-bs-white">{firewallRules.length}</div><div className="text-xs text-bs-gray-mid">Total Rules</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><Shield className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">{firewallRules.filter(r => r.action === 'allow').length}</div><div className="text-xs text-bs-gray-mid">Allow Rules</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-red/15 flex items-center justify-center"><ShieldOff className="w-5 h-5 text-bs-red" /></div>
            <div><div className="text-xl font-bold text-bs-white">{firewallRules.filter(r => r.action === 'block').length}</div><div className="text-xs text-bs-gray-mid">Block Rules</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><ToggleRight className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">{firewallRules.filter(r => r.enabled).length}</div><div className="text-xs text-bs-gray-mid">Active Rules</div></div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'inbound', 'outbound'] as const).map(d => (
          <button key={d} onClick={() => setDirectionFilter(d)} className={cn('bs-btn-secondary text-xs capitalize', directionFilter === d && 'bg-bs-orange/10 text-bs-orange border-bs-orange/30')}>{d}</button>
        ))}
      </div>

      <div className="bs-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bs-border">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Rule Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Action</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Direction</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Protocol</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Port</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Remote</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Scope</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Status</th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rule) => (
              <tr key={rule.id} className="border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {rule.action === 'allow' ? <Shield className="w-4 h-4 text-bs-green" /> : <ShieldOff className="w-4 h-4 text-bs-red" />}
                    <span className="text-xs text-bs-white">{rule.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={cn('bs-badge text-[10px]', rule.action === 'allow' ? 'bs-badge-success' : 'bs-badge-danger')}>{rule.action}</span></td>
                <td className="px-4 py-3 text-xs text-bs-gray-light capitalize">{rule.direction}</td>
                <td className="px-4 py-3 text-xs text-bs-gray-light font-mono">{rule.protocol}</td>
                <td className="px-4 py-3 text-xs text-bs-gray-light font-mono">{rule.localPort || rule.remotePort || '*'}</td>
                <td className="px-4 py-3 text-xs text-bs-gray-light font-mono">{rule.remoteAddress || 'Any'}</td>
                <td className="px-4 py-3 text-xs text-bs-gray-light">{rule.endpointId === 'all' ? 'Global' : endpoints.find(e => e.id === rule.endpointId)?.hostname || rule.endpointId}</td>
                <td className="px-4 py-3"><span className={cn('w-2 h-2 rounded-full inline-block', rule.enabled ? 'bg-bs-green' : 'bg-bs-gray-mid')} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="p-1 rounded hover:bg-bs-gray-dark transition-colors"><Edit className="w-3.5 h-3.5 text-bs-gray-mid" /></button>
                    <button className="p-1 rounded hover:bg-bs-gray-dark transition-colors"><Trash2 className="w-3.5 h-3.5 text-bs-gray-mid" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
