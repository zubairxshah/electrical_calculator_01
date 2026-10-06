'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  /** Called before re-rendering, e.g. to reset the store to safe defaults */
  onReset?: () => void
}

interface State {
  error: Error | null
}

/** Shows a recoverable message instead of a blank page if the calculator throws while rendering. */
export default class ArcFlashErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Arc flash calculator error:', error, info.componentStack)
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
          <AlertCircle className="h-5 w-5" /> Something went wrong in the arc flash calculator
        </div>
        <p>
          No result is shown. Your history is kept. Reset the inputs to the defaults and try again; if the problem
          persists, please report the inputs you used.
        </p>
        <p className="text-xs text-muted-foreground">{this.state.error.message}</p>
        <Button variant="outline" size="sm" onClick={this.reset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Reset calculator
        </Button>
      </div>
    )
  }
}
