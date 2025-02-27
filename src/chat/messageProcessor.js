import { processChatGPTNewArticles } from '../chatGPT/processChatGPTNewArticles.js';
import { getChatHistoryData, updateChatTitle } from './chatHistoryManager.js';
import { getChatTitleFromSidebar } from './chatHelpers.js';

// State
let lastProcessedTurn = 0;
let isProcessing = false;

/**
 * Process a new article (message) in the conversation
 * @param {HTMLElement} article - The article element to process
 * @param {string} chatId - The chat ID
 */
export function processNewArticle(article, chatId) {
  const turnNumber = getTurnFromArticle(article);
  if (turnNumber === null || turnNumber <= lastProcessedTurn) return;
  
  // Skip if already processing
  if (isProcessing) return;
  
  // Start processing
  isProcessing = true;
  
  // Process this article
  processChatGPTNewArticles(article, chatId, lastProcessedTurn, getChatHistoryData())
    .then((updatedTurn) => {
      lastProcessedTurn = updatedTurn;
      
      // Check if the chat title has changed
      checkAndUpdateChatTitle(chatId);
    })
    .catch((err) => {
      console.error('❌ Error processing article:', err);
    })
    .finally(() => {
      isProcessing = false;
    });
}

/**
 * Reset message processing state
 */
export function resetMessageProcessing() {
  lastProcessedTurn = 0;
  isProcessing = false;
  console.log('🔄 Message processing reset');
}

/**
 * Extract turn number from article
 * @param {HTMLElement} article - The article element
 * @returns {number|null} Turn number or null
 */
function getTurnFromArticle(article) {
  const dataTestId = article.getAttribute('data-testid');
  const match = dataTestId ? dataTestId.match(/conversation-turn-(\d+)/) : null;
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if the chat title has changed and update if needed
 * @param {string} chatId - The chat ID
 */
function checkAndUpdateChatTitle(chatId) {
  const chatData = getChatHistoryData();
  const currentTitle = getChatTitleFromSidebar(chatId);
  
  if (currentTitle && currentTitle !== 'New Chat' && currentTitle !== chatData.savedChatName) {
    console.log('📝 Chat title has changed:', currentTitle);
    updateChatTitle(currentTitle);
  }
}

/**
 * Get the current processing state
 * @returns {Object} Processing state
 */
export function getProcessingState() {
  return {
    lastProcessedTurn,
    isProcessing
  };
}