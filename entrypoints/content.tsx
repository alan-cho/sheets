export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("Sheets content script loaded");
  },
});
