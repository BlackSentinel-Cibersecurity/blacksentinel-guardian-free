import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronRight, AlertTriangle, Shield, Cpu, Wifi, File, Key, Usb, Users, Settings } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { useTimeline, useEndpoints } from '@/hooks'

const categoryIcons: Record<string, React.ElementType> = {
  threat: AlertTriangle, process: Cpu, network: Wifi, file: File, registry: Settings, usb: Usb, auth: Key, policy: Shield, software: Users, user: Users,
}

const categoryColors: Record<string, string> = {
  threat: 'bg-bs-red/15 text-bs-red', process: 'bg-bs-orange/15 text-bs-orange', network: 'bg-bs-blue/15 text-bs-blue',
  file: 'bg-bs-green/15 text-bs-green', registry: 'bg-purple-500/15 text-purple-400', usb: 'bg-cyan-500/15 text-cyan-400',
  auth: 'bg-bs-yellow/15 text-bs-yellow', policy: 'bg-indigo-500/15 text-indigo-400', software: 'bg-pink-500/15 text-pink-400', user: 'bg-teal-500/15 text-teal-400',
}

export default function DeviceTimeline() {
  const { events: timelineEvents } = useTimeline()
  const { endpoints } = useEndpoints()
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = timelineEvents.filter(ev => {
    if (selectedEndpoint !== 'all' && ev.endpointId !== selectedEndpoint) return false
    if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false
    if (searchQuery && !ev.title.toLowerCase().includes(searchQuery.toLowerCase()) && !ev.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bs-white">Device Timeline</h1>
        <p className="text-sm text-bs-gray-mid mt-0.5">Complete event history across all endpoints</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bs-gray-mid" />
          <input type="text" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bs-input pl-10" />
        </div>
        <select value={selectedEndpoint} onChange={(e) => setSelectedEndpoint(e.target.value)} className="bs-input text-sm">
          <option value="all">All Endpoints</option>
          {endpoints.map(ep => <option key={ep.id} value={ep.id}>{ep.hostname}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bs-input text-sm">
          <option value="all">All Categories</option>
          <option value="threat">Threats</option>
          <option value="process">Processes</option>
          <option value="network">Network</option>
          <option value="file">Files</option>
          <option value="auth">Authentication</option>
          <option value="software">Software</option>
          <option value="policy">Policy</option>
          <option value="usb">USB</option>
        </select>
      </div>

      <div className="bs-card p-5">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-bs-border" />

          <div className="space-y-4">
            {filteredEvents.map((event, i) => {
              const Icon = categoryIcons[event.category] || Shield
              const endpoint = endpoints.find(ep => ep.id === event.endpointId)
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative flex items-start gap-4 pl-2"
                >
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center z-10 shrink-0', categoryColors[event.category])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 p-4 rounded-xl bg-bs-gray-dark/30 border border-bs-border/50 hover:border-bs-gray-mid transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-bs-white">{event.title}</h4>
                          <span className={cn('bs-badge text-[10px]',
                            event.severity === 'critical' ? 'bs-badge-danger' :
                            event.severity === 'high' ? 'bs-badge-orange' :
                            event.severity === 'medium' ? 'bs-badge-warning' :
                            event.severity === 'low' ? 'bs-badge-info' : 'bg-bs-gray-dark text-bs-gray-mid border border-bs-border'
                          )}>{event.severity}</span>
                        </div>
                        <p className="text-xs text-bs-gray-mid">{event.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-bs-gray-mid">{endpoint?.hostname}</span>
                          <span className="text-[10px] text-bs-gray-mid">·</span>
                          <span className="text-[10px] text-bs-gray-mid">{event.category}</span>
                          <span className="text-[10px] text-bs-gray-mid">·</span>
                          <span className="text-[10px] text-bs-gray-mid">{event.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-bs-gray-mid shrink-0 mt-1" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
