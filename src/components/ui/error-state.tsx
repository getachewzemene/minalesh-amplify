'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  AlertCircle, 
  AlertTriangle,
  XCircle,
  RefreshCw,
  LucideIcon 
} from 'lucide-react'

interface ErrorStateProps {
  icon?: LucideIcon
  title?: string
  message: string
  variant?: 'error' | 'warning' | 'partial'
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

const iconMap: Record<string, LucideIcon> = {
  error: XCircle,
  warning: AlertTriangle,
  partial: AlertCircle,
}

const variantStyles = {
  error: 'text-destructive',
  warning: 'text-yellow-600 dark:text-yellow-500',
  partial: 'text-orange-600 dark:text-orange-500',
}

/**
 * ErrorState component - displays error messages with retry functionality
 */
export function ErrorState({ 
  icon: Icon, 
  title,
  message, 
  variant = 'error',
  onRetry,
  retryLabel = 'Try again',
  className = '' 
}: ErrorStateProps) {
  const IconComponent = Icon || iconMap[variant]
  const defaultTitle = variant === 'partial' ? 'Partial Failure' : variant === 'warning' ? 'Warning' : 'Error'
  
  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3">
            <IconComponent className={`h-5 w-5 mt-0.5 ${variantStyles[variant]}`} />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{title || defaultTitle}</h3>
              <p className="text-sm text-muted-foreground mb-4">{message}</p>
              {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {retryLabel}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * InlineErrorState - compact error display for inline use
 */
export function InlineErrorState({ 
  message, 
  onRetry,
  variant = 'error' 
}: Pick<ErrorStateProps, 'message' | 'onRetry' | 'variant'>) {
  return (
    <Alert variant={variant === 'error' ? 'destructive' : 'default'}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button onClick={onRetry} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * PartialFailureState - displays when some operations succeeded and some failed
 */
export function PartialFailureState({ 
  successCount, 
  failureCount, 
  failureMessage,
  onRetryFailed
}: { 
  successCount: number
  failureCount: number
  failureMessage?: string
  onRetryFailed?: () => void
}) {
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle>Partial Success</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          {successCount} operation{successCount !== 1 ? 's' : ''} succeeded, 
          but {failureCount} failed.
        </p>
        {failureMessage && (
          <p className="text-sm text-muted-foreground mb-2">{failureMessage}</p>
        )}
        {onRetryFailed && (
          <Button onClick={onRetryFailed} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry failed operations
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
