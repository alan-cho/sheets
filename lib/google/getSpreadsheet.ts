import { fetchSheetsApi } from '@/lib/google/fetch'

export async function getRangeValues(
  token: string,
  spreadsheetId: string,
  range: string,
): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`

  const res = await fetchSheetsApi(token, url)
  const data = await res.json()
  return data.values ?? []
}
