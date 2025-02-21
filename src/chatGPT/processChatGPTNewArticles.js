import { waitForChatGPTCompleteMessage } from './waitForChatGPTCompleteMessage.js';
import { getTurnNumber } from '../utils/getTurnNumber.js';
import { trackThinkingTime } from '../utils/trackThinkingTime.js';
import { saveMessageToBackend } from '../utils/saveMessageToBackend.js';
import { getChatTitleFromSidebar } from '../utils/getChatTitleFromSidebar.js';
import { saveChatToBackend } from '../utils/saveChatToBackend.js';
/**
 * Process a single conversation article (turn) in ChatGPT.
 *
 * @param {HTMLElement} article - The DOM element for this conversation turn (user or assistant).
 * @param {string} providerChatId - The ID of the chat in ChatGPT / your DB.
 * @param {number} lastProcessedTurn - The highest turn so far. 
 * @param {object} chatHistoryData - The current state of chat history data.
 * @returns {Promise<number>} - The new highest turn number processed.
 */
export async function processChatGPTNewArticles(userId, article, providerChatId, lastProcessedTurn, chatHistoryData) {
  console.log('[ChatGPT Extension] Processing new article:', article);
  const turnNumber = getTurnNumber(article);
  if (turnNumber == null) return lastProcessedTurn;

  // Check if it's user or assistant.
  const userMessageDiv = article.querySelector('div[data-message-author-role="user"]');
  const assistantMessageDiv = article.querySelector('div[data-message-author-role="assistant"]');

  if (userMessageDiv) {
    console.log("We are processing a user message");
    // A user message
    const userMessageId = userMessageDiv.getAttribute('data-message-id');
    const userMessageText = userMessageDiv.innerText.trim();
    console.log("message text", userMessageText);

    // 1) Store the user message
    await saveMessageToBackend({
      userId,
      role: 'user',
      message: userMessageText,
      rank: turnNumber - 1,   // or turnNumber - 1 if you still want offset
      messageId: userMessageId,
      providerChatId,
    });
    console.log("user message stored");
    console.log("===============================================");
    // 2) Wait for the assistant message to appear (turnNumber+1)
    console.log("Waiting for assistant message to appear...");
    const nextTurnNumber = turnNumber + 1;
    const assistantElement = await waitForChatGPTCompleteMessage(nextTurnNumber);
    if (assistantElement) {
      const thinkingTime = await trackThinkingTime();
      const assistantMsgId = assistantElement.getAttribute('data-message-id');
      const assistantMsgText = assistantElement.innerText.trim();
      console.log("After user message we have waited and stored the assistant answer", assistantMsgText);

      await saveMessageToBackend({
        userId,
        role: 'assistant',
        message: assistantMsgText,
        rank: nextTurnNumber - 1,
        messageId: assistantMsgId,
        providerChatId,
        thinkingTime,
      });
      console.log("assistant message stored");

      // Check if the chat title has changed
      const currentTitle = getChatTitleFromSidebar(providerChatId);
      if (currentTitle && currentTitle !== chatHistoryData.savedChatName) {
        console.log('[ChatGPT Extension] Chat title has changed:', currentTitle);
        saveChatToBackend({ userId, chatId: providerChatId, chatTitle: currentTitle, providerName: 'chatGPT' });
        chatHistoryData.savedChatName = currentTitle;
      }

      return nextTurnNumber;
    }
    // If no assistant found, just return turnNumber
    return turnNumber;

  } else if (assistantMessageDiv) {
    console.log("!!!!!!!!!!!!!!! We are starting by processing an assistant message");
    // If it is an assistant message that appears on its own,
    // it means we did NOT just see a brand-new user message in this pass. 
    // For instance: page reloaded, or some partial load scenario. 
    // We handle it once (if not processed) so we do NOT store the preceding user message again.

    const assistantMsgId = assistantMessageDiv.getAttribute('data-message-id');
    const assistantMsgText = assistantMessageDiv.innerText.trim();
    console.log("Processing ASSISTANT message:", assistantMsgText);
    console.log("turn number", turnNumber);

    const thinkingTime = await trackThinkingTime();
    await saveMessageToBackend({
      userId,
      role: 'assistant',
      message: assistantMsgText,
      rank: turnNumber - 1,
      messageId: assistantMsgId,
      providerChatId,
      thinkingTime,
    });

    // Check if the chat title has changed
    const currentTitle = getChatTitleFromSidebar(providerChatId);
    if (currentTitle && currentTitle !== chatHistoryData.savedChatName) {
      console.log('[ChatGPT Extension] Chat title has changed:', currentTitle);
      saveChatToBackend({ userId, chatId: providerChatId, chatTitle: currentTitle, providerName: 'chatGPT' });
      chatHistoryData.savedChatName = currentTitle;
    }

    return turnNumber;
  }

  return lastProcessedTurn;
}
