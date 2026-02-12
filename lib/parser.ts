import type { ContextEntity, SpreadsheetMetadata } from '@/lib/types'

// grabs input prefixed with @
const MENTION_REGEX = /@("[^"]+"|'[^']+'|\w+)/g

export function parser(
  text: string,
  metadata: SpreadsheetMetadata,
): ContextEntity[] {
  const contexts: ContextEntity[] = []
  const seen = new Set<string>()

  for (const match of text.matchAll(MENTION_REGEX)) {
    const raw = match[0]
    const name = match[1].replace(/^["']|["']$/g, '').toLowerCase()

    if (seen.has(name)) continue
    seen.add(name)

    const lookups: {
      items: { name: string; range: string }[]
      type: ContextEntity['type']
    }[] = [
      {
        items: metadata.namedRanges.map((nr) => ({
          name: nr.name,
          range: nr.range,
        })),
        type: 'namedRange',
      },
      {
        items: metadata.tables.map((t) => ({ name: t.name, range: t.range })),
        type: 'table',
      },
      {
        items: metadata.sheets.map((s) => ({ name: s.title, range: s.title })),
        type: 'sheet',
      },
    ]

    for (const { items, type } of lookups) {
      const item = items.find((i) => i.name.toLowerCase() === name)
      if (item) {
        contexts.push({ raw, name: item.name, type, range: item.range })
        break
      }
    }
  }

  return contexts
}
