import { DecoratorNode } from 'lexical'

import type {
  DOMConversionMap,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import type { ContextType } from '@/lib/types'

export type SerializedMentionNode = Spread<
  { mentionName: string; contextType: ContextType },
  SerializedLexicalNode
>

const TYPE_STYLES: Record<ContextType, string> = {
  sheet: 'background:rgba(101,142,156,0.15);color:#658e9c;',
  namedRange: 'background:rgba(227,101,91,0.15);color:#e3655b;',
  table: 'background:#e9ebf8;color:#453f3c;',
}

export class MentionNode extends DecoratorNode<JSX.Element> {
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
    span.style.cssText = TYPE_STYLES[this.__contextType]
    span.style.borderRadius = '4px'
    span.style.padding = '1px 6px'
    span.style.fontWeight = '500'
    span.style.fontSize = '0.875rem'
    span.style.userSelect = 'none'
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

  decorate(): JSX.Element {
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
