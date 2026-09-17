import { useState, useEffect } from 'react'
import { Code, Shield, ShieldOff, Settings, Terminal, FileCode } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { api } from '@/services/api'

interface ScriptRule {
  id: number
  name: string
  engine: string
  mode: string
  status: string
  endpoints: number
  blocks: number
}

interface RecentBlock {
  id: number
  script: string
  command: string
  endpoint: string
  timestamp: string
  reason: string
}

export default function ScriptControl() {
  const [scriptRules, setScriptRules] = useState<ScriptRule[]>([])
  const [recentBlocks, setRecentBlocks] = useState<RecentBlock[]>([])
  const [, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rulesRes, blocksRes] = await Promise.all([
          api.request<ScriptRule[]>('/api/scripts/rules').catch(() => []),
          api.request<RecentBlock[]>('/api/scripts/blocks').catch(() => []),
        ])
        setScriptRules(rulesRes)
        setRecentBlocks(blocksRes)
      } catch {
        setScriptRules([])
        setRecentBlocks([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bs-white">Script Control</h1>
        <p className="text-sm text-bs-gray-mid mt-0.5">Execution control for PowerShell, Bash, Python, and other script engines</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-orange/15 flex items-center justify-center"><Code className="w-5 h-5 text-bs-orange" /></div>
            <div><div className="text-xl font-bold text-bs-white">{scriptRules.length}</div><div className="text-xs text-bs-gray-mid">Active Rules</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-red/15 flex items-center justify-center"><ShieldOff className="w-5 h-5 text-bs-red" /></div>
            <div><div className="text-xl font-bold text-bs-white">{scriptRules.reduce((s, r) => s + r.blocks, 0)}</div><div className="text-xs text-bs-gray-mid">Blocks Today</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><Shield className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">6</div><div className="text-xs text-bs-gray-mid">Engines Controlled</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center"><Terminal className="w-5 h-5 text-bs-blue" /></div>
            <div><div className="text-xl font-bold text-bs-white">8</div><div className="text-xs text-bs-gray-mid">Endpoints Protected</div></div>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-bs-white">Engine Policies</h3>
      <div className="bs-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-bs-border">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Engine</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Policy</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Mode</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Endpoints</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Blocks</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Status</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {scriptRules.map((rule) => (
              <tr key={rule.id} className="border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-bs-orange" />
                    <span className="text-xs text-bs-white">{rule.engine}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-bs-gray-light">{rule.name}</td>
                <td className="px-4 py-3"><span className={cn('bs-badge text-[10px]',
                  rule.mode === 'Blocked' ? 'bs-badge-danger' :
                  rule.mode === 'Constrained' ? 'bs-badge-warning' :
                  rule.mode === 'Signed Only' ? 'bs-badge-info' : 'bs-badge-success'
                )}>{rule.mode}</span></td>
                <td className="px-4 py-3 text-xs text-bs-gray-light">{rule.endpoints}</td>
                <td className="px-4 py-3 text-xs text-bs-orange font-medium">{rule.blocks}</td>
                <td className="px-4 py-3"><span className="w-2 h-2 rounded-full bg-bs-green inline-block" /></td>
                <td className="px-4 py-3"><button className="p-1 rounded hover:bg-bs-gray-dark transition-colors"><Settings className="w-4 h-4 text-bs-gray-mid" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-sm font-semibold text-bs-white">Recent Script Blocks</h3>
      <div className="space-y-2">
        {recentBlocks.map((block) => (
          <div key={block.id} className="bs-card p-3 border-l-2 border-l-bs-red">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="bs-badge-danger text-[10px]">{block.script}</span>
                <span className="text-xs text-bs-white">{block.reason}</span>
              </div>
              <span className="text-[10px] text-bs-gray-mid">{block.timestamp}</span>
            </div>
            <p className="text-[11px] text-bs-green font-mono bg-bs-black rounded px-2 py-1">{block.command}</p>
            <p className="text-[10px] text-bs-gray-mid mt-1">{block.endpoint}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
