import { getAuthToken } from './auth.js';

/**
 * Saves chat details to the backend using OAuth authentication.
 */
export function saveChatToBackend({chatId, chatTitle, providerName}) {
    getAuthToken(async function(token) {
      const payload = {
        provider_chat_id: chatId,
        title: chatTitle,
        provider_name: providerName,
      };

      console.log("===========Auth Token:", token);
  
      console.log("Payload being sent to backend:", payload);
  
      fetch('https://archimind-backend-32108269805.europe-west1.run.app/save_chat', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Chat saved/updated successfully:', data.data);
        } else {
          console.error('Error saving chat:', data.error);
        }
      })
      .catch(error => console.error('Error in saveChatToBackend:', error));
    });
  }
  