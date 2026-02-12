import { DecoratorNode } from 'lexical'

import type {
  DOMConversionMap,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import type { ReactNode } from 'react'
import type { ContextType } from '@/lib/types'

export type SerializedMentionNode = Spread<
  { mentionName: string; contextType: ContextType },
  SerializedLexicalNode
>

export class MentionNode extends DecoratorNode<ReactNode> {
  __mentionName: string
  __contextType: ContextType

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mentionName, node.__contextType, node.__key)
  }

  constructor(mentionName: string, contextType: ContextType, key?: NodeKey) {
    super(key)
    this.__mentionName = mentionName
    this.__contextType = contextType
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className =
      'bg-coral/15 text-coral rounded-sm px-1.5 py-px font-medium text-sm select-none'
    return span
  }

  updateDOM(): false {
    return false
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.textContent = this.getTextContent()
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return null
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(
      serializedNode.mentionName,
      serializedNode.contextType,
    )
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      type: 'mention',
      mentionName: this.__mentionName,
      contextType: this.__contextType,
    }
  }

  getTextContent(): string {
    const name = this.__mentionName
    return name.includes(' ') ? `@"${name}"` : `@${name}`
  }

  isInline(): true {
    return true
  }

  isKeyboardSelectable(): true {
    return true
  }

  decorate(): ReactNode {
    return <span contentEditable={false}>@{this.__mentionName}</span>
  }
}

export function $createMentionNode(
  mentionName: string,
  contextType: ContextType,
): MentionNode {
  return new MentionNode(mentionName, contextType)
}

export function $isMentionNode(node: LexicalNode | null): node is MentionNode {
  return node instanceof MentionNode
}
