import { openAIQuery, anthropicQuery } from '@/lib/query'
import { getGoogleAuthToken } from '@/lib/google/getAuth'
import { getRangeValues } from '@/lib/google/getSpreadsheet'
import { getSpreadsheetMetadata } from '@/lib/google/getMetadata'

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'QUERY_OPENAI': {
      openAIQuery(message.input)
        .then((response) => sendResponse({ success: true, data: response }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        )
      return true
    }

    case 'QUERY_ANTHROPIC': {
      anthropicQuery(message.input)
        .then((response) => sendResponse({ succes: true, data: response }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        )
      return true
    }

    case 'AUTHENTICATE_GOOGLE': {
      getGoogleAuthToken(true)
        .then((token) => sendResponse({ success: true, data: token }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        )
      return true
    }

    case 'GET_RANGE_DATA': {
      getGoogleAuthToken(true)
        .then((token) =>
          getRangeValues(token, message.spreadsheetId, message.range),
        )
        .then((values) => sendResponse({ success: true, data: values }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        )
      return true
    }

    case 'GET_ACTIVE_SPREADSHEET': {
      chrome.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          const url = tabs[0]?.url
          const match = url?.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
          if (match) {
            sendResponse({ success: true, data: match[1] })
          } else {
            sendResponse({ success: false, error: 'Not on a Google Sheet' })
          }
        })
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        )
      return true
    }

    case 'GET_SHEET_METADATA': {
      getGoogleAuthToken(false)
        .then((token) => getSpreadsheetMetadata(token, message.spreadsheetId))
        .then((metadata) => sendResponse({ success: true, data: metadata }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        )
      return true
    }

    default: {
      return
    }
  }
})

export default defineBackground(() => {
  console.log('background service loaded')
})
