import OpenAI from 'openai'
import { getItem } from '@/lib/utils'

async function getKey(): Promise<string> {
  const key = await getItem('local:OPENAI_API_KEY')
  if (!key) throw new Error('failed to get OPENAI_API_KEY')
  return key
}

// TODO: needs optimize the input before sending query
export async function openAIQuery(input: string) {
  const apiKey = await getKey()
  const client = new OpenAI({ apiKey })
  const response = await client.responses.create({
    model: 'gpt-5.2',
    input,
  })
  return response
}
