import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getItem, saveItem } from '@/lib/utils'

export function DebugToggleSection() {
  const [enabled, setEnabled] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getItem('DEBUG_MODE')
      .then((val) => setEnabled(val === 'true'))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    saveItem('DEBUG_MODE', next ? 'true' : 'false')
  }

  if (!loaded) return null

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">Debug Mode</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dry-run queries to preview context XML without calling the API
          </p>
        </div>
        {enabled && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
            <Check className="size-3" />
            Active
          </span>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <Button
          size="sm"
          variant={enabled ? 'secondary' : 'outline'}
          onClick={toggle}
        >
          {enabled ? 'Disable' : 'Enable'} Debug Mode
        </Button>
      </div>
    </div>
  )
}
