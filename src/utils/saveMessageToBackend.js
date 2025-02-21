import { getAuthToken } from './auth.js';
import { getModelInfo } from './getModelInfo.js';

/**
 * Saves a message to the backend using OAuth authentication.
 */
export async function saveMessageToBackend({
  userId,
  role,
  message,
  rank,
  messageId,
  providerChatId,
  thinkingTime,
}) {
  if (!message) {
    console.warn(`Skipping empty ${role} message for messageId: ${messageId}`);
    return;
  }
  const model = getModelInfo();

  getAuthToken(async function(token) {
    try {
      const payload = {
        user_id: userId,
        content: message,
        role,
        rank: parseInt(rank),
        message_id: messageId,
        provider_chat_id: providerChatId,
        model,
        thinking_time: thinkingTime,
      };

      console.log("Payload being sent to backend:", payload);

      const response = await fetch('https://fastapi-backend-sw5cmqbraq-ew.a.run.app/save_message', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        console.log(`Successfully saved ${role} message.`);
      } else {
        console.error(`Failed to save ${role} message:`, data.error);
      }
      return data;
    } catch (error) {
      console.error("Error sending message to backend:", error);
      throw error;
    }
  });
}
