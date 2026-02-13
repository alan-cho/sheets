export interface SheetInfo {
  sheetId: number
  title: string
}

export interface NamedRangeInfo {
  name: string
  range: string
}

export interface TableColumnInfo {
  columnIndex: number
  columnName: string
  columnType: string
}

export interface TableInfo {
  name: string
  range: string
  columns: TableColumnInfo[]
}

export interface SpreadsheetMetadata {
  title: string
  sheets: SheetInfo[]
  namedRanges: NamedRangeInfo[]
  tables: TableInfo[]
}

export type ContextType = 'sheet' | 'namedRange' | 'table'

export interface ContextEntity {
  raw: string
  name: string
  type: ContextType
  range: string
}

export interface ResolvedContext extends ContextEntity {
  data: string[][]
}

export type LLMProvider = 'anthropic' | 'openai'

export interface QueryInput {
  question: string
  context: string
  model: string
}

export interface MessageResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface GridRange {
  sheetId?: number
  startRowIndex?: number
  endRowIndex?: number
  startColumnIndex?: number
  endColumnIndex?: number
}

export type BackgroundMessage =
  | { type: 'QUERY_LLM'; model: string; question: string; context: string }
  | { type: 'AUTHENTICATE_GOOGLE' }
  | { type: 'GET_RANGE_DATA'; spreadsheetId: string; range: string }
  | { type: 'GET_ACTIVE_SPREADSHEET' }
  | { type: 'GET_SHEET_METADATA'; spreadsheetId: string }

export interface SheetsApiResponse {
  properties: { title: string }
  sheets: {
    properties: { sheetId: number; title: string }
    tables?: {
      name: string
      range: GridRange
      columnProperties: {
        columnIndex: number
        columnName: string
        columnType: string
      }[]
    }[]
  }[]
  namedRanges?: { name: string; range: GridRange }[]
}
