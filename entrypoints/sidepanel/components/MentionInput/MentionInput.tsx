import { useEffect } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import {
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_HIGH,
  CLEAR_EDITOR_COMMAND,
  $getRoot,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { MentionNode } from './MentionNode'
import { MentionPlugin } from './MentionPlugin'
import { mentionInputTheme } from './theme'
import type { ContextType } from '@/lib/types'

interface AvailableContext {
  label: string
  type: ContextType
}

interface MentionInputProps {
  availableContexts: AvailableContext[]
  onSubmit: (plainText: string) => void
  disabled?: boolean
  placeholder?: string
}

function SubmitPlugin({
  onSubmit,
  disabled,
}: {
  onSubmit: (text: string) => void
  disabled?: boolean
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (disabled) return false
        if (event?.shiftKey) return false

        event?.preventDefault()

        editor.getEditorState().read(() => {
          const text = $getRoot().getTextContent().trim()
          if (!text) return

          onSubmit(text)
          editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
        })

        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor, onSubmit, disabled])

  return null
}

function DisabledPlugin({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.setEditable(!disabled)
  }, [editor, disabled])

  return null
}

export function MentionInput({
  availableContexts,
  onSubmit,
  disabled = false,
  placeholder = 'Type @SheetName, @TableName, or @NamedRange...',
}: MentionInputProps) {
  const initialConfig = {
    namespace: 'MentionInput',
    theme: mentionInputTheme,
    nodes: [MentionNode],
    onError: (error: Error) => console.error(error),
    editable: !disabled,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className="border-input focus-within:border-ring focus-within:ring-ring/50 relative flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] focus-within:ring-[3px] [&[data-disabled=true]]:cursor-not-allowed [&[data-disabled=true]]:opacity-50"
        data-mention-input
        data-disabled={disabled}
      >
        <PlainTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-5 w-full outline-none [&_.mention-input-paragraph]:m-0"
            />
          }
          placeholder={
            <div className="text-muted-foreground pointer-events-none absolute left-3 top-2 text-sm">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <MentionPlugin availableContexts={availableContexts} />
        <HistoryPlugin />
        <ClearEditorPlugin />
        <SubmitPlugin onSubmit={onSubmit} disabled={disabled} />
        <DisabledPlugin disabled={disabled} />
      </div>
    </LexicalComposer>
  )
}

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
