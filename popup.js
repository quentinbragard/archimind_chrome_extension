// popup.js

// Supabase configuration – use your Supabase project URL and anon/public key.
// Note: Do not expose your service role key to clients.
const SUPABASE_URL = 'https://gjszbwfzgnwblvdehzcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqc3pid2Z6Z253Ymx2ZGVoemNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzc1MTgsImV4cCI6MjA1Mjk1MzUxOH0.j8IsFttSHrHCm5K_Z7A19pMftuNwDfpKww2dBAYaXUQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
  // First, check whether we already have an authenticated session.
  await checkSession();

  // Reference the button element.
  const saveButton = document.getElementById('save');

  // Attach click listener – it functions as either sign in or sign out.
  saveButton.addEventListener('click', async () => {
    const emailInput = document.getElementById('userId');
    
    // If the button reads "Sign Out", then perform sign-out.
    if (saveButton.textContent === "Sign Out") {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        displayMessage("Error signing out: " + error.message);
      } else {
        chrome.storage.sync.remove("supabaseUserId", () => {
          console.log("User signed out from Chrome storage.");
        });
        emailInput.value = "";
        emailInput.disabled = false;
        saveButton.textContent = "Sign In";
        displayMessage("Signed out successfully.");
      }
    } else {
      // Sign in flow: use the email in the input to send a magic link.
      const email = emailInput.value.trim();
      if (!email) {
        displayMessage("Please enter your email address.");
        return;
      }
      // Trigger Supabase's magic link sign-in.
      const { error } = await supabaseClient.auth.signInWithOtp({ email });
      if (error) {
        displayMessage("Error sending magic link: " + error.message);
      } else {
        displayMessage("Magic link sent to " + email + ". Check your email.");
      }
    }
  });

  // Listen to auth state changes so we can update the UI if the user completes login.
  supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event, session);
    checkSession();
  });
});

// Function to check the current session and update the UI accordingly.
async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const emailInput = document.getElementById('userId');
  const saveButton = document.getElementById('save');

  if (session && session.user) {
    // User is logged in.
    // Store the user's ID in Chrome storage so that background.js can use it.
    chrome.storage.sync.set({ supabaseUserId: session.user.id }, () => {
      console.log("Stored Supabase user ID:", session.user.id);
    });
    displayMessage("Logged in as: " + session.user.email);
    emailInput.value = session.user.email;
    emailInput.disabled = true;
    // Change the button to let the user sign out.
    saveButton.textContent = "Sign Out";
  } else {
    // No active session.
    displayMessage("Please sign in with your email address.");
    emailInput.disabled = false;
    saveButton.textContent = "Sign In";
  }
}

// Utility function to display a message to the user.
function displayMessage(msg) {
  const messageDiv = document.getElementById('message') || createMessageDiv();
  messageDiv.textContent = msg;
}

function createMessageDiv() {
  const newDiv = document.createElement('div');
  newDiv.id = 'message';
  document.body.appendChild(newDiv);
  return newDiv;
} 