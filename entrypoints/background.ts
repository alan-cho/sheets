import { getGoogleAuthToken } from '@/lib/google/getAuth'
import { getSpreadsheetMetadata } from '@/lib/google/getMetadata'
import { getRangeValues } from '@/lib/google/getSpreadsheet'
import { getModelOption } from '@/lib/models'
import { anthropicQuery, openAIQuery } from '@/lib/query'

import type { BackgroundMessage, MessageResponse } from '@/lib/types'

function extractSpreadsheetId(url?: string): string | null {
  const match = url?.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  return match?.[1] ?? null
}

function handleAsync<T>(
  fn: () => Promise<T>,
  sendResponse: (response: MessageResponse<T>) => void,
) {
  fn()
    .then((data) => sendResponse({ success: true, data }))
    .catch((error: unknown) =>
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
    )
}

browser.runtime.onMessage.addListener(
  (message: BackgroundMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'QUERY_LLM': {
        const model = getModelOption(message.model)
        if (!model) {
          sendResponse({ success: false, error: `Unknown model: ${message.model}` })
          return true
        }
        const queryFn = model.provider === 'anthropic' ? anthropicQuery : openAIQuery
        handleAsync(
          () =>
            queryFn({
              question: message.question,
              context: message.context,
              model: message.model,
            }),
          sendResponse,
        )
        return true
      }

      case 'AUTHENTICATE_GOOGLE': {
        handleAsync(() => getGoogleAuthToken(true), sendResponse)
        return true
      }

      case 'GET_RANGE_DATA': {
        handleAsync(
          () =>
            getGoogleAuthToken(true).then((token) =>
              getRangeValues(token, message.spreadsheetId, message.range),
            ),
          sendResponse,
        )
        return true
      }

      case 'GET_ACTIVE_SPREADSHEET': {
        handleAsync(async () => {
          const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          })
          const id = extractSpreadsheetId(tabs[0]?.url)
          if (!id) throw new Error('Not on a Google Sheet')
          return id
        }, sendResponse)
        return true
      }

      case 'GET_SHEET_METADATA': {
        handleAsync(
          () =>
            getGoogleAuthToken(false).then((token) =>
              getSpreadsheetMetadata(token, message.spreadsheetId),
            ),
          sendResponse,
        )
        return true
      }

      default: {
        return
      }
    }
  },
)

export default defineBackground(() => {
  console.log('background service loaded')

  let sidepanelPort: chrome.runtime.Port | null = null

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'sidepanel') return
    sidepanelPort = port
    port.onDisconnect.addListener(() => {
      sidepanelPort = null
    })
  })

  function notifySidepanel(spreadsheetId: string | null) {
    sidepanelPort?.postMessage(
      spreadsheetId
        ? { type: 'SPREADSHEET_CHANGED', spreadsheetId }
        : { type: 'SPREADSHEET_DISCONNECTED' },
    )
  }

  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await chrome.tabs.get(tabId)
    notifySidepanel(extractSpreadsheetId(tab.url))
  })

  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.active) {
      notifySidepanel(extractSpreadsheetId(changeInfo.url))
    }
  })
})
