export interface ModelOption {
  id: string
  label: string
  provider: 'anthropic' | 'openai'
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', provider: 'anthropic' },
  { id: 'gpt-5.2', label: 'GPT-5.2', provider: 'openai' },
  { id: 'gpt-4.1', label: 'GPT-4.1', provider: 'openai' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
]

export const DEFAULT_MODEL_ID = 'claude-sonnet-4-5-20250929'

export function getModelOption(modelId: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((m) => m.id === modelId)
}
