import { waitForChatGPTCompleteMessage } from './waitForChatGPTCompleteMessage.js';
import { getTurnNumber } from '../utils/getTurnNumber.js';
import { trackThinkingTime } from '../utils/trackThinkingTime.js'; // Updated import path
import { sendMessageToSupabase } from '../utils/sendMessageToSupabase.js';

/**
 * Processes a specific conversation article, sending messages via sendMessageToSupabase.
 * @param {HTMLElement} article - The article element to process.
 * @param {string} role - The role of the message author ('user' or 'assistant').
 * @param {function} sendMessageToSupabase - The function to send messages.
 * @returns {Promise<void>} - Resolves when processing is complete.
 */

export async function processChatGPTNewArticles(article, role, providerChatId) {
  console.log("=======ROLE=========", role);
  console.log("=======PROVIDER CHAT ID=========", providerChatId);
  console.log("=======ARTICLE=========", article);
  const turnNumber = getTurnNumber(article);
  console.log("article rank", turnNumber);

  const messageDiv = article.querySelector(`div[data-message-author-role="${role}"]`);

  if (role === 'user') {
    const messageText = messageDiv.innerText.trim();
    const messageId = messageDiv.getAttribute('data-message-id');
    console.log("USER MESSAGE TEXT", messageText);
    await sendMessageToSupabase({ role, message: messageText, rank: turnNumber, messageId, providerChatId });
    
    // Wait for the assistant message to complete
    const textElement = await waitForChatGPTCompleteMessage(turnNumber + 1);
    if (textElement) {
      const text = textElement.innerText.trim();
      const messageId = textElement.getAttribute('data-message-id');
      await sendMessageToSupabase({ role: 'assistant', message: text, rank: turnNumber + 1, messageId, providerChatId });
      return turnNumber + 1;
    }
    return turnNumber;
  } else if (role === 'assistant') {
    // Track thinking time for assistant messages
    const thinkingTime = await trackThinkingTime();
    console.log(`Thinking time for assistant: ${thinkingTime} seconds`);

    const messageText = messageDiv.innerText.trim();
    const messageId = messageDiv.getAttribute('data-message-id');
    console.log("ASSISTANT MESSAGE TEXT", messageText);
    await sendMessageToSupabase({ role, message: messageText, rank: turnNumber, messageId, thinkingTime, providerChatId });

    // Process the preceding user message
    const userMessageDiv = article.previousElementSibling?.querySelector('div[data-message-author-role="user"]');
    console.log("USER MESSAGE DIV", userMessageDiv);
    if (userMessageDiv) {
      const userMessageText = userMessageDiv.innerText.trim();
      const userMessageId = userMessageDiv.getAttribute('data-message-id');
      console.log("PRECEDING USER MESSAGE TEXT", userMessageText);
      await sendMessageToSupabase({ role: 'user', message: userMessageText, rank: turnNumber - 1, messageId: userMessageId, providerChatId });
    }
    return turnNumber;
  }
  return turnNumber;
} 