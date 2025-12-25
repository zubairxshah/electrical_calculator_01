/**
 * Storage Warning Banner Component
 *
 * Displays localStorage quota warnings per FR-016a
 * Prompts user to register for database storage
 */

'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export interface StorageWarningBannerProps {
  quotaPercent: number
  usageMB: number
  totalMB: number
  calculationCount?: number
}

export function StorageWarningBanner({
  quotaPercent,
  usageMB,
  totalMB,
  calculationCount,
}: StorageWarningBannerProps) {
  // Only show warning if >80% quota used
  if (quotaPercent < 80) {
    return null
  }

  const isNearLimit = quotaPercent > 95

  return (
    <Alert
      variant={isNearLimit ? 'destructive' : 'default'}
      className={isNearLimit ? '' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}
    >
      <AlertTriangle className={isNearLimit ? 'h-4 w-4' : 'h-4 w-4 text-yellow-600'} />
      <AlertTitle className={isNearLimit ? '' : 'text-yellow-800 dark:text-yellow-200'}>
        {isNearLimit ? 'Storage Limit Reached' : 'Storage Nearly Full'}
      </AlertTitle>
      <AlertDescription className={isNearLimit ? '' : 'text-yellow-700 dark:text-yellow-300'}>
        <p className="mb-3">
          You are using {quotaPercent.toFixed(1)}% of your browser storage (
          {usageMB.toFixed(1)} MB / {totalMB.toFixed(1)} MB).
          {calculationCount && ` You have ${calculationCount} saved calculations.`}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="sm" variant={isNearLimit ? 'default' : 'secondary'}>
            <Link href="/sign-up">
              Create Account to Save to Database
            </Link>
          </Button>
          <Button size="sm" variant="outline">
            Clear Old Calculations
          </Button>
        </div>
        <p className="mt-3 text-xs">
          Registering an account moves your calculations to secure cloud storage with unlimited capacity.
        </p>
      </AlertDescription>
    </Alert>
  )
}
