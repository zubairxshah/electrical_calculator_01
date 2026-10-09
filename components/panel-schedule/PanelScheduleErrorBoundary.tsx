'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  error: Error | null
}

/** Shows a recoverable message instead of a blank page if the panel schedule throws while rendering. */
export default class PanelScheduleErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Panel schedule error:', error, info.componentStack)
  }

  private reset = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-6 space-y-3 text-sm">
        <div className="flex items-center gap-2 font-semibold text-destructive">
          <AlertCircle className="h-5 w-5" /> Something went wrong in the panel schedule
        </div>
        <p>Your saved panels are kept. Clear the current panel and try again; if the problem persists, please report the circuits you entered.</p>
        <p className="text-xs text-muted-foreground">{this.state.error.message}</p>
        <Button variant="outline" size="sm" onClick={this.reset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Clear panel
        </Button>
      </div>
    )
  }
}
