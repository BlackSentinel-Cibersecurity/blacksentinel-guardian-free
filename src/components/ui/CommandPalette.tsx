import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Monitor, Clock, Bug, Brain, Swords, ShieldAlert, Usb, Network, Lock, Code, Settings, Link, Command } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: string) => void
}

const commands = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { id: 'endpoints', label: 'Endpoints', icon: Monitor, group: 'Navigation' },
  { id: 'timeline', label: 'Device Timeline', icon: Clock, group: 'Navigation' },
  { id: 'detection', label: 'Threat Detection', icon: Bug, group: 'Navigation' },
  { id: 'behavioral', label: 'Behavioral Engine', icon: Brain, group: 'Navigation' },
  { id: 'response', label: 'Response Center', icon: Swords, group: 'Navigation' },
  { id: 'vulnerabilities', label: 'Vulnerabilities', icon: ShieldAlert, group: 'Navigation' },
  { id: 'usb', label: 'USB Control', icon: Usb, group: 'Navigation' },
  { id: 'firewall', label: 'Firewall', icon: Network, group: 'Navigation' },
  { id: 'isolation', label: 'Device Isolation', icon: Lock, group: 'Navigation' },
  { id: 'scripts', label: 'Script Control', icon: Code, group: 'Navigation' },
  { id: 'integrations', label: 'Integrations', icon: Link, group: 'Actions' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'Actions' },
]

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  const [prevQuery, setPrevQuery] = useState(query)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setQuery('')
      setSelectedIdx(0)
    }
  } else if (query !== prevQuery) {
    setPrevQuery(query)
    setSelectedIdx(0)
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIdx]) {
      onNavigate(filtered[selectedIdx].id)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[300]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-bs-surface-elevated border border-bs-border rounded-2xl shadow-2xl shadow-black/40 z-[301] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-bs-border">
              <Command className="w-4 h-4 text-bs-gray-mid" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-sm text-bs-white placeholder:text-bs-gray-mid focus:outline-none"
              />
              <kbd className="text-[10px] text-bs-gray-mid bg-bs-gray-dark px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-bs-gray-mid">No results found</div>
              )}
              {filtered.map((cmd, i) => (
                <button
                  key={cmd.id}
                  onClick={() => { onNavigate(cmd.id); onClose() }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                    i === selectedIdx ? 'bg-bs-orange/10 text-bs-orange' : 'text-bs-gray-light hover:bg-bs-gray-dark'
                  )}
                >
                  <cmd.icon className="w-4 h-4" />
                  <span>{cmd.label}</span>
                  <span className="ml-auto text-[10px] text-bs-gray-mid">{cmd.group}</span>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-bs-border flex items-center gap-4 text-[10px] text-bs-gray-mid">
              <span><kbd className="bg-bs-gray-dark px-1 py-0.5 rounded">↑↓</kbd> Navigate</span>
              <span><kbd className="bg-bs-gray-dark px-1 py-0.5 rounded">↵</kbd> Select</span>
              <span><kbd className="bg-bs-gray-dark px-1 py-0.5 rounded">ESC</kbd> Close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
