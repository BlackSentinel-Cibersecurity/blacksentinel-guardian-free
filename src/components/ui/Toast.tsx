import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timestamp: Date
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: 'bg-bs-green/15 border-bs-green/30 text-bs-green',
  error: 'bg-bs-red/15 border-bs-red/30 text-bs-red',
  warning: 'bg-bs-yellow/15 border-bs-yellow/30 text-bs-yellow',
  info: 'bg-bs-blue/15 border-bs-blue/30 text-bs-blue',
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl shadow-black/20', colorMap[toast.type])}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button onClick={() => onDismiss(toast.id)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
