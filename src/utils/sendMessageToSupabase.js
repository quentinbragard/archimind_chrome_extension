import { trackThinkingTime } from './trackThinkingTime.js';

// Function to extract the model information
function getModelInfo() {
  console.log("GETTING MODEL INFO");
  
  // Query the button element using its data-testid attribute
  const modelButton = document.querySelector('button[data-testid="model-switcher-dropdown-button"]');
  console.log("MODEL BUTTON", modelButton);

  if (modelButton) {
    // Extract the inner text that contains the model information
    const modelText = modelButton.innerText;
    console.log("MODEL TEXT", modelText);
    return modelText;
  }

  // Check for customGptButton if modelButton is not found
  const customGptButton = document.querySelector('div[data-testid="undefined-button"]');
  console.log("CUSTOM GPT BUTTON", customGptButton);

  if (customGptButton) {
    // Extract the inner text that contains the custom model information
    const customModelText = customGptButton.innerText;
    console.log("CUSTOM MODEL TEXT", customModelText);
    return customModelText;
  }

  return null;
}

export async function sendMessageToSupabase({ role, message, rank, messageId, providerChatId }) {
  console.log("SENDING MESSAGE TO SUPABASE", { role, message, rank, messageId });
  if (!message) {
    console.warn(`Skipping empty ${role} message for messageId: ${messageId}`);
    return;
  }

  // Extract the model information
  const model = getModelInfo();
  console.log("Model used:", model);

  // Track thinking time
  const thinkingTime = await trackThinkingTime();


  // Wait until the provider_chat_id is available
  console.log("PROVIDER CHAT ID", providerChatId);
  console.log(`Sending ${role} message:`, message);
  console.log("Data being sent:", {
    role,
    message,
    rank: rank - 1,
    message_id: messageId,
    provider_chat_id: providerChatId,
    model,
    thinking_time: thinkingTime
  });

  const correctedRank = rank - 1;
  console.log("SENDING MESSAGE TO SUPABASE");
  chrome.runtime.sendMessage({
    type: 'SAVE_MESSAGE',
    data: {
      role,
      message,
      rank: correctedRank,
      message_id: messageId,
      provider_chat_id: providerChatId,
      model, // Include the model information
      thinking_time: thinkingTime // Include the thinking time
    }
  }, (response) => {
    if (response && response.success) {
      console.log(`Successfully saved ${role} message.`);
    } else {
      console.error(`Failed to save ${role} message:`, response?.error);
    }
  });
} 