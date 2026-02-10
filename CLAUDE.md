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
