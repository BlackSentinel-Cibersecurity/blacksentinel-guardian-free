import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, AlertTriangle, Shield, Activity, Users, Cpu, Network, Eye } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { api } from '@/services/api'

interface BehavioralProfile {
  id: number
  name: string
  endpoint: string
  riskLevel: string
  deviations: number
  lastUpdated: string
  processes: number
  connections: number
}

interface Anomaly {
  id: number
  user: string
  endpoint: string
  type: string
  description: string
  severity: string
  timestamp: string
  baseline: string
  deviation: string
}

export default function BehavioralEngine() {
  const [behavioralProfiles, setBehavioralProfiles] = useState<BehavioralProfile[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null)
  const [view, setView] = useState<'profiles' | 'anomalies'>('anomalies')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profilesRes, anomaliesRes] = await Promise.all([
          api.request<BehavioralProfile[]>('/api/behavioral/profiles').catch(() => []),
          api.request<Anomaly[]>('/api/behavioral/anomalies').catch(() => []),
        ])
        setBehavioralProfiles(profilesRes)
        setAnomalies(anomaliesRes)
      } catch {
        setBehavioralProfiles([])
        setAnomalies([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bs-white">Behavioral Engine</h1>
          <p className="text-sm text-bs-gray-mid mt-0.5">User and entity behavior analytics with baseline deviation detection</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('anomalies')} className={cn('bs-btn-secondary text-xs', view === 'anomalies' && 'bg-bs-orange/10 text-bs-orange border-bs-orange/30')}>Anomalies</button>
          <button onClick={() => setView('profiles')} className={cn('bs-btn-secondary text-xs', view === 'profiles' && 'bg-bs-orange/10 text-bs-orange border-bs-orange/30')}>User Profiles</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-orange/15 flex items-center justify-center"><Brain className="w-5 h-5 text-bs-orange" /></div>
            <div><div className="text-xl font-bold text-bs-white">{behavioralProfiles.length}</div><div className="text-xs text-bs-gray-mid">Profiles Active</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-red/15 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-bs-red" /></div>
            <div><div className="text-xl font-bold text-bs-white">{anomalies.length}</div><div className="text-xs text-bs-gray-mid">Anomalies Detected</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><Shield className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">94%</div><div className="text-xs text-bs-gray-mid">Baseline Accuracy</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center"><Activity className="w-5 h-5 text-bs-blue" /></div>
            <div><div className="text-xl font-bold text-bs-white">48.2K</div><div className="text-xs text-bs-gray-mid">Events Analyzed</div></div>
          </div>
        </div>
      </div>

      {view === 'anomalies' ? (
        <div className="space-y-3">
          {anomalies.map((anomaly, i) => (
            <motion.div
              key={anomaly.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn('bs-card p-4 border-l-2', anomaly.severity === 'critical' ? 'border-l-bs-red' : anomaly.severity === 'high' ? 'border-l-bs-orange' : 'border-l-bs-yellow')}
            >
              <div className="flex items-start gap-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  anomaly.severity === 'critical' ? 'bg-bs-red/15' : anomaly.severity === 'high' ? 'bg-bs-orange/15' : 'bg-bs-yellow/15'
                )}>
                  {anomaly.type === 'Process' && <Cpu className="w-5 h-5 text-bs-orange" />}
                  {anomaly.type === 'Network' && <Network className="w-5 h-5 text-bs-blue" />}
                  {anomaly.type === 'Privilege' && <Shield className="w-5 h-5 text-bs-red" />}
                  {anomaly.type === 'File' && <Activity className="w-5 h-5 text-bs-yellow" />}
                  {anomaly.type === 'DNS' && <Eye className="w-5 h-5 text-purple-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-bs-white">{anomaly.description}</h4>
                    <span className={cn('bs-badge text-[10px]', anomaly.severity === 'critical' ? 'bs-badge-danger' : anomaly.severity === 'high' ? 'bs-badge-orange' : 'bs-badge-warning')}>{anomaly.severity}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-[10px] text-bs-gray-mid uppercase mb-0.5">Baseline</p>
                      <p className="text-xs text-bs-gray-light">{anomaly.baseline}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-bs-gray-mid uppercase mb-0.5">Deviation</p>
                      <p className="text-xs text-bs-orange">{anomaly.deviation}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-bs-gray-mid uppercase mb-0.5">Context</p>
                      <p className="text-xs text-bs-gray-light">{anomaly.user} · {anomaly.endpoint}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="bs-btn-secondary text-[10px] py-1">Investigate</button>
                    <button className="bs-btn-secondary text-[10px] py-1">Mark as Benign</button>
                    <button className="bs-btn-danger text-[10px] py-1">Isolate Endpoint</button>
                  </div>
                </div>
                <span className="text-[10px] text-bs-gray-mid shrink-0">{anomaly.timestamp}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bs-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bs-border">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">User</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Endpoint</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Risk Level</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Deviations</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Processes</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Connections</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-bs-gray-mid uppercase">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {behavioralProfiles.map((profile) => (
                <tr key={profile.id} className="border-b border-bs-border/50 hover:bg-bs-gray-dark/30 transition-colors cursor-pointer" onClick={() => setSelectedProfile(selectedProfile === profile.id ? null : profile.id)}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-bs-gray-dark flex items-center justify-center"><Users className="w-3.5 h-3.5 text-bs-gray-mid" /></div><span className="text-sm text-bs-white">{profile.name}</span></div></td>
                  <td className="px-4 py-3 text-xs text-bs-gray-light">{profile.endpoint}</td>
                  <td className="px-4 py-3"><span className={cn('bs-badge text-[10px]', profile.riskLevel === 'critical' ? 'bs-badge-danger' : profile.riskLevel === 'high' ? 'bs-badge-orange' : profile.riskLevel === 'medium' ? 'bs-badge-warning' : 'bs-badge-success')}>{profile.riskLevel}</span></td>
                  <td className="px-4 py-3 text-xs text-bs-gray-light">{profile.deviations}</td>
                  <td className="px-4 py-3 text-xs text-bs-gray-light">{profile.processes}</td>
                  <td className="px-4 py-3 text-xs text-bs-gray-light">{profile.connections}</td>
                  <td className="px-4 py-3 text-xs text-bs-gray-mid">{profile.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
