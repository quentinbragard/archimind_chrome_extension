import { trackThinkingTime } from './trackThinkingTime.js';

// Extract the model information
function getModelInfo() {
  console.log("GETTING MODEL INFO");
  
  const modelButton = document.querySelector('button[data-testid="model-switcher-dropdown-button"]');
  if (modelButton) {
    return modelButton.innerText.trim();
  }
  // fallback for custom GPT
  const customGptButton = document.querySelector('div[data-testid="undefined-button"]');
  if (customGptButton) {
    return customGptButton.innerText.trim();
  }
  return null;
}

export async function sendMessageToSupabase({
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
  console.log("Sending to Supabase =>", {
    role,
    message,
    rank,
    message_id: messageId,
    provider_chat_id: providerChatId,
    model,
    thinking_time: thinkingTime,
  });

  // Wrap chrome.runtime.sendMessage in a Promise
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'SAVE_MESSAGE',
        data: {
          role,
          message,
          rank,
          message_id: messageId,
          provider_chat_id: providerChatId,
          model,
          thinking_time: thinkingTime,
        },
      },
      (response) => {
        if (response && response.success) {
          console.log(`Successfully saved ${role} message.`);
          resolve(response);
        } else {
          console.error(`Failed to save ${role} message:`, response?.error);
          reject(response?.error || "Unknown error");
        }
      }
    );
  });
}
