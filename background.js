// Open welcome page on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: 'welcome.html' });
});

// Function to get OAuth token
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getAuthToken") {
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
            if (chrome.runtime.lastError) {
                console.error("Auth token error:", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError });
            } else {
                console.log("OAuth Token:", token);
                sendResponse({ success: true, token });
            }
        });
        return true;  // Required for async response
    }
});
