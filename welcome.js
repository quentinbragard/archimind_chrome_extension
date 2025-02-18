// Supabase configuration (using your project URL and anon key)
const SUPABASE_URL = 'https://gjszbwfzgnwblvdehzcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqc3pid2Z6Z253Ymx2ZGVoemNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzc1MTgsImV4cCI6MjA1Mjk1MzUxOH0.j8IsFttSHrHCm5K_Z7A19pMftuNwDfpKww2dBAYaXUQ';

async function signInWithEmail(email, password) {
  const endpoint = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const payload = {
    email: email,
    password: password,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error('Error signing in:', response);
      displayMessage('Error signing in: ' + response.statusText);
      return;
    }
    
    console.log('Sign in successful:', response);
    // Display a clickable link that will open https://chatgpt.com/
    displayMessage('Sign in successful! <a href="https://chatgpt.com/" target="_blank">Click here to open ChatGPT</a>');
    
    // At this point, you'll have access and refresh tokens in the response.
    // For example, you might have the following in the response (if using the standard API):
    const data = await response.json();
    console.log('Sign in successful:', data); 
    // And then store data.user.id in Chrome storage as follows:
    if (data.user && data.user.id) {
       chrome.storage.sync.set({ supabaseUserId: data.user.id }, () => {
         console.log('Stored Supabase user ID:', data.user.id);
       });
     }
  } catch (error) {
    console.error('Fetch error:', error);
    displayMessage('Error: ' + error.message);
  }
}

document.getElementById('signInButton').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  if (!email || !password) {
    displayMessage('Please enter both email and password.');
    return;
  }
  
  await signInWithEmail(email, password);
});

function displayMessage(msg) {
  const messageDiv = document.getElementById('message');
  // Use innerHTML so that any HTML (like anchor tags) in msg is rendered.
  messageDiv.innerHTML = msg;
} 