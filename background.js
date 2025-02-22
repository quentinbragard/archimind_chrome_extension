// Open welcome page on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: 'welcome.html' });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "googleSignIn") {
        googleSignIn(sendResponse);
        return true; // Keep message channel open for async response
    }
    if (request.action === "emailSignIn") {
        emailSignIn(request.email, request.password, sendResponse);
        return true;
    }
    if (request.action === "getAuthToken") {
        getAuthToken(sendResponse);
        return true;
    }
});

// 🔹 Google Sign-In Flow
function googleSignIn(sendResponse) {
    const manifest = chrome.runtime.getManifest();
    const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
    
    authUrl.searchParams.set("client_id", manifest.oauth2.client_id);
    authUrl.searchParams.set("response_type", "id_token");
    authUrl.searchParams.set("redirect_uri", `https://${chrome.runtime.id}.chromiumapp.org`);
    authUrl.searchParams.set("scope", manifest.oauth2.scopes.join(" "));

    chrome.identity.launchWebAuthFlow(
        { url: authUrl.href, interactive: true },
        async (redirectedUrl) => {
            if (chrome.runtime.lastError) {
                console.error("Google Sign-In failed:", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                const url = new URL(redirectedUrl);
                const params = new URLSearchParams(url.hash.replace("#", "?"));
                const idToken = params.get("id_token");

                if (!idToken) {
                    sendResponse({ success: false, error: "No ID token received" });
                    return;
                }

                console.log("🔹 Google ID Token:", idToken);

                // Send ID token to backend for Supabase authentication
                try {
                    const response = await fetch("https://archimind-backend-32108269805.europe-west1.run.app/auth/google", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id_token: idToken }),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        console.log("✅ User authenticated:", data);
                        chrome.storage.sync.set({ supabaseSessionAccessToken: data.session.access_token });
                        sendResponse({ success: true, user: data.user, access_token: data.access_token });
                    } else {
                        sendResponse({ success: false, error: data.error });
                    }
                } catch (error) {
                    console.error("Error sending token to backend:", error);
                    sendResponse({ success: false, error: error.message });
                }
            }
        }
    );
}

// 🔹 Email/Password Sign-In Flow
async function emailSignIn(email, password, sendResponse) {
    try {
        const response = await fetch("https://archimind-backend-32108269805.europe-west1.run.app/auth/sign_in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ Email Sign-In successful:", data);
            chrome.storage.sync.set({ supabaseSessionAccessToken: data.session.access_token });
            chrome.storage.sync.set({ userId: data.user.id });
            sendResponse({ success: true, user: data.user, access_token: data.access_token });
        } else {
            sendResponse({ success: false, error: data.error });
        }
    } catch (error) {
        console.error("Error in email sign-in:", error);
        sendResponse({ success: false, error: error.message });
    }
}

// 🔹 Get Auth Token
function getAuthToken(sendResponse) {
    chrome.storage.sync.get('supabaseSessionAccessToken', (items) => {
        if (chrome.runtime.lastError || !items.supabaseSessionAccessToken) {
            console.error("Error retrieving auth token:", chrome.runtime.lastError);
            sendResponse({ success: false, error: "No auth token found" });
        } else {
            console.log("Retrieved auth token:", items.supabaseSessionAccessToken);
            sendResponse({ success: true, token: items.supabaseSessionAccessToken });
        }
    });
}
