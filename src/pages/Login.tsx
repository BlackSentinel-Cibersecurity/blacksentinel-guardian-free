import { useState, useEffect } from 'react'
import { Lock, Mail, ArrowRight, AlertTriangle, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const BOOTSTRAP_CREDENTIALS = {
  email: 'setup@blacksentinel.io',
  password: 'Guardian$etup2024!',
}

interface LoginProps {
  onLogin: () => void
  onSetupMode?: () => void
}

export default function Login({ onLogin, onSetupMode }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const {
    login,
    isLoading,
    bootstrapMode,
    checkBootstrapStatus,
  } = useAuth()

  useEffect(() => {
    checkBootstrapStatus()
  }, [checkBootstrapStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('All fields are required')
      return
    }
    const result = await login(email, password)
    if (result.success) {
      onLogin()
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-bs-black flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-bs-black via-bs-gray-dark to-bs-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,107,0,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,107,0,0.04),transparent_50%)]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,107,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="w-16 h-16 rounded-2xl bg-bs-orange/10 border border-bs-orange/30 flex items-center justify-center mb-8">
            <img src="/logo.png" alt="BlackSentinel" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-bs-white mb-4 tracking-tight">
            BLACKSENTINEL
          </h1>
          <h2 className="text-xl text-bs-orange mb-6 font-medium">
            GUARDIAN
          </h2>
          <p className="text-bs-gray-mid text-lg leading-relaxed max-w-md">
            Autonomous Endpoint Defense Platform. Next-generation cyberwarfare protection powered by AI-driven threat intelligence.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-bs-orange" />
              <span className="text-bs-gray-light text-sm">Zero Trust Architecture</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-bs-orange" />
              <span className="text-bs-gray-light text-sm">Autonomous Response Engine</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-bs-orange" />
              <span className="text-bs-gray-light text-sm">Real-time Threat Intelligence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-bs-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,0,0.03),transparent_70%)]" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-bs-orange/10 border border-bs-orange/30 flex items-center justify-center">
              <img src="/logo.png" alt="BlackSentinel" className="w-8 h-8" />
            </div>
            <div>
              <div className="text-lg font-bold text-bs-white tracking-tight">BLACKSENTINEL</div>
              <div className="text-xs text-bs-orange font-medium">GUARDIAN</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-bs-white mb-2">Sign in to Guardian</h2>
            <p className="text-bs-gray-mid">Access your security operations center</p>
          </div>

          {/* Bootstrap Mode Banner */}
          {bootstrapMode === true && (
            <div className="mb-6 p-4 rounded-lg bg-bs-orange/5 border border-bs-orange/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-bs-orange mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-bs-orange text-sm font-medium mb-1">
                    System in Setup Mode
                  </p>
                  <p className="text-bs-gray-mid text-xs mb-3">
                    Default setup credentials are active. Complete the initial configuration to secure your system.
                  </p>
                  <button
                    onClick={onSetupMode}
                    className="flex items-center gap-2 text-xs font-medium text-bs-orange hover:text-bs-orange-bright transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Setup System
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-bs-red/10 border border-bs-red/30">
              <p className="text-bs-red text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-bs-gray-light mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bs-gray-mid" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  className="w-full bg-bs-gray-dark border border-bs-gray-mid/30 rounded-lg pl-11 pr-4 py-3 text-bs-white placeholder-bs-gray-mid focus:outline-none focus:border-bs-orange/50 focus:ring-1 focus:ring-bs-orange/20 transition-all"
                  placeholder="admin@blacksentinel.io"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bs-gray-light mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bs-gray-mid" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="w-full bg-bs-gray-dark border border-bs-gray-mid/30 rounded-lg pl-11 pr-4 py-3 text-bs-white placeholder-bs-gray-mid focus:outline-none focus:border-bs-orange/50 focus:ring-1 focus:ring-bs-orange/20 transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-bs-gray-mid bg-bs-gray-dark text-bs-orange focus:ring-bs-orange/20" />
                <span className="text-sm text-bs-gray-light">Remember me</span>
              </label>
              <button type="button" className="text-sm text-bs-orange hover:text-bs-orange-bright transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bs-orange hover:bg-bs-orange-bright text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-bs-gray-mid text-sm">
              Protected by BlackSentinel encryption
            </p>
          </div>

          {/* System Status */}
          <div className="mt-12 p-4 rounded-lg bg-bs-gray-dark/50 border border-bs-gray-mid/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-bs-gray-mid">System Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${bootstrapMode ? 'bg-bs-yellow' : 'bg-bs-green'}`} />
                <span className={`text-xs ${bootstrapMode ? 'text-bs-yellow' : 'text-bs-green'}`}>
                  {bootstrapMode === null ? 'Checking...' : bootstrapMode ? 'Setup Mode' : 'Operational'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
