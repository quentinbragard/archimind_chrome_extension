import { waitForCompletedMessage, extractMessageId, extractUserMessage, extractAssistantMessage, getTurnNumber } from '../chat/chatHelpers.js';
import { saveMessageToBackend } from '../utils/api.js';
import { updateChatTitle, getChatHistoryData } from '../chat/chatHistoryManager.js';
import { getChatTitleFromSidebar } from '../chat/chatHelpers.js';
import { trackThinkingTime } from '../chat/thinkingTimeTracker.js';

/**
 * Process a single conversation article (turn) in ChatGPT.
 *
 * @param {HTMLElement} article - The DOM element for this conversation turn
 * @param {string} providerChatId - The ID of the chat
 * @param {number} lastProcessedTurn - The highest turn number processed so far
 * @param {object} chatHistoryData - Current state of chat history data
 * @returns {Promise<number>} - The new highest turn number processed
 */
export async function processChatGPTNewArticles(article, providerChatId, lastProcessedTurn, chatHistoryData) {
  try {
    console.log('[Archimind] Processing article:', article);
    
    // Get turn number for this article
    const turnNumber = getTurnNumber(article);
    if (turnNumber === null) {
      console.log('[Archimind] No turn number found, skipping');
      return lastProcessedTurn;
    }
    
    // Determine if it's a user or assistant message
    const isUserMessage = !!article.querySelector('div[data-message-author-role="user"]');
    const isAssistantMessage = !!article.querySelector('div[data-message-author-role="assistant"]');
    
    if (isUserMessage) {
      return await processUserMessage(article, turnNumber, providerChatId, chatHistoryData);
    } else if (isAssistantMessage) {
      return await processAssistantMessage(article, turnNumber, providerChatId, chatHistoryData);
    }
    
    return lastProcessedTurn;
  } catch (error) {
    console.error('[Archimind] Error processing article:', error);
    return lastProcessedTurn;
  }
}

/**
 * Process a user message from the conversation
 * 
 * @param {HTMLElement} article - The article element containing the user message
 * @param {number} turnNumber - Turn number for this message
 * @param {string} providerChatId - The chat ID
 * @param {object} chatHistoryData - Current chat history data
 * @returns {Promise<number>} - Updated last processed turn
 */
async function processUserMessage(article, turnNumber, providerChatId, chatHistoryData) {
  try {
    console.log('[Archimind] Processing user message');
    
    // Extract message data
    const messageId = extractMessageId(article, 'user');
    const messageText = extractUserMessage(article);
    
    if (!messageId || !messageText) {
      console.warn('[Archimind] Invalid user message data, skipping');
      return turnNumber;
    }
    
    // Save the user message
    await saveMessageToBackend({
      role: 'user',
      message: messageText,
      rank: turnNumber - 1,
      messageId: messageId,
      providerChatId,
    });
    
    console.log('[Archimind] User message stored');
    
    // Wait for the assistant response (next turn)
    console.log('[Archimind] Waiting for assistant response...');
    const nextTurnNumber = turnNumber + 1;
    const assistantElement = await waitForCompletedMessage(nextTurnNumber);
    
    if (assistantElement) {
      const thinkingTime = await trackThinkingTime();
      const assistantMsgId = assistantElement.getAttribute('data-message-id');
      const assistantMsgText = assistantElement.innerText.trim();
      
      console.log('[Archimind] Assistant response received, storing...');
      
      await saveMessageToBackend({
        role: 'assistant',
        message: assistantMsgText,
        rank: nextTurnNumber - 1,
        messageId: assistantMsgId,
        providerChatId,
        thinkingTime,
      });
      
      console.log('[Archimind] Assistant message stored');
      
      // Check if the chat title has changed
      checkAndUpdateChatTitle(providerChatId, chatHistoryData);
      
      return nextTurnNumber;
    }
    
    // If no assistant found, just return the current turn
    return turnNumber;
  } catch (error) {
    console.error('[Archimind] Error processing user message:', error);
    return turnNumber;
  }
}

/**
 * Process an assistant message from the conversation
 * 
 * @param {HTMLElement} article - The article element containing the assistant message
 * @param {number} turnNumber - Turn number for this message
 * @param {string} providerChatId - The chat ID
 * @param {object} chatHistoryData - Current chat history data
 * @returns {Promise<number>} - Updated last processed turn
 */
async function processAssistantMessage(article, turnNumber, providerChatId, chatHistoryData) {
  try {
    console.log('[Archimind] Processing assistant message');
    
    // Extract message data
    const assistantMsgId = extractMessageId(article, 'assistant');
    const assistantMsgText = extractAssistantMessage(article);
    
    if (!assistantMsgId || !assistantMsgText) {
      console.warn('[Archimind] Invalid assistant message data, skipping');
      return turnNumber;
    }
    
    // Get thinking time
    const thinkingTime = await trackThinkingTime();
    
    // Save the assistant message
    await saveMessageToBackend({
      role: 'assistant',
      message: assistantMsgText,
      rank: turnNumber - 1,
      messageId: assistantMsgId,
      providerChatId,
      thinkingTime,
    });
    
    console.log('[Archimind] Assistant message stored');
    
    // Check if the chat title has changed
    checkAndUpdateChatTitle(providerChatId, chatHistoryData);
    
    return turnNumber;
  } catch (error) {
    console.error('[Archimind] Error processing assistant message:', error);
    return turnNumber;
  }
}

/**
 * Check if the chat title has changed and update if needed
 * 
 * @param {string} chatId - The chat ID
 * @param {object} chatHistoryData - Current chat history data
 */
function checkAndUpdateChatTitle(chatId, chatHistoryData) {
  try {
    const currentTitle = getChatTitleFromSidebar(chatId);
    
    if (currentTitle && 
        currentTitle !== 'New Chat' && 
        currentTitle !== chatHistoryData.savedChatName) {
      console.log('[Archimind] Chat title has changed:', currentTitle);
      updateChatTitle(currentTitle);
    }
  } catch (error) {
    console.error('[Archimind] Error checking/updating chat title:', error);
  }
}