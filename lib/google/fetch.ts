export async function fetchSheetsApi(
  token: string,
  url: string,
): Promise<Response> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Sheets API error ${res.status}: ${body}`)
  }

  return res
}
