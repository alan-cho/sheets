import { useEffect, useImperativeHandle, useRef } from 'react'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import {
  $getRoot,
  CLEAR_EDITOR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
} from 'lexical'

import { MentionNode } from '@/entrypoints/sidepanel/components/MentionInput/MentionNode'
import { MentionPlugin } from '@/entrypoints/sidepanel/components/MentionInput/MentionPlugin'
import { mentionInputTheme } from '@/entrypoints/sidepanel/components/MentionInput/theme'

import type { ContextType } from '@/lib/types'

interface AvailableContext {
  label: string
  type: ContextType
}

export interface MentionInputHandle {
  submit: () => void
}

interface MentionInputProps {
  availableContexts: AvailableContext[]
  onSubmit: (plainText: string) => void
  disabled?: boolean
  placeholder?: string
  ref?: React.Ref<MentionInputHandle>
}

function SubmitPlugin({
  onSubmit,
  disabled,
  onRegister,
}: {
  onSubmit: (text: string) => void
  disabled?: boolean
  onRegister: (submit: () => void) => void
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const submit = () => {
      editor.getEditorState().read(() => {
        const text = $getRoot().getTextContent().trim()
        if (!text) return

        onSubmit(text)
        editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
      })
    }

    onRegister(submit)
  }, [editor, onSubmit, onRegister])

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
  placeholder,
  ref,
}: MentionInputProps) {
  const initialConfig = {
    namespace: 'MentionInput',
    theme: mentionInputTheme,
    nodes: [MentionNode],
    onError: (error: Error) => console.error(error),
    editable: !disabled,
  }

  const submitRef = useRef(() => {})

  useImperativeHandle(ref, () => ({
    submit: () => submitRef.current(),
  }))

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className="relative flex w-full bg-transparent px-3 py-2 text-sm data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
        data-mention-input
        data-disabled={disabled}
      >
        <PlainTextPlugin
          contentEditable={
            <ContentEditable className="min-h-14 w-full outline-none [&_.mention-input-paragraph]:m-0" />
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
        <SubmitPlugin
          onSubmit={onSubmit}
          disabled={disabled}
          onRegister={(fn) => {
            submitRef.current = fn
          }}
        />
        <DisabledPlugin disabled={disabled} />
      </div>
    </LexicalComposer>
  )
}

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
