import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { getKey } from '@/lib/utils'

export async function anthropicQuery(input: string) {
  const apiKey = await getKey('local:ANTHROPIC_API_KEY')
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    max_tokens: 1024,
    model: 'claude-opus-4-6',
    messages: [{ role: 'user', content: input }],
  })
  return response
}

export async function openAIQuery(input: string) {
  const apiKey = await getKey('local:OPENAI_API_KEY')
  const client = new OpenAI({ apiKey })
  const response = await client.responses.create({
    model: 'gpt-5.2',
    input,
  })
  return response
}
