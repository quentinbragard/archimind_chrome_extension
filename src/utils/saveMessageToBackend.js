import { getAuthToken } from './auth.js';
import { getModelInfo } from './getModelInfo.js';

/**
 * Saves a message to the backend using OAuth authentication.
 */
export async function saveMessageToBackend({
  role,
  message,
  rank,
  messageId,
  providerChatId,
  thinkingTime = 0,
}) {
  if (!message) {
    console.warn(`Skipping empty ${role} message for messageId: ${messageId}`);
    return;
  }
  const model = getModelInfo();

  getAuthToken(async function(token) {
    try {
      const payload = {
        message_id: messageId,
        content: message,
        role,
        rank: parseInt(rank),
        provider_chat_id: providerChatId,
        model,
        thinking_time: thinkingTime,
      };

      console.log("Payload being sent to backend:", payload);

      const response = await fetch('https://archimind-backend-32108269805.europe-west1.run.app/save_message', {
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
