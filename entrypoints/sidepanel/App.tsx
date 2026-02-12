import { useCallback, useEffect, useRef, useState } from 'react'
import { Bug, LoaderCircle, RefreshCw, Send, TableProperties } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { MentionInput } from '@/entrypoints/sidepanel/components/MentionInput'
import { serializeContext } from '@/lib/context-serializer'
import { parser } from '@/lib/parser'
import { getItem, saveItem, sendMessage } from '@/lib/utils'

import type { MentionInputHandle } from '@/entrypoints/sidepanel/components/MentionInput'
import type {
  ContextEntity,
  ContextType,
  LLMProvider,
  ResolvedContext,
  SpreadsheetMetadata,
} from '@/lib/types'

const contextTypeLabel: Record<ContextType, string> = {
  sheet: 'Sheet',
  namedRange: 'Range',
  table: 'Table',
}

export default function App() {
  const mentionInputRef = useRef<MentionInputHandle>(null)
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<SpreadsheetMetadata | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [provider, setProvider] = useState<LLMProvider>('anthropic')
  const [dryRun, setDryRun] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getItem('local:LLM_PROVIDER')
      .then((saved) => {
        if (saved === 'anthropic' || saved === 'openai') setProvider(saved)
      })
      .catch(() => {})
  }, [])

  const reconnect = useCallback(() => {
    setError(null)
    setSpreadsheetId(null)
    setMetadata(null)
    sendMessage<string>({ type: 'GET_ACTIVE_SPREADSHEET' })
      .then(setSpreadsheetId)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(reconnect, [])

  const fetchMetadata = useCallback(
    async (id: string) => {
      setRefreshing(true)
      setError(null)
      try {
        const data = await sendMessage<SpreadsheetMetadata>({
          type: 'GET_SHEET_METADATA',
          spreadsheetId: id,
        })
        setMetadata(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metadata')
      } finally {
        setRefreshing(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!spreadsheetId) return
    fetchMetadata(spreadsheetId)
  }, [spreadsheetId, fetchMetadata])

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

  const toggleProvider = () => {
    const next: LLMProvider = provider === 'anthropic' ? 'openai' : 'anthropic'
    setProvider(next)
    saveItem('LLM_PROVIDER', next)
  }

  const handleSubmit = async (plainText: string) => {
    if (!metadata || !spreadsheetId) return

    setLoading(true)
    setError(null)
    setResponse(null)

    const contexts = parser(plainText, metadata)

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

      const xml = serializeContext(resolved, metadata)

      if (dryRun) {
        setResponse(`--- DRY RUN (${provider}) ---\n\n` +
          `== Question ==\n${plainText}\n\n` +
          `== Context XML ==\n${xml}`)
      } else {
        const result = await sendMessage<string>({
          type: provider === 'anthropic' ? 'QUERY_ANTHROPIC' : 'QUERY_OPENAI',
          question: plainText,
          context: xml,
        })
        setResponse(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const isConnected = !!spreadsheetId && !!metadata
  const isLoadingMetadata = !!spreadsheetId && !metadata && !error && !refreshing

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-coral/10">
              <TableProperties className="size-4 text-coral" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold leading-tight">
                {metadata?.title ?? 'Sheets'}
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
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => spreadsheetId && fetchMetadata(spreadsheetId)}
            disabled={!spreadsheetId || refreshing}
            title="Refresh metadata"
          >
            <RefreshCw
              className={`size-3.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </header>

      {/* Context chips */}
      {availableContexts.length > 0 && (
        <div className="shrink-0 border-b border-border px-4 py-2.5">
          <div className="flex flex-wrap gap-1.5">
            {availableContexts.map((ctx) => (
              <span
                key={`${ctx.type}-${ctx.label}`}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                <span className="text-muted-foreground">
                  {contextTypeLabel[ctx.type]}
                </span>
                {ctx.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Response area */}
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
            <Button size="lg" className="mt-4" onClick={reconnect}>
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
              Use <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[10px] font-mono">@</kbd> to reference sheets, tables, or named ranges
            </p>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <MentionInput
              ref={mentionInputRef}
              availableContexts={availableContexts}
              onSubmit={handleSubmit}
              disabled={!metadata || loading}
              placeholder={
                metadata
                  ? 'Ask about your spreadsheet...'
                  : 'Open a Google Sheet to start'
              }
            />
          </div>
          <button
            onClick={() => setDryRun(!dryRun)}
            className={`shrink-0 rounded-md border px-1.5 py-1.5 transition-colors ${dryRun ? 'border-amber-400/50 bg-amber-500/10 text-amber-600' : 'border-border text-muted-foreground hover:bg-secondary'}`}
            title={dryRun ? 'Dry run ON — click to send to API' : 'Dry run OFF — click to preview payload'}
          >
            <Bug className="size-3.5" />
          </button>
          <button
            onClick={toggleProvider}
            className="shrink-0 rounded-md border border-border px-2 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
            title={`Using ${provider === 'anthropic' ? 'Claude' : 'GPT'} — click to switch`}
          >
            {provider === 'anthropic' ? 'Claude' : 'GPT'}
          </button>
          <Button
            onClick={() => mentionInputRef.current?.submit()}
            disabled={!metadata || loading}
            size="icon-sm"
            className="shrink-0 rounded-lg"
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
