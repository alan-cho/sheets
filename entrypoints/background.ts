import { openAIQuery } from '@/lib/openai_query'
import { anthropicQuery } from '@/lib/anthropic_query'

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

    default: {
      return
    }
  }
})
