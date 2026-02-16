import { useState } from 'react'
import { ChevronLeft, SlidersVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { APIKeyField } from '@/entrypoints/popup/components/APIKeyField'
import { DebugToggleSection } from '@/entrypoints/popup/components/DebugToggleSection'
import { GoogleAuthSection } from '@/entrypoints/popup/components/GoogleAuthSection'
import { MenuDots } from '@/entrypoints/popup/components/MenuDots'

import type { View } from '@/lib/types'

export default function App() {
  const [view, setView] = useState<View>('main')

  const openSidePanel = async () => {
    const win = await chrome.windows.getCurrent()
    chrome.sidePanel.open({ windowId: win.id! })
    window.close()
  }

  return (
    <div className="w-96 overflow-hidden">
      <div
        className="flex w-[200%] transition-transform duration-300 ease-in-out"
        style={{
          transform: view === 'settings' ? 'translateX(-50%)' : 'translateX(0)',
        }}
      >
        {/* Main View */}
        <div className="flex w-1/2 flex-col">
          <div className="flex items-center border-b border-border px-4 py-3 justify-between">
            <h1 className="font-serif text-xl font-semibold">Sheets</h1>
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={() => setView('settings')}
              >
                <SlidersVertical className="size-4" />
              </Button>
            </div>
          </div>

          <div>
            <Button onClick={openSidePanel}>Open Sidebar</Button>
          </div>

          <MenuDots setView={setView} view={view} />
        </div>

        {/* Settings View */}
        <div className="flex w-1/2 flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-3 justify-between">
            <h1 className="font-serif text-xl font-semibold">Settings</h1>
            <div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setView('main')}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 px-4 py-2">
            <section>
              <h2 className="my-4 border-l-2 border-coral pl-2 text-lg">
                API Keys
              </h2>
              <div className="flex flex-col gap-3">
                <APIKeyField
                  label="Anthropic API Key"
                  description="Used for Claude-powered responses"
                  storageKey="ANTHROPIC_API_KEY"
                />
                <APIKeyField
                  label="OpenAI API Key"
                  description="Used for GPT-powered responses"
                  storageKey="OPENAI_API_KEY"
                />
              </div>
            </section>

            <section>
              <h2 className="my-4 border-l-2 border-coral pl-2 text-lg">
                Connections
              </h2>
              <GoogleAuthSection />
            </section>

            <section>
              <h2 className="my-4 border-l-2 border-coral pl-2 text-lg">
                Developer
              </h2>
              <DebugToggleSection />
            </section>
          </div>

          <MenuDots setView={setView} view={view} />
        </div>
      </div>
    </div>
  )
}
