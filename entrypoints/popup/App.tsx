import { PanelRight, Settings, TableProperties } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function App() {
  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  const openSidePanel = async () => {
    const win = await chrome.windows.getCurrent()
    chrome.sidePanel.open({ windowId: win.id! })
  }

  return (
    <div className="flex w-80 flex-col bg-lavender/30">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border bg-lavender/50 px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-coral/10">
          <TableProperties className="size-4 text-coral" />
        </div>
        <div>
          <h1 className="font-serif text-sm font-semibold leading-tight">Sheets</h1>
          <p className="text-xs text-muted-foreground">AI spreadsheet assistant</p>
        </div>
      </div>

      {/* Action */}
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Open the side panel on a Google Sheet to start chatting
        </p>
        <Button size="lg" className="mt-4 gap-2 bg-coral text-white hover:bg-coral/90" onClick={openSidePanel}>
          <PanelRight className="size-4" />
          Open Side Panel
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-lavender/20 px-4 py-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={openOptions}
        >
          <Settings className="size-3.5" />
          Settings
        </Button>
      </div>
    </div>
  )
}
