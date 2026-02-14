import { Button } from '@/components/ui/button'

interface ResponseAreaProps {
  error: string | null
  response: string | null
  isConnected: boolean
  isLoadingMetadata: boolean
  onReconnect: () => void
}

export function ResponseArea({
  error,
  response,
  isConnected,
  isLoadingMetadata,
  onReconnect,
}: ResponseAreaProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {response && (
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">
          {response}
        </pre>
      )}

      {!response && !isConnected && !isLoadingMetadata && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">
            Not connected to a spreadsheet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Navigate to a Google Sheet, then reconnect
          </p>
          <Button size="lg" className="mt-4" onClick={onReconnect}>
            Reconnect
          </Button>
        </div>
      )}

      {!response && !error && isConnected && (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">
            Ask a question about your spreadsheet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Use{' '}
            <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[10px] font-mono">
              @
            </kbd>{' '}
            to reference sheets, tables, or named ranges
          </p>
        </div>
      )}
    </div>
  )
}
