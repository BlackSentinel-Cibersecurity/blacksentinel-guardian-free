import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg' | string; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }
  return <Loader2 className={cn('animate-spin text-bs-orange', typeof size === 'string' ? size : sizeClasses[size], className)} />
}

export function LoadingPage({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-bs-gray-mid">{message}</p>
    </div>
  )
}

export function LoadingCard({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="bs-card p-8 flex flex-col items-center justify-center gap-3">
      <LoadingSpinner size="md" />
      <p className="text-xs text-bs-gray-mid">{message}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType; title: string; description: string; action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-bs-gray-dark flex items-center justify-center">
        <Icon className="w-8 h-8 text-bs-gray-mid" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-semibold text-bs-white mb-1">{title}</h3>
        <p className="text-xs text-bs-gray-mid max-w-sm">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-bs-red/10 flex items-center justify-center">
        <span className="text-2xl font-bold text-bs-red">!</span>
      </div>
      <div className="text-center">
        <h3 className="text-sm font-semibold text-bs-white mb-1">Something went wrong</h3>
        <p className="text-xs text-bs-gray-mid max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="bs-btn-primary text-xs">Try Again</button>
      )}
    </div>
  )
}
