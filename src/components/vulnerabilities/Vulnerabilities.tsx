import { motion } from 'framer-motion'
import { ShieldAlert, AlertTriangle, Server, CheckCircle } from 'lucide-react'
import { cn, getSeverityBadge } from '@/utils/helpers'
import { useVulnerabilities } from '@/hooks'

export default function Vulnerabilities() {
  const { vulnerabilities } = useVulnerabilities()
  const totalAffected = vulnerabilities.reduce((sum, v) => sum + v.affectedEndpoints, 0)
  const exploited = vulnerabilities.filter(v => v.exploitedInTheWild).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bs-white">Vulnerability Awareness</h1>
        <p className="text-sm text-bs-gray-mid mt-0.5">CVE detection, prioritization, and remediation guidance</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-red/15 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-bs-red" /></div>
            <div><div className="text-xl font-bold text-bs-white">{vulnerabilities.length}</div><div className="text-xs text-bs-gray-mid">Total CVEs</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-orange/15 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-bs-orange" /></div>
            <div><div className="text-xl font-bold text-bs-white">{exploited}</div><div className="text-xs text-bs-gray-mid">Exploited in Wild</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-blue/15 flex items-center justify-center"><Server className="w-5 h-5 text-bs-blue" /></div>
            <div><div className="text-xl font-bold text-bs-white">{totalAffected}</div><div className="text-xs text-bs-gray-mid">Endpoint Impacts</div></div>
          </div>
        </div>
        <div className="bs-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bs-green/15 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-bs-green" /></div>
            <div><div className="text-xl font-bold text-bs-white">{vulnerabilities.filter(v => v.patchAvailable).length}</div><div className="text-xs text-bs-gray-mid">Patches Available</div></div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {vulnerabilities.map((vul, i) => (
          <motion.div
            key={vul.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('bs-card p-5 border-l-2', vul.severity === 'critical' ? 'border-l-bs-red' : 'border-l-bs-orange')}
          >
            <div className="flex items-start gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                vul.severity === 'critical' ? 'bg-bs-red/15' : 'bg-bs-orange/15'
              )}>
                <ShieldAlert className={cn('w-6 h-6', vul.severity === 'critical' ? 'text-bs-red' : 'text-bs-orange')} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-bold text-bs-white font-mono">{vul.cveId}</h3>
                  <span className={getSeverityBadge(vul.severity)}>{vul.severity}</span>
                  {vul.exploitedInTheWild && <span className="bs-badge-danger text-[10px]">Exploited in Wild</span>}
                  {vul.patchAvailable && <span className="bs-badge-success text-[10px]">Patch Available</span>}
                </div>
                <p className="text-xs text-bs-gray-light mb-2">{vul.description}</p>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div><span className="text-bs-gray-mid">Software: </span><span className="text-bs-white">{vul.software}</span></div>
                  <div><span className="text-bs-gray-mid">CVSS: </span><span className={cn('font-bold', vul.cvssScore >= 9 ? 'text-bs-red' : 'text-bs-orange')}>{vul.cvssScore}</span></div>
                  <div><span className="text-bs-gray-mid">Affected: </span><span className="text-bs-white">{vul.affectedEndpoints} endpoints</span></div>
                  <div><span className="text-bs-gray-mid">Published: </span><span className="text-bs-white">{vul.publishDate.toLocaleDateString()}</span></div>
                </div>
              </div>
              <button className="bs-btn-primary text-xs shrink-0">Remediate</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
