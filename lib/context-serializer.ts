import { columnIndexToLetter } from '@/lib/sheets-utils'

import type { ResolvedContext, SpreadsheetMetadata } from '@/lib/types'

const MAX_ROWS = 200

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function serializeReference(ref: ResolvedContext): string {
  const rows = ref.data
  if (rows.length === 0) return ''

  const headers = rows[0]
  const allDataRows = rows.slice(1)
  const truncated = allDataRows.length > MAX_ROWS
  const dataRows = truncated ? allDataRows.slice(0, MAX_ROWS) : allDataRows

  const schemaEntries = headers
    .map((header, i) => {
      if (!header) return null
      return `      <column index="${columnIndexToLetter(i)}" header="${escapeXml(header)}" />`
    })
    .filter(Boolean)

  const dataEntries = dataRows
    .map((row, rowIdx) => {
      const cells = row
        .map((cell, colIdx) => {
          if (!cell) return null
          return `        <cell col="${columnIndexToLetter(colIdx)}">${escapeXml(cell)}</cell>`
        })
        .filter(Boolean)

      if (cells.length === 0) return null
      return `      <row index="${rowIdx + 2}">\n${cells.join('\n')}\n      </row>`
    })
    .filter(Boolean)

  const parts = [
    `  <reference name="${escapeXml(ref.name)}" type="${ref.type}" range="${escapeXml(ref.range)}">`,
  ]

  if (schemaEntries.length > 0) {
    parts.push(`    <schema>`)
    parts.push(schemaEntries.join('\n'))
    parts.push(`    </schema>`)
  }

  if (dataEntries.length > 0) {
    parts.push(`    <data>`)
    parts.push(dataEntries.join('\n'))
    parts.push(`    </data>`)
  }

  if (truncated) {
    parts.push(`    <truncated rows="${MAX_ROWS}" total="${allDataRows.length}" reason="Row limit exceeded. First ${MAX_ROWS} data rows included." />`)
  }

  parts.push(`  </reference>`)
  return parts.join('\n')
}

export function serializeContext(
  resolved: ResolvedContext[],
  metadata: SpreadsheetMetadata,
): string {
  const references = resolved.map(serializeReference).filter(Boolean).join('\n')

  return `<spreadsheet title="${escapeXml(metadata.title)}">\n${references}\n</spreadsheet>`
}
