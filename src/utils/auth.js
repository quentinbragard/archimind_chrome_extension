export function getAuthToken(callback) {
    chrome.runtime.sendMessage({ action: "getAuthToken" }, function(response) {
        if (chrome.runtime.lastError || !response.success) {
            console.error("Error getting auth token:", response.error);
            return;
        }
        console.log("OAuth Token:", response.token);
        callback(response.token);
    });
}
