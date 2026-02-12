import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

import { getKey } from '@/lib/utils'

import type { QueryInput } from '@/lib/types'

const SYSTEM_MESSAGE = `You are an AI assistant analyzing Google Sheets data. The user's spreadsheet data is provided below as XML context. Answer questions by referencing this data. Be concise.`

export async function anthropicQuery({ question, context }: QueryInput) {
  const apiKey = await getKey('local:ANTHROPIC_API_KEY')
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    max_tokens: 1024,
    model: 'claude-sonnet-4-5-20250929',
    system: `${SYSTEM_MESSAGE}\n\n${context}`,
    messages: [{ role: 'user', content: question }],
  })
  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

export async function openAIQuery({ question, context }: QueryInput) {
  const apiKey = await getKey('local:OPENAI_API_KEY')
  const client = new OpenAI({ apiKey })
  const response = await client.responses.create({
    model: 'gpt-4.1',
    instructions: `${SYSTEM_MESSAGE}\n\n${context}`,
    input: question,
  })
  return response.output_text
}
