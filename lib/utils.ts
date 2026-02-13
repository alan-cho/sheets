import { storage } from '@wxt-dev/storage'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { BackgroundMessage, MessageResponse } from '@/lib/types'

import type { ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const saveItem = async (
  key: string,
  value: string,
): Promise<boolean> => {
  try {
    await storage.setItem<string>(`local:${key}`, value)
  } catch {
    return false
  }
  return true
}

export const getItem = async (key: string): Promise<string> => {
  const item = await storage.getItem<string>(`local:${key}`)
  if (item === null) throw new Error(`${key} not found`)
  return item
}

export const sendMessage = async <T>(
  message: BackgroundMessage,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (res: MessageResponse<T>) => {
      if (res?.success) resolve(res.data as T)
      else reject(new Error(res?.error ?? 'Unknown error'))
    })
  })
}
