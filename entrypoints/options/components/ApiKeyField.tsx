import { useEffect, useState } from 'react'
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getItem, saveItem } from '@/lib/utils'

type KeyStatus = 'loading' | 'empty' | 'saved'

export interface ApiKeyFieldProps {
  label: string
  description: string
  storageKey: string
}

export function ApiKeyField({
  label,
  description,
  storageKey,
}: ApiKeyFieldProps) {
  const [status, setStatus] = useState<KeyStatus>('loading')
  const [revealed, setRevealed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savedKey, setSavedKey] = useState('')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getItem(storageKey)
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
      <div className="flex items-start justify-between gap-4 bg-lavender/20 p-4">
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
          <Button size="sm" className="bg-coral text-white hover:bg-coral/90" onClick={startEditing}>
            <KeyRound className="size-3.5" />
            Add API key
          </Button>
        )}
      </div>
    </div>
  )
}
