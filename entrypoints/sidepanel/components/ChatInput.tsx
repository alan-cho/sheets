import { LoaderCircle, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MentionInput } from '@/entrypoints/sidepanel/components/MentionInput'
import { MODEL_OPTIONS } from '@/lib/models'

import type { RefObject } from 'react'
import type { MentionInputHandle } from '@/entrypoints/sidepanel/components/MentionInput'
import type { ContextType } from '@/lib/types'

interface ChatInputProps {
  mentionInputRef: RefObject<MentionInputHandle | null>
  availableContexts: { label: string; type: ContextType }[]
  onSubmit: (plainText: string) => void
  disabled: boolean
  loading: boolean
  placeholder: string
  selectedModel: string
  onModelChange: (modelId: string) => void
}

export function ChatInput({
  mentionInputRef,
  availableContexts,
  onSubmit,
  disabled,
  loading,
  placeholder,
  selectedModel,
  onModelChange,
}: ChatInputProps) {
  return (
    <div className="shrink-0 border-t border-border px-4 py-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <MentionInput
            ref={mentionInputRef}
            availableContexts={availableContexts}
            onSubmit={onSubmit}
            disabled={disabled}
            placeholder={placeholder}
          />
        </div>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="h-8 w-auto shrink-0 gap-1 rounded-lg border-border px-2 text-[11px] font-medium text-muted-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="min-w-45">
            <SelectGroup>
              <SelectLabel>Anthropic</SelectLabel>
              {MODEL_OPTIONS.filter((m) => m.provider === 'anthropic').map(
                (m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ),
              )}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>OpenAI</SelectLabel>
              {MODEL_OPTIONS.filter((m) => m.provider === 'openai').map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          onClick={() => mentionInputRef.current?.submit()}
          disabled={disabled}
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
  )
}
