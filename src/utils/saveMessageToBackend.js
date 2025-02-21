import { getModelInfo } from './getModelInfo.js';


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

    const response = await fetch('http://127.0.0.1:8000/save_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
}
