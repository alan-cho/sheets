import { useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function GoogleAuthSection() {
  const [status, setStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'error'
  >('idle')
  const [error, setError] = useState<string | null>(null)

  const connect = () => {
    setStatus('connecting')
    setError(null)
    chrome.runtime.sendMessage({ type: 'AUTHENTICATE_GOOGLE' }, (res) => {
      if (res?.success) {
        setStatus('connected')
      } else {
        setStatus('error')
        setError(res?.error ?? 'Unknown error')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4 bg-lavender/20 p-4">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">Google Sheets</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Connect your Google account to read spreadsheet data
          </p>
        </div>
        {status === 'connected' && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
            <Check className="size-3" />
            Connected
          </span>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        {error && (
          <p className="mb-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <Button
          size="sm"
          variant={status === 'connected' ? 'secondary' : 'default'}
          className={status !== 'connected' ? 'bg-coral text-white hover:bg-coral/90' : ''}
          onClick={connect}
          disabled={status === 'connecting'}
        >
          {status === 'connecting' && (
            <LoaderCircle className="size-3.5 animate-spin" />
          )}
          {status === 'connected' ? 'Reconnect' : 'Connect Google Account'}
        </Button>
      </div>
    </div>
  )
}
