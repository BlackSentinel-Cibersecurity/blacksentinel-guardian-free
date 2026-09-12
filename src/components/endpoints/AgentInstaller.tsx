import { useState } from 'react'
import { Copy, Check, Terminal, Shield } from 'lucide-react'
import { cn } from '@/utils/helpers'
import type { OS } from '@/types'

interface AgentInstallerProps {
  registrationToken: string
  os?: OS
}

const installCommands: Record<OS, string> = {
  linux: 'curl -fsSL https://your-domain.com/agent/install.sh | bash -s -- --token',
  macos: 'curl -fsSL https://your-domain.com/agent/install.sh | bash -s -- --token',
  windows:
    "powershell -Command \"Invoke-WebRequest -Uri 'https://your-domain.com/agent/install.ps1' -OutFile install.ps1; .\\install.ps1 -Token",
}

const osLabels: Record<OS, string> = {
  linux: 'Linux',
  macos: 'macOS',
  windows: 'Windows',
}

export default function AgentInstaller({ registrationToken, os }: AgentInstallerProps) {
  const [copiedOs, setCopiedOs] = useState<OS | null>(null)

  const handleCopy = async (osType: OS) => {
    const command = `${installCommands[osType]} ${registrationToken}`
    await navigator.clipboard.writeText(command)
    setCopiedOs(osType)
    setTimeout(() => setCopiedOs(null), 2000)
  }

  const osList: OS[] = os ? [os] : ['linux', 'macos', 'windows']

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-bs-blue/10 border border-bs-blue/20">
        <Shield className="w-4 h-4 text-bs-blue shrink-0" />
        <div className="text-xs text-bs-gray-light">
          <span className="font-medium text-bs-white">Registration Token:</span>{' '}
          <code className="font-mono text-bs-blue">{registrationToken}</code>
        </div>
      </div>

      <div className="space-y-3">
        {osList.map((osType) => {
          const command = `${installCommands[osType]} ${registrationToken}`
          const isCopied = copiedOs === osType

          return (
            <div key={osType} className="bs-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-bs-gray-mid" />
                  <span className="text-xs font-medium text-bs-white">{osLabels[osType]}</span>
                </div>
                <button
                  onClick={() => handleCopy(osType)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    isCopied
                      ? 'bg-bs-green/15 text-bs-green border border-bs-green/20'
                      : 'bs-btn-secondary text-xs'
                  )}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 rounded-lg bg-bs-black border border-bs-border font-mono text-xs text-bs-gray-light break-all leading-relaxed">
                {command}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-xs text-bs-gray-mid space-y-1.5">
        <p className="font-medium text-bs-gray-light">Instructions:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Copy the install command for your operating system above.</li>
          <li>Open a terminal with administrative/root privileges on the target machine.</li>
          <li>Paste and run the command. The agent will automatically register with this platform.</li>
          <li>The endpoint will appear in your inventory once the first heartbeat is received.</li>
        </ol>
      </div>
    </div>
  )
}
