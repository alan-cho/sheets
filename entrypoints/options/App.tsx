import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { saveItem } from '@/lib/utils'

export default function App() {
  const [openAIApiKey, setOpenAIApiKey] = useState('')
  const [anthropicApiKey, setAnthropicApiKey] = useState('')

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
    </div>
  )
}
