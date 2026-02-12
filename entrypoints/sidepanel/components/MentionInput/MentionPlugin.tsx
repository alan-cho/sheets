import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createTextNode,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from 'lexical'

import {
  $createMentionNode,
  $isMentionNode,
} from '@/entrypoints/sidepanel/components/MentionInput/MentionNode'

import type { ContextType } from '@/lib/types'

interface AvailableContext {
  label: string
  type: ContextType
}

interface MentionPluginProps {
  availableContexts: AvailableContext[]
}

interface GhostState {
  query: string
  completion: string
  matchLabel: string
  matchType: ContextType
}

export function MentionPlugin({ availableContexts }: MentionPluginProps) {
  const [editor] = useLexicalComposerContext()
  const ghostRef = useRef<GhostState | null>(null)
  const ghostElRef = useRef<HTMLSpanElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const findMatch = useCallback(
    (query: string): GhostState | null => {
      if (!query) return null
      const lower = query.toLowerCase()
      for (const ctx of availableContexts) {
        if (
          ctx.label.toLowerCase().startsWith(lower) &&
          ctx.label.toLowerCase() !== lower
        ) {
          return {
            query,
            completion: ctx.label.slice(query.length),
            matchLabel: ctx.label,
            matchType: ctx.type,
          }
        }
      }
      return null
    },
    [availableContexts],
  )

  const findExactMatch = useCallback(
    (query: string): AvailableContext | null => {
      if (!query) return null
      const lower = query.toLowerCase()
      return (
        availableContexts.find((ctx) => ctx.label.toLowerCase() === lower) ??
        null
      )
    },
    [availableContexts],
  )

  const updateGhostPosition = useCallback(() => {
    const ghostEl = ghostElRef.current
    if (!ghostEl) return

    const rootElement = editor.getRootElement()
    if (!rootElement) return

    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) {
      ghostEl.style.display = 'none'
      return
    }

    const range = domSelection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const rootRect =
      rootElement.closest('[data-mention-input]')?.getBoundingClientRect() ??
      rootElement.parentElement?.getBoundingClientRect()

    if (!rootRect || (rect.width === 0 && rect.height === 0)) {
      ghostEl.style.display = 'none'
      return
    }

    ghostEl.style.display = ''
    ghostEl.style.position = 'absolute'
    ghostEl.style.top = `${rect.top - rootRect.top}px`
    ghostEl.style.left = `${rect.right - rootRect.left}px`
    ghostEl.style.pointerEvents = 'none'
    ghostEl.style.color = 'var(--muted-foreground)'
    ghostEl.style.opacity = '0.4'
    ghostEl.style.fontSize = '0.875rem'
    ghostEl.style.lineHeight = `${rect.height}px`
    ghostEl.style.whiteSpace = 'pre'
  }, [editor])

  // Detect @query before cursor on every update
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, tags }) => {
      // Skip updates we triggered ourselves to avoid infinite loops
      if (tags.has('mention-convert')) return

      editorState.read(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          ghostRef.current = null
          updateGhostDOM()
          return
        }

        const anchor = selection.anchor
        if (anchor.type !== 'text') {
          ghostRef.current = null
          updateGhostDOM()
          return
        }

        const node = anchor.getNode()
        if (!$isTextNode(node)) {
          ghostRef.current = null
          updateGhostDOM()
          return
        }

        const text = node.getTextContent()
        const offset = anchor.offset
        const textBeforeCursor = text.slice(0, offset)

        // Check for exact match followed by space: `@Sheet2 `
        const exactMatch = textBeforeCursor.match(/@(\w+)\s$/)
        if (exactMatch) {
          const match = findExactMatch(exactMatch[1])
          if (match) {
            const nodeKey = node.getKey()
            const matchStart = offset - exactMatch[0].length
            ghostRef.current = null
            updateGhostDOM()
            // Schedule conversion outside of read
            convertMention(nodeKey, matchStart, offset, match.label, match.type)
            return
          }
        }

        // Otherwise check for partial match for ghost text
        const atMatch = textBeforeCursor.match(/@(\w*)$/)
        if (!atMatch) {
          ghostRef.current = null
          updateGhostDOM()
          return
        }

        ghostRef.current = findMatch(atMatch[1])
        updateGhostDOM()
      })
    })

    function convertMention(
      nodeKey: string,
      matchStart: number,
      matchEnd: number,
      label: string,
      type: ContextType,
    ) {
      editor.update(
        () => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) return

          const node = selection.anchor.getNode()
          if (!$isTextNode(node) || node.getKey() !== nodeKey) return

          const text = node.getTextContent()
          const textBefore = text.slice(0, matchStart)
          const textAfter = text.slice(matchEnd)

          const mentionNode = $createMentionNode(label, type)

          if (textBefore) {
            node.setTextContent(textBefore)
            node.insertAfter(mentionNode)
          } else {
            node.replace(mentionNode)
          }

          const trailingNode = $createTextNode(textAfter || ' ')
          mentionNode.insertAfter(trailingNode)
          trailingNode.select(textAfter ? 0 : 1, textAfter ? 0 : 1)
        },
        { tag: 'mention-convert' },
      )
    }

    function updateGhostDOM() {
      const ghostEl = ghostElRef.current
      if (!ghostEl) return
      const ghost = ghostRef.current
      if (!ghost) {
        ghostEl.style.display = 'none'
        ghostEl.textContent = ''
      } else {
        ghostEl.textContent = ghost.completion
        // Position will be updated in rAF after DOM settles
        requestAnimationFrame(() => updateGhostPosition())
      }
    }
  }, [editor, findMatch, findExactMatch, updateGhostPosition])

  // Tab: accept ghost completion
  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        const currentGhost = ghostRef.current
        if (!currentGhost) return false

        event?.preventDefault()

        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return

          const anchor = selection.anchor
          if (anchor.type !== 'text') return

          const node = anchor.getNode()
          if (!$isTextNode(node)) return

          const text = node.getTextContent()
          const offset = anchor.offset
          const textBeforeCursor = text.slice(0, offset)

          const atMatch = textBeforeCursor.match(/@(\w*)$/)
          if (!atMatch) return

          const atStart = offset - atMatch[0].length
          const textBefore = text.slice(0, atStart)
          const textAfter = text.slice(offset)

          const mentionNode = $createMentionNode(
            currentGhost.matchLabel,
            currentGhost.matchType,
          )

          if (textBefore) {
            node.setTextContent(textBefore)
            node.insertAfter(mentionNode)
          } else {
            node.replace(mentionNode)
          }

          const trailingNode = $createTextNode(textAfter ? textAfter : ' ')
          mentionNode.insertAfter(trailingNode)

          if (textAfter) {
            trailingNode.select(0, 0)
          } else {
            trailingNode.select(1, 1)
          }
        })

        ghostRef.current = null
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor])

  // Escape: dismiss ghost
  useEffect(() => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        if (!ghostRef.current) return false
        ghostRef.current = null
        const ghostEl = ghostElRef.current
        if (ghostEl) {
          ghostEl.style.display = 'none'
          ghostEl.textContent = ''
        }
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor])

  // Backspace: select mention node first, then delete on second press
  useEffect(() => {
    const handleDelete = (event: KeyboardEvent | null, isBackward: boolean) => {
      const selection = $getSelection()

      // If a mention node is already selected (node selection), delete it
      if ($isNodeSelection(selection)) {
        const nodes = selection.getNodes()
        if (nodes.length === 1 && $isMentionNode(nodes[0])) {
          event?.preventDefault()
          nodes[0].remove()
          return true
        }
      }

      if (!$isRangeSelection(selection) || !selection.isCollapsed())
        return false

      const anchor = selection.anchor
      if (anchor.type !== 'text') return false

      const anchorNode = anchor.getNode()
      if (!$isTextNode(anchorNode)) return false

      if (isBackward && anchor.offset === 0) {
        // Cursor at start of text node — check previous sibling
        const prev = anchorNode.getPreviousSibling()
        if ($isMentionNode(prev)) {
          event?.preventDefault()
          prev.selectPrevious()
          return true
        }
      }

      if (!isBackward && anchor.offset === anchorNode.getTextContentSize()) {
        // Cursor at end of text node — check next sibling
        const next = anchorNode.getNextSibling()
        if ($isMentionNode(next)) {
          event?.preventDefault()
          next.selectNext()
          return true
        }
      }

      return false
    }

    const unregBackspace = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => handleDelete(event, true),
      COMMAND_PRIORITY_HIGH,
    )
    const unregDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      (event) => handleDelete(event, false),
      COMMAND_PRIORITY_HIGH,
    )

    return () => {
      unregBackspace()
      unregDelete()
    }
  }, [editor])

  // Mount the container element once
  useLayoutEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement) return

    const container = rootElement.closest('[data-mention-input]')
    if (!container) return

    const ghostEl = document.createElement('span')
    ghostEl.style.display = 'none'
    container.appendChild(ghostEl)
    ghostElRef.current = ghostEl
    containerRef.current = container as HTMLDivElement

    return () => {
      ghostEl.remove()
      ghostElRef.current = null
    }
  }, [editor])

  return null
}
