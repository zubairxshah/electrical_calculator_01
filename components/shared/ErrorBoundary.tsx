'use client'

/**
 * Error Boundary Component
 * 
 * Catches React component errors and displays user-friendly fallback UI
 * Prevents application crashes and information disclosure
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging (server-side only)
    if (typeof window === 'undefined') {
      console.error('[ERROR_BOUNDARY]', {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        }
      })
    }

    this.setState({
      hasError: true,
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      // Default fallback UI
      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Calculation Error</span>
            </CardTitle>
            <CardDescription>
              Something went wrong with the calculation. This has been logged for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The calculation encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>
            <div className="flex space-x-2">
              <Button onClick={this.handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    // Log error safely
    if (typeof window === 'undefined') {
      console.error('[USE_ERROR_HANDLER]', {
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo
      })
    }
    
    // In a real app, you might want to send this to an error reporting service
    // But ensure no sensitive data is included
  }
}

/**
 * Calculation-specific error fallback
 */
export function CalculationErrorFallback({ 
  error, 
  retry 
}: { 
  error?: Error
  retry: () => void 
}) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Calculation Failed</CardTitle>
        <CardDescription>
          The calculation could not be completed due to an error.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Please check your input values and try again. If the problem persists, 
          the calculation may be outside supported ranges.
        </p>
        <Button onClick={retry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Calculation
        </Button>
      </CardContent>
    </Card>
  )
}