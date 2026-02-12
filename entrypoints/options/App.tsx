import { useEffect, useState } from 'react'
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Pencil,
  TableProperties,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getItem, saveItem } from '@/lib/utils'

type KeyStatus = 'loading' | 'empty' | 'saved'

interface ApiKeyFieldProps {
  label: string
  description: string
  storageKey: string
}

function ApiKeyField({ label, description, storageKey }: ApiKeyFieldProps) {
  const [status, setStatus] = useState<KeyStatus>('loading')
  const [revealed, setRevealed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savedKey, setSavedKey] = useState('')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getItem(`local:${storageKey}`)
      .then((key) => {
        setSavedKey(key)
        setStatus('saved')
      })
      .catch(() => {
        setStatus('empty')
      })
  }, [storageKey])

  const maskedKey = savedKey
    ? `${savedKey.slice(0, 8)}${'*'.repeat(Math.max(0, savedKey.length - 12))}${savedKey.slice(-4)}`
    : ''

  const handleSave = async () => {
    if (!draft.trim()) return
    setSaving(true)
    const success = await saveItem(storageKey, draft.trim())
    if (success) {
      setSavedKey(draft.trim())
      setStatus('saved')
      setEditing(false)
      setDraft('')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setSaving(true)
    const success = await saveItem(storageKey, '')
    if (success) {
      setSavedKey('')
      setStatus('empty')
      setEditing(false)
      setDraft('')
      setRevealed(false)
    }
    setSaving(false)
  }

  const startEditing = () => {
    setDraft('')
    setEditing(true)
    setRevealed(false)
  }

  const cancelEditing = () => {
    setEditing(false)
    setDraft('')
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{label}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {status === 'saved' && savedKey && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
            <Check className="size-3" />
            Active
          </span>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        {status === 'loading' ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Loading...
          </div>
        ) : editing ? (
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              placeholder={`Enter your ${label.toLowerCase()}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') cancelEditing()
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!draft.trim() || saving}
              >
                {saving ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEditing}>
                <X className="size-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        ) : status === 'saved' && savedKey ? (
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md bg-secondary px-2.5 py-1.5 font-mono text-xs">
              {revealed ? savedKey : maskedKey}
            </code>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setRevealed(!revealed)}
              title={revealed ? 'Hide key' : 'Reveal key'}
            >
              {revealed ? (
                <EyeOff className="size-3.5 text-muted-foreground" />
              ) : (
                <Eye className="size-3.5 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={startEditing}
              title="Update key"
            >
              <Pencil className="size-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleDelete}
              title="Remove key"
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={startEditing}>
            <KeyRound className="size-3.5" />
            Add API key
          </Button>
        )}
      </div>
    </div>
  )
}

function GoogleAuthSection() {
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
      <div className="flex items-start justify-between gap-4 p-4">
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
          variant={status === 'connected' ? 'secondary' : 'outline'}
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

export default function App() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-coral/10">
          <TableProperties className="size-5 text-coral" />
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure API keys and connections
          </p>
        </div>
      </div>

      {/* API Keys */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          API Keys
        </h2>
        <div className="flex flex-col gap-3">
          <ApiKeyField
            label="Anthropic API Key"
            description="Used for Claude-powered responses"
            storageKey="ANTHROPIC_API_KEY"
          />
          <ApiKeyField
            label="OpenAI API Key"
            description="Used for GPT-powered responses"
            storageKey="OPENAI_API_KEY"
          />
        </div>
      </section>

      {/* Connections */}
      <section className="mt-8">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Connections
        </h2>
        <GoogleAuthSection />
      </section>
    </div>
  )
}
