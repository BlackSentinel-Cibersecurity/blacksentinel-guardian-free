import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Monitor, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { api } from '@/services/api'
import type { OS, EndpointRegistration } from '@/types'
import AgentInstaller from './AgentInstaller'

interface AddEndpointModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

type Step = 'form' | 'install'

export default function AddEndpointModal({ isOpen, onClose, onCreated }: AddEndpointModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registration, setRegistration] = useState<EndpointRegistration | null>(null)

  const [hostname, setHostname] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [os, setOs] = useState<OS>('linux')
  const [location, setLocation] = useState('')
  const [department, setDepartment] = useState('')

  const resetForm = () => {
    setHostname('')
    setIpAddress('')
    setOs('linux')
    setLocation('')
    setDepartment('')
    setStep('form')
    setRegistration(null)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await api.registrations.create({
        hostname,
        ipAddress,
        os,
        location,
        department,
      })
      setRegistration(result)
      setStep('install')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create registration')
    } finally {
      setLoading(false)
    }
  }

  const getOsIcon = (osType: OS) => {
    switch (osType) {
      case 'windows': return 'W'
      case 'linux': return 'L'
      case 'macos': return 'M'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bs-card-elevated overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-bs-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bs-orange/15 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-bs-orange" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-bs-white">
                    {step === 'form' ? 'Register New Endpoint' : 'Install Agent'}
                  </h2>
                  <p className="text-xs text-bs-gray-mid">
                    {step === 'form' ? 'Enter endpoint details to generate an install token' : 'Run the command on the target machine'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-bs-gray-dark transition-colors"
              >
                <X className="w-4 h-4 text-bs-gray-mid" />
              </button>
            </div>

            {step === 'form' && (
              <div className="flex items-center gap-2 px-5 py-2 border-b border-bs-border/50">
                {(['form', 'install'] as Step[]).map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                        step === s
                          ? 'bg-bs-orange text-white'
                          : 'bg-bs-gray-dark text-bs-gray-mid border border-bs-border'
                      )}
                    >
                      {i + 1}
                    </div>
                    <span className={cn('text-xs', step === s ? 'text-bs-white' : 'text-bs-gray-mid')}>
                      {s === 'form' ? 'Details' : 'Install'}
                    </span>
                    {i === 0 && <div className="w-8 h-px bg-bs-border mx-1" />}
                  </div>
                ))}
              </div>
            )}

            <div className="p-5">
              {step === 'form' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-bs-red/10 border border-bs-red/20 text-xs text-bs-red">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-bs-gray-light">Hostname *</label>
                    <input
                      type="text"
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value)}
                      placeholder="e.g. workstation-01"
                      required
                      className="w-full bs-input text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-bs-gray-light">IP Address *</label>
                      <input
                        type="text"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        placeholder="e.g. 192.168.1.100"
                        required
                        className="w-full bs-input text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-bs-gray-light">Operating System *</label>
                      <div className="flex gap-2">
                        {(['windows', 'linux', 'macos'] as OS[]).map((osType) => (
                          <button
                            key={osType}
                            type="button"
                            onClick={() => setOs(osType)}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all border',
                              os === osType
                                ? 'bg-bs-orange/10 border-bs-orange/30 text-bs-orange'
                                : 'bg-bs-gray-dark border-bs-border text-bs-gray-mid hover:text-bs-white hover:border-bs-gray-mid'
                            )}
                          >
                            <div className="w-5 h-5 rounded flex items-center justify-center bg-bs-gray-dark/50 text-[10px]">
                              {getOsIcon(osType)}
                            </div>
                            {osType === 'macos' ? 'macOS' : osType.charAt(0).toUpperCase() + osType.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-bs-gray-light">Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Building A, Floor 3"
                        className="w-full bs-input text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-bs-gray-light">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Engineering"
                        className="w-full bs-input text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={handleClose} className="bs-btn-secondary text-sm">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !hostname || !ipAddress}
                      className="bs-btn-primary text-sm flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Generate Token
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-bs-green/10 border border-bs-green/20">
                    <p className="text-xs text-bs-green">
                      Registration created for <span className="font-medium">{registration?.hostname}</span>. Share the install command below with the endpoint administrator.
                    </p>
                  </div>

                  {registration && (
                    <AgentInstaller
                      registrationToken={registration.registrationToken}
                      os={registration.os}
                    />
                  )}

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('form')
                        setRegistration(null)
                      }}
                      className="bs-btn-secondary text-sm flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Register Another
                    </button>
                    <button onClick={handleClose} className="bs-btn-primary text-sm">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
