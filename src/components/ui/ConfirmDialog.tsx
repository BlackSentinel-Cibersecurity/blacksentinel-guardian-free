import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  variant: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onClose: () => void
}

const variantConfig = {
  danger: { icon: AlertTriangle, color: 'text-bs-red', bg: 'bg-bs-red/10', border: 'border-bs-red/20', btn: 'bg-bs-red hover:bg-bs-red/80' },
  warning: { icon: AlertCircle, color: 'text-bs-yellow', bg: 'bg-bs-yellow/10', border: 'border-bs-yellow/20', btn: 'bg-bs-yellow hover:bg-bs-yellow/80 text-bs-black' },
  info: { icon: Info, color: 'text-bs-blue', bg: 'bg-bs-blue/10', border: 'border-bs-blue/20', btn: 'bg-bs-blue hover:bg-bs-blue/80' },
}

export function ConfirmDialog({ isOpen, title, message, confirmText, variant, onConfirm, onClose }: ConfirmDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-bs-surface-elevated border border-bs-border rounded-2xl shadow-2xl shadow-black/40 z-[201] overflow-hidden"
          >
            <div className="p-6">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', config.bg)}>
                <Icon className={cn('w-6 h-6', config.color)} />
              </div>
              <h3 className="text-lg font-bold text-bs-white mb-2">{title}</h3>
              <p className="text-sm text-bs-gray-light">{message}</p>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-bs-border bg-bs-gray-dark/30">
              <button onClick={onClose} className="flex-1 bs-btn-secondary text-sm">Cancel</button>
              <button onClick={onConfirm} className={cn('flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors', config.btn)}>
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
