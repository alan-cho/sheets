export async function getGoogleAuthToken(
  interactive: boolean,
): Promise<string> {
  const result = await chrome.identity.getAuthToken({ interactive })
  if (!result.token) throw new Error('failed to get auth token')
  return result.token
}
