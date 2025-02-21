// Supabase configuration
const SUPABASE_URL = 'https://gjszbwfzgnwblvdehzcq.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Show modal on "Get Started" button click
document.getElementById('getStartedButton').addEventListener('click', () => {
  document.getElementById('loginModal').style.display = 'flex';
});

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('loginModal').style.display = 'none';
});

// Sign-in function
async function signInWithEmail(email, password) {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    
    document.getElementById('message').innerHTML = 'Sign in successful! <a href="https://chatgpt.com/" target="_blank">Open ChatGPT</a>';
    chrome.storage.sync.set({ supabaseUserId: data.user.id });
  } catch (error) {
    document.getElementById('message').textContent = 'Error: ' + error.message;
  }
}

// Handle sign-in
document.getElementById('signInButton').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  await signInWithEmail(email, password);
});
