import { Dispatch, SetStateAction } from 'react'

import type { View } from '@/lib/types'

interface MenuDotsProps {
  setView: Dispatch<SetStateAction<View>>
  view: string
}

export function MenuDots({ setView, view }: MenuDotsProps) {
  return (
    <div className="mt-auto flex justify-center gap-1.5 py-3">
      <button
        className={`size-1.5 rounded-full ${view === 'main' ? 'bg-coral' : 'bg-border'}`}
        onClick={() => setView('main')}
      />
      <button
        className={`size-1.5 rounded-full ${view === 'settings' ? 'bg-coral' : 'bg-border'}`}
        onClick={() => setView('settings')}
      />
    </div>
  )
}
