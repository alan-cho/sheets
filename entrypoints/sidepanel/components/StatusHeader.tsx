import { Bug, LoaderCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface StatusHeaderProps {
  title: string | undefined
  isLoadingMetadata: boolean
  isConnected: boolean
  debug: boolean
  refreshing: boolean
  onRefresh: () => void
  canRefresh: boolean
}

export function StatusHeader({
  title,
  isLoadingMetadata,
  isConnected,
  debug,
  refreshing,
  onRefresh,
  canRefresh,
}: StatusHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-tight">
              {title ?? 'Sheets'}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isLoadingMetadata ? (
                <>
                  <LoaderCircle className="size-3 animate-spin" />
                  Loading...
                </>
              ) : isConnected ? (
                <>
                  <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                  Connected
                </>
              ) : (
                <>
                  <span className="inline-block size-1.5 rounded-full bg-muted-foreground/50" />
                  Not connected
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {debug && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
              <Bug className="size-3" />
              Debug
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onRefresh}
            disabled={!canRefresh || refreshing}
            title="Refresh metadata"
          >
            <RefreshCw
              className={`size-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>
    </header>
  )
}
