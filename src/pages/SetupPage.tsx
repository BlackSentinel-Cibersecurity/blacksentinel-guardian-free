import { useState, useEffect } from 'react'
import {
  Shield,
  Database,
  User,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/services/api'

interface SetupPageProps {
  onComplete: () => void
}

type SetupStep = 'welcome' | 'admin' | 'database' | 'organization' | 'complete'

export default function SetupPage({ onComplete }: SetupPageProps) {
  const [step, setStep] = useState<SetupStep>('welcome')
  const [bootstrapCredentials] = useState({
    email: 'setup@blacksentinel.io',
    password: 'Guardian$etup2024!',
  })

  const { bootstrapLogin, bootstrapComplete, isLoading } = useAuth()

  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [dbForm, setDbForm] = useState({
    host: 'localhost',
    port: '5432',
    database: 'blacksentinel_guardian',
    user: 'postgres',
    password: '',
  })
  const [dbTesting, setDbTesting] = useState(false)
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [orgForm, setOrgForm] = useState({
    organizationName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    language: 'en',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  const validateAdminForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!adminForm.name.trim()) newErrors.name = 'Name is required'
    if (!adminForm.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminForm.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!adminForm.password) {
      newErrors.password = 'Password is required'
    } else if (adminForm.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(adminForm.password)) {
      newErrors.password = 'Password must contain an uppercase letter'
    } else if (!/[a-z]/.test(adminForm.password)) {
      newErrors.password = 'Password must contain a lowercase letter'
    } else if (!/[0-9]/.test(adminForm.password)) {
      newErrors.password = 'Password must contain a number'
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(adminForm.password)) {
      newErrors.password = 'Password must contain a special character'
    }
    if (adminForm.password !== adminForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLoginAndProceed = async () => {
    setGeneralError('')
    const result = await bootstrapLogin(bootstrapCredentials.email, bootstrapCredentials.password)
    if (result.success) {
      setStep('admin')
    } else {
      setGeneralError(result.error || 'Login failed')
    }
  }

  const handleAdminSubmit = () => {
    if (validateAdminForm()) {
      setStep('database')
    }
  }

  const handleTestDatabase = async () => {
    setDbTesting(true)
    setDbTestResult(null)
    try {
      const result = await api.auth.testDatabaseConnection(dbForm)
      setDbTestResult(result)
    } catch (err) {
      setDbTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed. Backend may not be running.',
      })
    } finally {
      setDbTesting(false)
    }
  }

  const handleDatabaseSubmit = () => {
    setStep('organization')
  }

  const handleComplete = async () => {
    setGeneralError('')
    const result = await bootstrapComplete({
      name: adminForm.name,
      email: adminForm.email,
      password: adminForm.password,
      confirmPassword: adminForm.confirmPassword,
    })
    if (result.success) {
      setStep('complete')
      setTimeout(() => onComplete(), 2000)
    } else {
      setGeneralError(result.error || 'Setup failed')
    }
  }

  const renderProgress = () => {
    const steps: { key: SetupStep; label: string }[] = [
      { key: 'welcome', label: 'Welcome' },
      { key: 'admin', label: 'Admin User' },
      { key: 'database', label: 'Database' },
      { key: 'organization', label: 'Organization' },
      { key: 'complete', label: 'Complete' },
    ]
    const currentIndex = steps.findIndex((s) => s.key === step)
    return (
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                i < currentIndex
                  ? 'bg-bs-orange text-white'
                  : i === currentIndex
                    ? 'bg-bs-orange/20 text-bs-orange border border-bs-orange/50'
                    : 'bg-bs-gray-dark text-bs-gray-mid border border-bs-gray-mid/30'
              }`}
            >
              {i < currentIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px ${i < currentIndex ? 'bg-bs-orange' : 'bg-bs-gray-mid/30'}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bs-black flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,107,0,0.05),transparent_60%)]" />
      <div className="w-full max-w-lg relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-bs-orange/10 border border-bs-orange/30 flex items-center justify-center">
            <img src="/logo.png" alt="BlackSentinel" className="w-8 h-8" />
          </div>
          <div>
            <div className="text-lg font-bold text-bs-white tracking-tight">BLACKSENTINEL</div>
            <div className="text-xs text-bs-orange font-medium">GUARDIAN</div>
          </div>
        </div>

        {step !== 'welcome' && step !== 'complete' && renderProgress()}

        {generalError && (
          <div className="mb-6 p-3 rounded-lg bg-bs-red/10 border border-bs-red/30">
            <p className="text-bs-red text-sm">{generalError}</p>
          </div>
        )}

        {step === 'welcome' && (
          <div className="space-y-6">
            <div className="bs-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-bs-orange/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-bs-orange" />
                </div>
                <h1 className="text-xl font-bold text-bs-white">System Setup</h1>
              </div>
              <p className="text-bs-gray-mid text-sm leading-relaxed mb-6">
                BlackSentinel Guardian is running for the first time. The system is in bootstrap
                mode with default setup credentials active. Complete the setup wizard to create
                your first administrator account and configure the system.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-bs-gray-dark/50">
                  <User className="w-4 h-4 text-bs-orange mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm text-bs-white font-medium">Create Admin Account</div>
                    <div className="text-xs text-bs-gray-mid">Set up your primary administrator credentials</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-bs-gray-dark/50">
                  <Database className="w-4 h-4 text-bs-orange mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm text-bs-white font-medium">Configure Database</div>
                    <div className="text-xs text-bs-gray-mid">Connect to your PostgreSQL database</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-bs-gray-dark/50">
                  <Building2 className="w-4 h-4 text-bs-orange mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm text-bs-white font-medium">Organization Settings</div>
                    <div className="text-xs text-bs-gray-mid">Configure your organization details</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-bs-yellow/5 border border-bs-yellow/20 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-bs-yellow mt-0.5 shrink-0" />
                  <div className="text-xs text-bs-yellow">
                    <span className="font-medium">Default credentials active.</span>{' '}
                    Email: {bootstrapCredentials.email} | Password: {bootstrapCredentials.password}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleLoginAndProceed}
              disabled={isLoading}
              className="w-full bg-bs-orange hover:bg-bs-orange-bright text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Begin Setup
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {step === 'admin' && (
          <div className="space-y-6">
            <div className="bs-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-bs-orange/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-bs-orange" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-bs-white">Create Administrator</h2>
                  <p className="text-xs text-bs-gray-mid">Set up your primary admin account</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Full Name</label>
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    className="bs-input w-full"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="text-bs-red text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Email</label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="bs-input w-full"
                    placeholder="admin@yourcompany.com"
                  />
                  {errors.email && <p className="text-bs-red text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      className="bs-input w-full pr-10"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bs-gray-mid hover:text-bs-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-bs-red text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={adminForm.confirmPassword}
                      onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                      className="bs-input w-full pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bs-gray-mid hover:text-bs-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-bs-red text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('welcome')} className="bs-btn-secondary flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button onClick={handleAdminSubmit} className="bs-btn-primary flex-1 flex items-center justify-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'database' && (
          <div className="space-y-6">
            <div className="bs-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-bs-orange/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-bs-orange" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-bs-white">Database Configuration</h2>
                  <p className="text-xs text-bs-gray-mid">Connect to your PostgreSQL database</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-bs-gray-light mb-2">Host</label>
                    <input
                      type="text"
                      value={dbForm.host}
                      onChange={(e) => setDbForm({ ...dbForm, host: e.target.value })}
                      className="bs-input w-full"
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-bs-gray-light mb-2">Port</label>
                    <input
                      type="text"
                      value={dbForm.port}
                      onChange={(e) => setDbForm({ ...dbForm, port: e.target.value })}
                      className="bs-input w-full"
                      placeholder="5432"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Database Name</label>
                  <input
                    type="text"
                    value={dbForm.database}
                    onChange={(e) => setDbForm({ ...dbForm, database: e.target.value })}
                    className="bs-input w-full"
                    placeholder="blacksentinel_guardian"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Username</label>
                  <input
                    type="text"
                    value={dbForm.user}
                    onChange={(e) => setDbForm({ ...dbForm, user: e.target.value })}
                    className="bs-input w-full"
                    placeholder="postgres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Password</label>
                  <input
                    type="password"
                    value={dbForm.password}
                    onChange={(e) => setDbForm({ ...dbForm, password: e.target.value })}
                    className="bs-input w-full"
                    placeholder="Database password"
                  />
                </div>

                <button
                  onClick={handleTestDatabase}
                  disabled={dbTesting}
                  className="w-full bs-btn-secondary flex items-center justify-center gap-2"
                >
                  {dbTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  {dbTesting ? 'Testing Connection...' : 'Test Connection'}
                </button>

                {dbTestResult && (
                  <div className={`p-3 rounded-lg border ${dbTestResult.success ? 'bg-bs-green/5 border-bs-green/20' : 'bg-bs-red/5 border-bs-red/20'}`}>
                    <div className="flex items-start gap-2">
                      {dbTestResult.success ? (
                        <CheckCircle className="w-4 h-4 text-bs-green mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-bs-red mt-0.5 shrink-0" />
                      )}
                      <p className={`text-xs ${dbTestResult.success ? 'text-bs-green' : 'text-bs-red'}`}>
                        {dbTestResult.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('admin')} className="bs-btn-secondary flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button onClick={handleDatabaseSubmit} className="bs-btn-primary flex-1 flex items-center justify-center gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'organization' && (
          <div className="space-y-6">
            <div className="bs-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-bs-orange/10 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-bs-orange" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-bs-white">Organization Settings</h2>
                  <p className="text-xs text-bs-gray-mid">Configure your organization details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={orgForm.organizationName}
                    onChange={(e) => setOrgForm({ ...orgForm, organizationName: e.target.value })}
                    className="bs-input w-full"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Timezone</label>
                  <select
                    value={orgForm.timezone}
                    onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                    className="bs-input w-full"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (US)</option>
                    <option value="America/Chicago">Central Time (US)</option>
                    <option value="America/Denver">Mountain Time (US)</option>
                    <option value="America/Los_Angeles">Pacific Time (US)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Europe/Berlin">Berlin (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                    <option value="Asia/Kolkata">Mumbai (IST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-bs-gray-light mb-2">Language</label>
                  <select
                    value={orgForm.language}
                    onChange={(e) => setOrgForm({ ...orgForm, language: e.target.value })}
                    className="bs-input w-full"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="pt">Portuguese</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('database')} className="bs-btn-secondary flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="bs-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="bs-card p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-bs-green/10 border border-bs-green/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-bs-green" />
            </div>
            <h2 className="text-xl font-bold text-bs-white">Setup Complete</h2>
            <p className="text-bs-gray-mid text-sm">
              Your BlackSentinel Guardian system has been configured successfully. Redirecting to
              login...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
