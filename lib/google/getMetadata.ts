import type {
  GridRange,
  SheetInfo,
  SheetsApiResponse,
  SpreadsheetMetadata,
  TableInfo,
} from '@/lib/types'

function columnIndexToLetter(index: number): string {
  let letter = ''
  let n = index
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}

function gridRangeToA1(gridRange: GridRange, sheets: SheetInfo[]): string {
  const sheet = sheets.find((s) => s.sheetId === gridRange.sheetId)
  const sheetName = sheet?.title ?? 'Unknown'
  const escaped =
    sheetName.includes(' ') || sheetName.includes("'")
      ? `'${sheetName.replace(/'/g, "''")}'`
      : sheetName

  const hasStart =
    gridRange.startColumnIndex !== undefined &&
    gridRange.startRowIndex !== undefined
  const hasEnd =
    gridRange.endColumnIndex !== undefined &&
    gridRange.endRowIndex !== undefined

  if (!hasStart) return escaped

  const startCol = columnIndexToLetter(gridRange.startColumnIndex!)
  const startRow = gridRange.startRowIndex! + 1

  if (!hasEnd) return `${escaped}!${startCol}${startRow}`

  const endCol = columnIndexToLetter(gridRange.endColumnIndex! - 1)
  const endRow = gridRange.endRowIndex!

  return `${escaped}!${startCol}${startRow}:${endCol}${endRow}`
}

export async function getSpreadsheetMetadata(
  token: string,
  spreadsheetId: string,
): Promise<SpreadsheetMetadata> {
  const fields =
    'properties.title,sheets.properties(sheetId,title),sheets.tables(name,range,columnProperties(columnIndex,columnName,columnType)),namedRanges(name,range)'
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=${encodeURIComponent(fields)}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Sheets API error ${res.status}: ${body}`)
  }

  const data: SheetsApiResponse = await res.json()

  const sheets: SheetInfo[] = data.sheets.map((s) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
  }))

  const namedRanges = (data.namedRanges ?? []).map((nr) => ({
    name: nr.name,
    range: gridRangeToA1(nr.range, sheets),
  }))

  const tables: TableInfo[] = data.sheets.flatMap((s) =>
    (s.tables ?? []).map((t) => ({
      name: t.name,
      range: gridRangeToA1(
        { ...t.range, sheetId: t.range.sheetId ?? s.properties.sheetId },
        sheets,
      ),
      columns: t.columnProperties.map((c) => ({
        columnIndex: c.columnIndex,
        columnName: c.columnName,
        columnType: c.columnType,
      })),
    })),
  )

  return {
    title: data.properties.title,
    sheets,
    namedRanges,
    tables,
  }
}
