import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { storage } from '@wxt-dev/storage'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// maybe need to allow other types
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
