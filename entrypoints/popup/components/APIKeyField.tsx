import { useEffect, useReducer } from 'react'
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

type State = {
  status: 'loading' | 'empty' | 'saved'
  savedKey: string
  draft: string
  revealed: boolean
  editing: boolean
  saving: boolean
}

type Action =
  | { type: 'LOADED'; key: string }
  | { type: 'LOAD_FAILED' }
  | { type: 'DRAFT_CHANGED'; value: string }
  | { type: 'EDIT_STARTED' }
  | { type: 'EDIT_ENDED' }
  | { type: 'SAVE_STARTED' }
  | { type: 'SAVE_SUCCEEDED'; key: string }
  | { type: 'SAVE_FINISHED' }
  | { type: 'DELETE_SUCCEEDED' }
  | { type: 'TOGGLE_REVEALED' }

const initialState: State = {
  status: 'loading',
  savedKey: '',
  draft: '',
  revealed: false,
  editing: false,
  saving: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADED':
      return { ...state, status: 'saved', savedKey: action.key }
    case 'LOAD_FAILED':
      return { ...state, status: 'empty' }
    case 'DRAFT_CHANGED':
      return { ...state, draft: action.value }
    case 'EDIT_STARTED':
      return { ...state, editing: true, draft: '', revealed: false }
    case 'EDIT_ENDED':
      return { ...state, editing: false, draft: '' }
    case 'SAVE_STARTED':
      return { ...state, saving: true }
    case 'SAVE_SUCCEEDED':
      return {
        ...state,
        savedKey: action.key,
        status: 'saved',
        saving: false,
        editing: false,
        draft: '',
      }
    case 'SAVE_FINISHED':
      return { ...state, saving: false }
    case 'DELETE_SUCCEEDED':
      return {
        ...state,
        savedKey: '',
        status: 'empty',
        editing: false,
        draft: '',
        revealed: false,
        saving: false,
      }
    case 'TOGGLE_REVEALED':
      return { ...state, revealed: !state.revealed }
  }
}

export interface APIKeyFieldProps {
  label: string
  description: string
  storageKey: string
}

export function APIKeyField({
  label,
  description,
  storageKey,
}: APIKeyFieldProps) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { status, savedKey, draft, revealed, editing, saving } = state

  useEffect(() => {
    getItem(storageKey)
      .then((key) => dispatch({ type: 'LOADED', key }))
      .catch(() => dispatch({ type: 'LOAD_FAILED' }))
  }, [storageKey])

  const maskedKey = savedKey
    ? `${savedKey.slice(0, 8)}${'*'.repeat(Math.max(0, savedKey.length - 12))}${savedKey.slice(-4)}`
    : ''

  const handleSave = async () => {
    if (!draft.trim()) return
    dispatch({ type: 'SAVE_STARTED' })
    const success = await saveItem(storageKey, draft.trim())
    if (success) {
      dispatch({ type: 'SAVE_SUCCEEDED', key: draft.trim() })
    } else {
      dispatch({ type: 'SAVE_FINISHED' })
    }
  }

  const handleDelete = async () => {
    dispatch({ type: 'SAVE_STARTED' })
    const success = await saveItem(storageKey, '')
    if (success) {
      dispatch({ type: 'DELETE_SUCCEEDED' })
    } else {
      dispatch({ type: 'SAVE_FINISHED' })
    }
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
              onChange={(e) =>
                dispatch({ type: 'DRAFT_CHANGED', value: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') dispatch({ type: 'EDIT_ENDED' })
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dispatch({ type: 'EDIT_ENDED' })}
              >
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
              onClick={() => dispatch({ type: 'TOGGLE_REVEALED' })}
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
              onClick={() => dispatch({ type: 'EDIT_STARTED' })}
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
          <Button
            size="sm"
            className="bg-coral text-white hover:bg-coral/90"
            onClick={() => dispatch({ type: 'EDIT_STARTED' })}
          >
            <KeyRound className="size-3.5" />
            Add API key
          </Button>
        )}
      </div>
    </div>
  )
}
