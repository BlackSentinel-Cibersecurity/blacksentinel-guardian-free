import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, ExternalLink, CheckCircle, AlertCircle, Settings, RefreshCw, Plus, Cloud, Database, MessageSquare, Code } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { api } from '@/services/api'
import type { Integration } from '@/types'

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.integrations.list()
      .then(data => setIntegrations(data))
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = [...new Set(integrations.map(i => i.category))]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bs-white">Integrations</h1>
          <p className="text-sm text-bs-gray-mid mt-0.5">Connect with your security ecosystem</p>
        </div>
        <button className="bs-btn-primary text-xs flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Add Integration</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">{integrations.filter(i => i.status === 'connected').length}</div><div className="text-xs text-bs-gray-mid">Connected</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-gray-mid/30 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-bs-gray-mid" /></div>
            <div><div className="text-xl font-bold text-bs-white">{integrations.filter(i => i.status === 'disconnected').length}</div><div className="text-xs text-bs-gray-mid">Available</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center"><RefreshCw className="w-5 h-5 text-bs-blue" /></div>
            <div><div className="text-xl font-bold text-bs-white">{integrations.length}</div><div className="text-xs text-bs-gray-mid">Total Available</div></div>
          </div>
        </div>
      </div>

      {categories.map(category => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-bs-white mb-3">{category}</h3>
          <div className="grid grid-cols-3 gap-3">
            {integrations.filter(i => i.category === category).map(integration => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bs-card p-4 hover:border-bs-gray-mid transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{integration.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-bs-white">{integration.name}</h4>
                      <span className={cn('w-2 h-2 rounded-full', integration.status === 'connected' ? 'bg-bs-green' : 'bg-bs-gray-mid')} />
                    </div>
                    <p className="text-[10px] text-bs-gray-mid">{integration.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-bs-gray-mid">Last sync: {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}</span>
                      <button className={cn('text-[10px] px-2 py-1 rounded',
                        integration.status === 'connected' ? 'bg-bs-gray-dark text-bs-gray-light hover:bg-bs-gray-mid' : 'bg-bs-orange text-white hover:bg-bs-orange-bright'
                      )}>
                        {integration.status === 'connected' ? 'Configure' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
