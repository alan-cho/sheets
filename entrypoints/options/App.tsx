import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { saveItem } from '@/lib/utils'

export default function App() {
  const [openAIApiKey, setOpenAIApiKey] = useState('')
  const [anthropicApiKey, setAnthropicApiKey] = useState('')
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [range, setRange] = useState('Sheet1!A1:D10')
  const [result, setResult] = useState<string | null>(null)
  const [googleStatus, setGoogleStatus] = useState<string | null>(null)

  const connectGoogle = () => {
    setGoogleStatus('Connecting...')
    chrome.runtime.sendMessage({ type: 'AUTHENTICATE_GOOGLE' }, (res) => {
      if (res?.success) {
        setGoogleStatus('Connected')
      } else {
        setGoogleStatus(`Error: ${res?.error ?? 'Unknown'}`)
      }
    })
  }

  const fetchRange = () => {
    setResult('Loading...')
    chrome.runtime.sendMessage(
      { type: 'GET_RANGE_DATA', spreadsheetId, range },
      (res) => {
        if (res?.success) {
          setResult(JSON.stringify(res.data, null, 2))
        } else {
          setResult(`Error: ${res?.error ?? 'Unknown'}`)
        }
      },
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">Sheets Options</h1>
      <div className="flex flex-col">
        <div className="flex">
          <label>OpenAI Key</label>
          <div className="flex">
            <Input
              placeholder="Enter key here"
              name="OpenAI_Input"
              value={openAIApiKey}
              onChange={(e) => setOpenAIApiKey(e.target.value)}
            />
            <Button
              onClick={() => saveItem('local:OPENAI_API_KEY', openAIApiKey)}
            >
              Save
            </Button>
          </div>
        </div>
        <div className="flex">
          <label>Anthropic Key</label>
          <div className="flex">
            <Input
              placeholder="Enter key here"
              name="Anthropic_Input"
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
            />
            <Button
              onClick={() =>
                saveItem('local:ANTRHOPIC_API_KEY', anthropicApiKey)
              }
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      <hr className="my-6" />

      <h2 className="text-xl font-semibold">Google Sheets API Test</h2>
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={connectGoogle}>Connect Google</Button>
          {googleStatus && (
            <span className="text-sm text-muted-foreground">
              {googleStatus}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Spreadsheet ID</label>
          <Input
            placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Range</label>
          <Input
            placeholder="e.g. Sheet1!A1:D10"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          />
        </div>
        <Button onClick={fetchRange} disabled={!spreadsheetId || !range}>
          Fetch Range
        </Button>
        {result && (
          <pre className="mt-2 max-h-96 overflow-auto rounded bg-muted p-3 text-sm">
            {result}
          </pre>
        )}
      </div>
    </div>
  )
}
