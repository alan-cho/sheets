import { useCallback, useEffect, useRef, useState } from 'react'
import { storage } from '@wxt-dev/storage'

import { ChatInput } from '@/entrypoints/sidepanel/components/ChatInput'
import { ContextChips } from '@/entrypoints/sidepanel/components/ContextChips'
import { ResponseArea } from '@/entrypoints/sidepanel/components/ResponseArea'
import { StatusHeader } from '@/entrypoints/sidepanel/components/StatusHeader'
import { serializeContext } from '@/lib/context-serializer'
import { DEFAULT_MODEL_ID, getModelOption } from '@/lib/models'
import { parser } from '@/lib/parser'
import { getItem, saveItem, sendMessage } from '@/lib/utils'

import type { MentionInputHandle } from '@/entrypoints/sidepanel/components/MentionInput'
import type {
  ContextEntity,
  ContextType,
  ResolvedContext,
  SpreadsheetMetadata,
} from '@/lib/types'

export default function App() {
  const mentionInputRef = useRef<MentionInputHandle>(null)
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<SpreadsheetMetadata | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID)
  const [debug, setDebug] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getItem('SELECTED_MODEL')
      .then((saved) => {
        if (getModelOption(saved)) setSelectedModel(saved)
      })
      .catch(() => {})
    getItem('DEBUG_MODE')
      .then((saved) => setDebug(saved === 'true'))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const unwatch = storage.watch<string>('local:DEBUG_MODE', (newValue) => {
      setDebug(newValue === 'true')
    })
    return () => unwatch()
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

  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'sidepanel' })
    port.onMessage.addListener((msg) => {
      if (msg.type === 'SPREADSHEET_CHANGED') {
        setError(null)
        setSpreadsheetId(msg.spreadsheetId)
      } else if (msg.type === 'SPREADSHEET_DISCONNECTED') {
        setSpreadsheetId(null)
        setMetadata(null)
      }
    })
    return () => port.disconnect()
  }, [])

  const fetchMetadata = useCallback(async (id: string) => {
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
  }, [])

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

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    saveItem('SELECTED_MODEL', modelId)
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

      if (debug) {
        const modelLabel = getModelOption(selectedModel)?.label ?? selectedModel
        setResponse(
          `--- DRY RUN (${modelLabel}) ---\n\n` +
            `== Question ==\n${plainText}\n\n` +
            `== Context XML ==\n${xml}`,
        )
      } else {
        const result = await sendMessage<string>({
          type: 'QUERY_LLM',
          model: selectedModel,
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
  const isLoadingMetadata =
    !!spreadsheetId && !metadata && !error && !refreshing

  return (
    <div className="flex h-screen flex-col">
      <StatusHeader
        title={metadata?.title}
        isLoadingMetadata={isLoadingMetadata}
        isConnected={isConnected}
        debug={debug}
        refreshing={refreshing}
        onRefresh={() => spreadsheetId && fetchMetadata(spreadsheetId)}
        canRefresh={!!spreadsheetId}
      />

      {debug && availableContexts.length > 0 && (
        <ContextChips contexts={availableContexts} />
      )}

      <ResponseArea
        error={error}
        response={response}
        loading={loading}
        isConnected={isConnected}
        isLoadingMetadata={isLoadingMetadata}
        onReconnect={reconnect}
      />

      <ChatInput
        mentionInputRef={mentionInputRef}
        availableContexts={availableContexts}
        onSubmit={handleSubmit}
        disabled={!metadata || loading}
        loading={loading}
        placeholder={
          metadata
            ? 'Ask about your spreadsheet...'
            : 'Open a Google Sheet to start'
        }
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />
    </div>
  )
}
