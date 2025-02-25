import { getAuthToken } from './auth.js';
import { getModelInfo } from './getModelInfo.js';

/**
 * Saves a chat message to the backend.
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
    console.warn(`⚠️ Skipping empty ${role} message for messageId: ${messageId}`);
    return;
  }

  try {
    const token = await getAuthToken();
    const model = getModelInfo();

    const payload = {
      message_id: messageId,
      content: message,
      role,
      rank: parseInt(rank, 10),
      provider_chat_id: providerChatId,
      model,
      thinking_time: thinkingTime,
    };

    console.log("🔄 Sending message payload:", payload);

    const response = await fetch('http://127.0.0.1:8000/save/message', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`⚠️ Failed request (${response.status}):`, await response.text());
      throw new Error("Failed to save message.");
    }

    const data = await response.json();
    console.log(`✅ Successfully saved ${role} message.`);
  } catch (error) {
    console.error("❌ Error sending message to backend:", error);
  }
}
