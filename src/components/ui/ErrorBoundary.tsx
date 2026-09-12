import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[BlackSentinel ErrorBoundary]', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
          <div className="w-16 h-16 rounded-2xl bg-bs-red/10 border border-bs-red/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-bs-red" />
          </div>
          <h2 className="text-xl font-bold text-bs-white mb-2">Module Error</h2>
          <p className="text-sm text-bs-gray-mid mb-1 text-center max-w-md">
            An unexpected error occurred while loading this module.
          </p>
          <p className="text-xs text-bs-gray-mid/60 mb-6 text-center max-w-md font-mono">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bs-orange/10 border border-bs-orange/20 text-bs-orange text-sm font-medium hover:bg-bs-orange/20 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
