import type { ContextType } from '@/lib/types'

const contextTypeLabel: Record<ContextType, string> = {
  sheet: 'Sheet',
  namedRange: 'Range',
  table: 'Table',
}

interface ContextChipsProps {
  contexts: { label: string; type: ContextType }[]
}

export function ContextChips({ contexts }: ContextChipsProps) {
  return (
    <div className="shrink-0 border-b border-border px-4 py-2.5">
      <div className="flex flex-wrap gap-1.5">
        {contexts.map((ctx) => (
          <span
            key={`${ctx.type}-${ctx.label}`}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
          >
            <span className="text-muted-foreground">
              {contextTypeLabel[ctx.type]}
            </span>
            {ctx.label}
          </span>
        ))}
      </div>
    </div>
  )
}
