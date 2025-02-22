// Show modal on "Get Started" button click
document.getElementById('getStartedButton').addEventListener('click', () => {
  document.getElementById('loginModal').style.display = 'flex';
});

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('loginModal').style.display = 'none';
});

// Handle email sign-in
document.getElementById('signInButton').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
      displayMessage("Please enter both email and password.");
      return;
  }

  chrome.runtime.sendMessage({ action: "emailSignIn", email, password }, (response) => {
      if (response.success) {
          displayMessage('✅ Sign-in successful! <a href="https://chatgpt.com/" target="_blank">Open ChatGPT</a>');
      } else {
          displayMessage("❌ " + response.error);
      }
  });
});

// Handle Google Sign-In
document.getElementById('googleSignInButton').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "googleSignIn" }, (response) => {
      if (response.success) {
          displayMessage('✅ Google Sign-in successful! <a href="https://chatgpt.com/" target="_blank">Open ChatGPT</a>');
      } else {
          displayMessage("❌ " + response.error);
      }
  });
});

// Function to display messages in the modal
function displayMessage(msg) {
  document.getElementById('message').innerHTML = msg;
}
