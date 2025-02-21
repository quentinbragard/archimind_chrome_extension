import { getAuthToken } from './auth.js';

/**
 * Saves chat details to the backend using OAuth authentication.
 */
export function saveChatToBackend({userId, chatId, chatTitle, providerName}) {
    getAuthToken(async function(token) {
      const payload = {
        user_id: userId,
        provider_chat_id: chatId,
        title: chatTitle,
        provider_name: providerName,
      };
  
      console.log("Payload being sent to backend:", payload);
  
      fetch('https://fastapi-backend-sw5cmqbraq-ew.a.run.app/save_chat', {
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
  