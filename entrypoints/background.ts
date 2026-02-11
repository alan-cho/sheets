import { openAIQuery } from '@/lib/openai_query'
import { anthropicQuery } from '@/lib/anthropic_query'
import { getGoogleAuthToken, getRangeValues } from '@/lib/google'

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

    default: {
      return
    }
  }
})

export default defineBackground(() => {
  console.log('background service loaded')
})
