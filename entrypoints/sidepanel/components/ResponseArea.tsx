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
      {response && (
        <pre className="whitespace-pre-wrap text-sm">{response}</pre>
      )}

      {!response && !isConnected && !isLoadingMetadata && (
        <div className="flex h-full flex-col items-center justify-center text-center font-serif">
          <p className="text-muted-foreground text-xl">
            Navigate to a Google Sheet
          </p>
          <Button size="sm" className="mt-2 font-sans" onClick={onReconnect}>
            Reconnect
          </Button>
        </div>
      )}

      {!response && !error && isConnected && (
        <div className="flex h-full flex-col items-center justify-center text-center font-serif">
          <p className="text-xl text-muted-foreground">
            Ask a question about your spreadsheet
          </p>
          <p className="mt-1 text-lg text-muted-foreground/60">
            Use{' '}
            <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[12px] font-mono">
              @
            </kbd>{' '}
            to reference sheets, tables, or named ranges
          </p>
        </div>
      )}
    </div>
  )
}
