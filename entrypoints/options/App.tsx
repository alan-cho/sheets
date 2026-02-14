import { TableProperties } from 'lucide-react'

import { ApiKeyField } from '@/entrypoints/options/components/ApiKeyField'
import { DebugToggleSection } from '@/entrypoints/options/components/DebugToggleSection'
import { GoogleAuthSection } from '@/entrypoints/options/components/GoogleAuthSection'

export default function App() {
  return (
    <div className="min-h-screen bg-lavender/20">
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-coral/10">
          <TableProperties className="size-5 text-coral" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-semibold leading-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure API keys and connections
          </p>
        </div>
      </div>

      {/* API Keys */}
      <section className="mt-8">
        <h2 className="mb-3 border-l-2 border-coral pl-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          API Keys
        </h2>
        <div className="flex flex-col gap-3">
          <ApiKeyField
            label="Anthropic API Key"
            description="Used for Claude-powered responses"
            storageKey="ANTHROPIC_API_KEY"
          />
          <ApiKeyField
            label="OpenAI API Key"
            description="Used for GPT-powered responses"
            storageKey="OPENAI_API_KEY"
          />
        </div>
      </section>

      {/* Connections */}
      <section className="mt-8">
        <h2 className="mb-3 border-l-2 border-coral pl-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Connections
        </h2>
        <GoogleAuthSection />
      </section>

      {/* Developer */}
      <section className="mt-8">
        <h2 className="mb-3 border-l-2 border-coral pl-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Developer
        </h2>
        <DebugToggleSection />
      </section>
    </div>
    </div>
  )
}
