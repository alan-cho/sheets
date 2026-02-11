import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  runner: {
    startUrls: ['https://sheets.google.com'],
  },
  manifest: {
    name: 'Sheets',
    description: 'Chrome extension AI tool for Google Sheets',
    permissions: ['sidePanel', 'storage', 'activeTab', 'identity', 'tabs'],
    host_permissions: ['https://sheets.googleapis.com/*'],
    oauth2: {
      client_id:
        '724665450633-ub0l7ul2h8fd02a3kpnfh2p28i9lc7oq.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
})
