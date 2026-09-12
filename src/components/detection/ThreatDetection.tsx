import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bug, AlertTriangle, Shield, Search, Filter, ChevronRight, ExternalLink, Terminal, Globe, File, Code, Zap } from 'lucide-react'
import { cn, getSeverityBadge } from '@/utils/helpers'
import { useThreats } from '@/hooks'
import type { Threat } from '@/types'

const typeIcons: Record<string, React.ElementType> = {
  malware: Bug, ransomware: AlertTriangle, exploit: Shield, suspicious: Search, policy: Code,
}

export default function ThreatDetection() {
  const { threats } = useThreats()
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filtered = threats.filter(t => {
    if (severityFilter !== 'all' && t.severity !== severityFilter) return false
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
    return true
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bs-white">Threat Detection</h1>
        <p className="text-sm text-bs-gray-mid mt-0.5">Malware, ransomware, exploits, and suspicious activity detection</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'All Threats', count: threats.length, color: 'bg-bs-gray-dark' },
          { label: 'Critical', count: threats.filter(t => t.severity === 'critical').length, color: 'bg-bs-red/15 text-bs-red border border-bs-red/20' },
          { label: 'High', count: threats.filter(t => t.severity === 'high').length, color: 'bg-bs-orange/15 text-bs-orange border border-bs-orange/20' },
          { label: 'Medium', count: threats.filter(t => t.severity === 'medium').length, color: 'bg-bs-yellow/15 text-bs-yellow border border-bs-yellow/20' },
          { label: 'Active', count: threats.filter(t => t.status === 'active').length, color: 'bg-bs-red/15 text-bs-red border border-bs-red/20' },
        ].map((stat, i) => (
          <div key={i} className={cn('p-3 rounded-xl', stat.color)}>
            <div className="text-xl font-bold">{stat.count}</div>
            <div className="text-xs opacity-70">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="bs-input text-sm">
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bs-input text-sm">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bs-input text-sm">
          <option value="all">All Types</option>
          <option value="malware">Malware</option>
          <option value="ransomware">Ransomware</option>
          <option value="exploit">Exploit</option>
          <option value="suspicious">Suspicious</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((threat, i) => {
          const Icon = typeIcons[threat.type] || Bug
          const isSelected = selectedThreat?.id === threat.id
          return (
            <motion.div
              key={threat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                onClick={() => setSelectedThreat(isSelected ? null : threat)}
                className={cn(
                  'bs-card p-4 cursor-pointer transition-all',
                  isSelected && 'border-bs-orange/50 glow-orange',
                  threat.severity === 'critical' && 'border-l-2 border-l-bs-red'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    threat.severity === 'critical' ? 'bg-bs-red/15' : threat.severity === 'high' ? 'bg-bs-orange/15' : 'bg-bs-yellow/15'
                  )}>
                    <Icon className={cn('w-5 h-5', threat.severity === 'critical' ? 'text-bs-red' : threat.severity === 'high' ? 'text-bs-orange' : 'text-bs-yellow')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-bs-white">{threat.name}</h3>
                      <span className={getSeverityBadge(threat.severity)}>{threat.severity}</span>
                      <span className={cn('bs-badge text-[10px]',
                        threat.status === 'active' ? 'bg-bs-red/10 text-bs-red border border-bs-red/20' :
                        threat.status === 'investigating' ? 'bg-bs-yellow/10 text-bs-yellow border border-bs-yellow/20' :
                        'bg-bs-green/10 text-bs-green border border-bs-green/20'
                      )}>{threat.status}</span>
                    </div>
                    <p className="text-xs text-bs-gray-mid mb-2">{threat.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-bs-gray-mid">
                      <span>{threat.endpointName}</span>
                      <span>·</span>
                      <span>{threat.type}</span>
                      <span>·</span>
                      <span>{threat.detectedAt.toLocaleString()}</span>
                      {threat.autoRemediated && <><span>·</span><span className="text-bs-green">Auto-remediated</span></>}
                    </div>
                  </div>
                  <ChevronRight className={cn('w-4 h-4 text-bs-gray-mid transition-transform', isSelected && 'rotate-90')} />
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-bs-border space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-bs-gray-mid uppercase mb-2">MITRE ATT&CK</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {threat.mitreTactics.map((tactic, i) => (
                            <span key={i} className="text-[10px] bg-bs-orange/10 text-bs-orange px-2 py-1 rounded-md border border-bs-orange/20">{tactic}</span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {threat.mitreTechniques.map((tech, i) => (
                            <span key={i} className="text-[10px] bg-bs-blue/10 text-bs-blue px-2 py-1 rounded-md border border-bs-blue/20 font-mono">{tech}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-bs-gray-mid uppercase mb-2">IOCs</h4>
                        <div className="space-y-1">
                          {threat.iocs.map((ioc, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="text-bs-gray-mid">{ioc.type}:</span>
                              <span className="font-mono text-bs-white bg-bs-gray-dark px-2 py-0.5 rounded text-[11px]">{ioc.value}</span>
                              <span className="text-bs-gray-mid">{Math.round(ioc.confidence * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {threat.processTree && (
                      <div>
                        <h4 className="text-xs font-semibold text-bs-gray-mid uppercase mb-2">Process Tree</h4>
                        <div className="bg-bs-black rounded-lg p-3 font-mono text-xs text-bs-green overflow-x-auto">
                          <ProcessNodeComponent node={threat.processTree} depth={0} />
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-bs-gray-mid uppercase mb-2">Recommended Actions</h4>
                      <div className="space-y-1.5">
                        {threat.recommendedActions.map((action, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-bs-gray-light">
                            <Zap className="w-3 h-3 text-bs-orange shrink-0" />
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="bs-btn-danger text-xs">Isolate Endpoint</button>
                      <button className="bs-btn-secondary text-xs">Kill Process</button>
                      <button className="bs-btn-secondary text-xs">Quarantine File</button>
                      <button className="bs-btn-primary text-xs">Full Investigation</button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function ProcessNodeComponent({ node, depth }: { node: { pid: number; name: string; commandLine: string; children: any[] }; depth: number }) {
  return (
    <div>
      <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 16}px` }}>
        {depth > 0 && <span className="text-bs-gray-mid">├── </span>}
        <span className="text-bs-orange">{node.name}</span>
        <span className="text-bs-gray-mid">PID:{node.pid}</span>
        <span className="text-bs-gray-mid opacity-50">"{node.commandLine}"</span>
      </div>
      {node.children.map((child: any, i: number) => (
        <ProcessNodeComponent key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}
