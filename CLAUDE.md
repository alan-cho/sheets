# Sheets — Chrome Extension

## Commands

- `bun run dev` — Start development mode with HMR
- `bun run build` — Production build to `.output/chrome-mv3/`
- `bun run lint` — Run ESLint

## Architecture

Built with [WXT](https://wxt.dev) (Vite-based extension framework), React, TypeScript, and Tailwind CSS.

### Entry Points (`entrypoints/`)

- **popup/** — Toolbar popup (click extension icon)
- **sidepanel/** — Chrome side panel
- **options/** — Extension options page (right-click icon → Options)
- **content.tsx** — Content script injected into web pages
- **background.ts** — Background service worker

Each React entry point (popup, sidepanel, options) has its own `index.html`, `main.tsx`, and `App.tsx`. They share `styles.css` for Tailwind.

### Configuration

- `wxt.config.ts` — WXT/Vite config, manifest metadata, plugins
- `tsconfig.json` — Extends WXT-generated config in `.wxt/`
- `eslint.config.js` — Flat config with TypeScript + React hooks rules

### Build Output

WXT generates the manifest and outputs to `.output/chrome-mv3/`. Load this directory as an unpacked extension in `chrome://extensions`.

---

## MVP Implementation Plan

Google Sheets AI assistant — Cursor-like `@` syntax for querying spreadsheet data via Claude. Users reference sheets and named ranges (e.g., `@prices explain the formula used in this table`) and get streamed responses.

### Data Flow

```
[Side Panel UI] <--port (streaming)--> [Background SW] --fetch--> [Claude API]
                                              |
[Content Script] <--sendMessage--> [Background SW] --fetch--> [Google Sheets API]
                                              |
[Options Page]   <--wxt storage--> [chrome.storage.local]
```

1. User opens Google Sheets, clicks extension icon to open side panel
2. Content script extracts spreadsheet ID from URL, sends to background
3. Side panel fetches spreadsheet metadata (sheet names, named ranges) via background
4. User types a question with `@SheetName` or `@NamedRange` references
5. Reference parser matches `@` mentions against available refs
6. Background resolves references via Google Sheets API, serializes to XML context
7. Background streams Claude response back to side panel via Chrome port
8. Side panel renders streamed markdown in real time

### Key Decisions

- **Google Sheets REST API** (not DOM scraping) — DOM is deeply obfuscated and changes without notice. API gives cell values, formulas, named ranges, formatting reliably via OAuth2 (`chrome.identity.getAuthToken`).
- **Background service worker makes ALL external API calls** — avoids CSP issues that affect content scripts and side panels.
- **Streaming via Chrome ports** — `chrome.runtime.connect({ name: "chat-stream" })` for real-time delivery. `sendMessage` is request/response only. Port disconnect triggers `AbortSignal` to cancel the fetch.
- **Direct fetch to Claude API** (no SDK) — cleaner in service worker context. SSE parsing with `onDelta`/`onComplete`/`onError` callbacks. Model: `claude-sonnet-4-5-20250929`.
- **API key in `chrome.storage.local`** (not `sync`) — sync sends plaintext across devices.
- **XML context serialization** — Claude handles XML well due to training data. Semantic tags improve comprehension over flat text.
- **No intent classification in MVP** — regex-based classification is too brittle for real queries. Let Claude interpret intent from the context.

### Context Serialization (XML)

```xml
<spreadsheet title="Budget 2024">
  <reference name="@Sheet1" type="sheet" range="Sheet1!A1:D10">
    <schema>
      <column index="A" header="Date" />
      <column index="B" header="Amount" />
    </schema>
    <data>
      <row index="2"><cell col="A">2024-01-01</cell><cell col="B">100</cell></row>
    </data>
    <formulas>
      <cell ref="B10">=SUM(B2:B9)</cell>
    </formulas>
  </reference>
</spreadsheet>
```

First row treated as headers (`<schema>`). Only non-empty formulas included. Multiple `@` references produce multiple `<reference>` blocks.

### `@` Reference Scope

MVP supports `@SheetName` and `@NamedRange` only. Post-MVP: `@TableName` (auto-detected), `@TableName.ColumnName`.

### Implementation Phases

**Phase 1 — Foundation: types, storage, message passing**

- Shared types in `lib/types.ts`: message types (`GET_SHEET_METADATA`, `GET_RANGE_DATA`, `GET_NAMED_RANGES`, `SEND_CHAT_MESSAGE`, `CANCEL_STREAM`, `GET_ACTIVE_SPREADSHEET`, `AUTHENTICATE_GOOGLE`, `CHECK_AUTH_STATUS`), chat types (`ChatMessage`), reference types (`AtReference`), spreadsheet types, stream events (`stream_start`, `stream_delta`, `stream_end`, `stream_error`)
- Storage items in `lib/storage.ts` via `storage.defineItem`: `anthropicApiKey` (local), `googleAuthToken` (local)
- Manifest permissions in `wxt.config.ts`: `identity`, `storage`, `activeTab`, `tabs`, `sidePanel`; host permissions for `docs.google.com`, `sheets.google.com`, `api.anthropic.com`; OAuth2 with `spreadsheets.readonly` scope
- Content script narrowed to Sheets URLs, extracts spreadsheet ID
- Background message router with stubs

**Phase 2 — Options page: API key and Google auth**

- shadcn: `input`, `button`, `card`, `label`
- `hooks/useStorageItem.ts` — generic React hook wrapping WXT storage (`.getValue()`, `.watch()`)
- Options UI: masked API key input (save/clear), Google OAuth connect/disconnect with status
- `lib/google-auth.ts`: `getGoogleAuthToken(interactive)`, `checkGoogleAuthStatus()`, `revokeGoogleAuth()`

**Phase 3 — Google Sheets API integration**

- `lib/google-sheets.ts` — fetch-based client using OAuth token against `sheets.googleapis.com/v4/spreadsheets`:
  - `getSpreadsheetMetadata(token, id)` — title, sheets, named ranges
  - `getNamedRanges(token, id)` — list with A1 notation
  - `getRangeValues(token, id, range)` — `string[][]`
  - `getRangeFormulas(token, id, range)` — `string[][]` (via `valueRenderOption=FORMULA`)
  - `gridRangeToA1()` helper
- Wire background handlers for sheet metadata/range/named-range messages

**Phase 4 — Context serialization**

- `lib/reference-resolver.ts` — sheet refs fetch full used range, named range refs fetch A1 range directly
- `lib/context-serializer.ts` — builds XML from resolved references
- `lib/parse-references.ts` — `parseReferences(text, availableRefs)` finds and matches `@mentions`

**Phase 5 — Claude API integration**

- `lib/claude.ts` — direct fetch to `api.anthropic.com/v1/messages`, SSE stream parsing, `AbortSignal` cancellation
- Background: `browser.runtime.onConnect` for `"chat-stream"` port. Receives message → gets API key → gets auth token → resolves references → serializes XML → streams Claude response as `StreamEvent`s → aborts on disconnect

**Phase 6 — Side panel chat UI**

- shadcn: `scroll-area`, `badge`, `textarea`, `separator`
- `entrypoints/sidepanel/hooks/useChat.ts` — messages state, streaming flag, port lifecycle, `sendMessage()`, `cancelStream()`
- `entrypoints/sidepanel/hooks/useSpreadsheet.ts` — detects active spreadsheet from tab URL, fetches metadata, computes available references, listens for tab changes
- Components:
  - `StatusBar.tsx` — spreadsheet name or "Not on a Google Sheet", settings gear
  - `MessageList.tsx` — scrollable messages, auto-scroll to bottom
  - `MessageBubble.tsx` — user (coral bg) / assistant (lavender bg), `@` badges
  - `ChatInput.tsx` — textarea, Enter to send / Shift+Enter newline, cancel while streaming
  - `ReferenceList.tsx` — clickable `@reference` chips that insert into input
- Layout: `StatusBar` → `MessageList` → `ReferenceList` → `ChatInput` in a `flex h-screen flex-col`
- First-run: no API key → inline prompt + button to options; no Google auth → inline prompt to connect

### Files

**New (17)**

| File                                                 | Purpose                            |
| ---------------------------------------------------- | ---------------------------------- |
| `lib/types.ts`                                       | Shared TypeScript types            |
| `lib/storage.ts`                                     | WXT storage items                  |
| `lib/google-auth.ts`                                 | Chrome identity OAuth wrapper      |
| `lib/google-sheets.ts`                               | Sheets REST API client             |
| `lib/context-serializer.ts`                          | XML context builder                |
| `lib/reference-resolver.ts`                          | Resolves `@` refs to sheet data    |
| `lib/claude.ts`                                      | Anthropic streaming client         |
| `lib/parse-references.ts`                            | Parse `@` mentions from input      |
| `lib/errors.ts`                                      | Error types + user-facing messages |
| `hooks/useStorageItem.ts`                            | React hook for WXT storage         |
| `entrypoints/sidepanel/hooks/useChat.ts`             | Chat state + streaming             |
| `entrypoints/sidepanel/hooks/useSpreadsheet.ts`      | Spreadsheet context                |
| `entrypoints/sidepanel/components/StatusBar.tsx`     | Header + connection status         |
| `entrypoints/sidepanel/components/MessageList.tsx`   | Message scroll area                |
| `entrypoints/sidepanel/components/MessageBubble.tsx` | Message display                    |
| `entrypoints/sidepanel/components/ChatInput.tsx`     | Input + send/cancel                |
| `entrypoints/sidepanel/components/ReferenceList.tsx` | Available `@` refs                 |

**Modified (5)**

| File                            | Changes                                       |
| ------------------------------- | --------------------------------------------- |
| `wxt.config.ts`                 | Permissions, OAuth2, host_permissions         |
| `entrypoints/background.ts`     | Message router, port streaming, handlers      |
| `entrypoints/content.tsx`       | Narrow to Sheets URLs, extract spreadsheet ID |
| `entrypoints/options/App.tsx`   | API key input, Google auth UI                 |
| `entrypoints/sidepanel/App.tsx` | Full chat UI assembly                         |

### Out of Scope (Post-MVP)

Auto table detection (heuristic contiguous-block detection), intent classification, query optimization / data sampling for large tables, `@` autocomplete dropdown, formula semantic analysis, caching / incremental invalidation, column-level references (`@Table.Column`), multi-table cross-referencing, write operations, visual outputs / charts, conversation history persistence.
