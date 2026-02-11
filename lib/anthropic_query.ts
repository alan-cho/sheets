import Anthropic from '@anthropic-ai/sdk'
import { storage } from '@wxt-dev/storage'

async function getKey() {
  const key = await storage.getItem<string>('local:ANTHROPIC_API_KEY')
  if (!key) throw new Error('failed to get ANTHROPIC_API_KEY')
  return key
}

export async function anthropicQuery(input: string) {
  const apiKey = await getKey()
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    max_tokens: 1024,
    model: 'claude-opus-4-6',
    messages: [{ role: 'user', content: input }],
  })
  return response
}
