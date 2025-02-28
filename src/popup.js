// DOM elements
const loginSection = document.getElementById('login-section');
const loggedInSection = document.getElementById('logged-in-section');
const signInButton = document.getElementById('sign-in');
const signOutButton = document.getElementById('sign-out');
const userEmailSpan = document.getElementById('user-email');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageDiv = document.getElementById('message');

document.addEventListener('DOMContentLoaded', async () => {
  await checkSession();

  signInButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      displayMessage("Please enter both email and password.");
      return;
    }

    // Send request to background.js for authentication
    chrome.runtime.sendMessage(
      { action: "emailSignIn", email, password },
      (response) => {
        if (chrome.runtime.lastError) {
          displayMessage("Error: " + chrome.runtime.lastError.message);
          return;
        }

        if (response.success) {
          console.log("✅ Signed in:", response.user);
          displayUI(true, response.user.email);
          displayMessage("Successfully signed in.");
        } else {
          displayMessage("Error: " + response.error);
        }
      }
    );
  });

  signOutButton.addEventListener('click', async () => {
    chrome.storage.sync.remove(["supabaseSessionAccessToken", "userId"], () => {
      console.log("User signed out.");
      displayUI(false, null);
      displayMessage("Signed out successfully.");
    });
  });
});

async function checkSession() {
  chrome.runtime.sendMessage({ action: "getAuthToken" }, (response) => {
    if (chrome.runtime.lastError || !response.success) {
      console.log("No active session.");
      displayUI(false, null);
      return;
    }

    chrome.storage.sync.get(["userId"], (data) => {
      if (data.userId) {
        console.log("✅ Session active:", data.userId);
        displayUI(true, response.token);
      } else {
        displayUI(false, null);
      }
    });
  });
}

function displayUI(isLoggedIn, email) {
  if (isLoggedIn) {
    loginSection.classList.add("hidden");
    loggedInSection.classList.remove("hidden");
    userEmailSpan.textContent = email;
  } else {
    loginSection.classList.remove("hidden");
    loggedInSection.classList.add("hidden");
    emailInput.value = "";
    passwordInput.value = "";
  }
}

function displayMessage(msg) {
  messageDiv.textContent = msg;
}
