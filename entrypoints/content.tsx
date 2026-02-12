export default defineContentScript({
  matches: ['https://docs.google.com/spreadsheets/*'],
  main() {
    console.log("Sheets content script loaded");
  },
});
