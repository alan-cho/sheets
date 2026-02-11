import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  runner: {
    startUrls: ["https://sheets.google.com"],
  },
  manifest: {
    name: "Sheets",
    description: "Chrome extension AI tool for Google Sheets",
    permissions: ["sidePanel"],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
