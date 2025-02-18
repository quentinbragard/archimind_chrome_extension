import { waitForChatGPTCompleteMessage } from './waitForChatGPTCompleteMessage.js';
import { getTurnNumber } from '../utils/getTurnNumber.js';

/**
 * Processes all new conversation articles, sending messages via sendMessageToSupabase.
 * @param {number} lastProcessedTurn - The last conversation turn that was processed.
 * @param {function} sendMessageToSupabase - The function to send messages.
 * @returns {Promise<number>} - Resolves with the updated lastProcessedTurn value.
 */


export async function processChatGPTNewArticles(lastProcessedTurn, sendMessageToSupabase) {
  const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
  for (const article of articles) {
    console.log("ARTICLE", article);
    const turnNumber = getTurnNumber(article);
    console.log("TURN NUMBER", turnNumber);
    if (turnNumber && turnNumber > lastProcessedTurn) {
      const userMessageDiv = article.querySelector('div[data-message-author-role="user"]');
      if (userMessageDiv) {
        const messageText = userMessageDiv.innerText.trim();
        const messageId = userMessageDiv.getAttribute('data-message-id');
        await sendMessageToSupabase({ type: 'user', message: messageText, rank: turnNumber, messageId });
        // Wait for the assistant message to complete
        waitForChatGPTCompleteMessage(turnNumber + 1).then((textElement) => {
          if (textElement) {
            const text = textElement.innerText.trim();
            const messageId = textElement.getAttribute('data-message-id');
            sendMessageToSupabase({ type: 'assistant', message: text, rank: turnNumber + 1, messageId });
          }
        });
      }
      if (turnNumber > lastProcessedTurn) {
        lastProcessedTurn = turnNumber;
      }
    }
  }
  return lastProcessedTurn;
} 