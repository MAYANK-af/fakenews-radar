// Fake News Radar - Background worker script

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "verify-fake-news",
    title: "Verify with Fake News Radar",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "verify-fake-news") {
    const text = info.selectionText;
    
    // Store selected text for the popup script to read
    chrome.storage.local.set({ selectedText: text }, () => {
      // Attempt to open the popup automatically (Supported in newer Chrome Manifest V3 APIs)
      if (chrome.action && typeof chrome.action.openPopup === 'function') {
        chrome.action.openPopup().catch(() => {
          // Silent catch if browser active window state restricts openPopup
          setScanBadge();
        });
      } else {
        setScanBadge();
      }
    });
  }
});

function setScanBadge() {
  chrome.action.setBadgeText({ text: "SCAN" });
  chrome.action.setBadgeBackgroundColor({ color: "#00ff88" });
}
