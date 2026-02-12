import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { parser } from '@/lib/parser'
import { sendMessage } from '@/lib/utils'
import { MentionInput } from './components/MentionInput'

import type {
  SpreadsheetMetadata,
  ContextType,
  ContextEntity,
  ResolvedContext,
} from '@/lib/types'

export default function App() {
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<SpreadsheetMetadata | null>(null)

  const [results, setResults] = useState<ResolvedContext[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    sendMessage<string>({ type: 'GET_ACTIVE_SPREADSHEET' })
      .then(setSpreadsheetId)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!spreadsheetId) return
    sendMessage<SpreadsheetMetadata>({
      type: 'GET_SHEET_METADATA',
      spreadsheetId,
    })
      .then(setMetadata)
      .catch((err) => setError(err.message))
  }, [spreadsheetId])

  const availableContexts = metadata
    ? [
        ...metadata.sheets.map((s) => ({
          label: s.title,
          type: 'sheet' as ContextType,
        })),
        ...metadata.namedRanges.map((nr) => ({
          label: nr.name,
          type: 'namedRange' as ContextType,
        })),
        ...metadata.tables.map((t) => ({
          label: t.name,
          type: 'table' as ContextType,
        })),
      ]
    : []

  const handleSubmit = async (plainText: string) => {
    if (!metadata || !spreadsheetId) return

    setLoading(true)
    setError(null)
    setResults([])

    const contexts = parser(plainText, metadata)

    if (contexts.length === 0) {
      setError('No matching @references found')
      setLoading(false)
      return
    }

    try {
      const resolved = await Promise.all(
        contexts.map(async (c: ContextEntity): Promise<ResolvedContext> => {
          const data = await sendMessage<string[][]>({
            type: 'GET_RANGE_DATA',
            spreadsheetId,
            range: c.range,
          })
          return { ...c, data }
        }),
      )
      setResults(resolved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col p-3 gap-3">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-sm font-semibold">{metadata?.title ?? 'Sheets'}</h1>
        {!spreadsheetId && (
          <p className="text-xs text-muted-foreground">Not on a Google Sheet</p>
        )}
        {spreadsheetId && !metadata && !error && (
          <p className="text-xs text-muted-foreground">Loading metadata...</p>
        )}
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {results.map((c) => (
          <div key={c.name} className="mb-3">
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              @{c.name}{' '}
              <span className="text-muted-foreground/60">({c.type})</span>
            </div>
            <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">
              {c.data.map((row) => row.join('\t')).join('\n')}
            </pre>
          </div>
        ))}

        {error && (
          <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 flex flex-col gap-2">
        <MentionInput
          availableContexts={availableContexts}
          onSubmit={handleSubmit}
          disabled={!metadata || loading}
          placeholder={
            metadata
              ? 'Type @SheetName, @TableName, or @NamedRange...'
              : 'Open a Google Sheet to start'
          }
        />
        <Button
          onClick={() => {/* Submit is handled by Enter in MentionInput */}}
          disabled={!metadata || loading}
          size="sm"
          className="w-full"
        >
          {loading ? 'Fetching...' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
