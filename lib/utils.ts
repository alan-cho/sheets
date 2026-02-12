import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { storage } from '@wxt-dev/storage'
import { MessageResponse } from '@/lib/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const saveItem = async (
  key: string,
  value: string,
): Promise<boolean> => {
  try {
    await storage.setItem<string>(`local:${key}`, value)
  } catch (e) {
    return false
  }
  return true
}

export const getItem = async (key: `local:${string}`): Promise<string> => {
  try {
    const item = await storage.getItem<string>(key)
    if (item === null) throw new Error(`${key} not found`)
    return item
  } catch (e) {
    throw new Error(`failed to get ${key}`)
  }
}

export const getKey = async (key: `local:${string}`): Promise<string> => {
  const apiKey = await getItem(key)
  if (!apiKey) throw new Error(`failed to get ${key}`)
  return apiKey
}

export const sendMessage = async <T>(
  message: Record<string, unknown>,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (res: MessageResponse<T>) => {
      if (res?.success) resolve(res.data as T)
      else reject(new Error(res?.error ?? 'Unknown error'))
    })
  })
}
