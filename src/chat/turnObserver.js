import { getTurnNumber } from './chatHelpers.js';
import { processNewArticle } from './messageProcessor.js';
import { getChatHistoryData } from './chatHistoryManager.js';

// State
let observer = null;
const processedMessageIds = new Set();

/**
 * Start observing for new conversation turns
 */
export function startMessageObserver() {
  if (observer) {
    stopMessageObserver();
  }
  
  observer = new MutationObserver(handleDOMChanges);
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  console.log('👀 Started observing for new conversation turns');
}

/**
 * Stop observing for new conversation turns
 */
export function stopMessageObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log('🛑 Stopped conversation observer');
  }
}

/**
 * Clear the list of processed message IDs
 */
export function resetProcessedMessages() {
  processedMessageIds.clear();
  console.log('🧹 Reset processed message IDs');
}

/**
 * Handle DOM mutations to detect new conversation turns
 */
function handleDOMChanges() {
  const chatData = getChatHistoryData();
  
  // Skip if we don't have a valid chat ID
  if (!chatData.providerChatId) {
    return;
  }
  
  // Find all conversation turn articles
  const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
  if (!articles || !articles.length) return;
  
  // Process each article
  for (const article of articles) {
    const turnNumber = getTurnNumber(article);
    if (turnNumber === null) continue;
    
    // Get message ID
    const messageDiv = article.querySelector('div[data-message-id]');
    if (!messageDiv) continue;
    
    const messageId = messageDiv.getAttribute('data-message-id');
    if (!messageId) continue;
    
    // Skip already processed messages
    if (processedMessageIds.has(messageId)) {
      continue;
    }
    
    // Mark as processed
    processedMessageIds.add(messageId);
    
    // Process the new article
    processNewArticle(article, chatData.providerChatId);
  }
}

/**
 * Get the set of processed message IDs (for testing/debugging)
 * @returns {Set} Set of processed message IDs
 */
export function getProcessedMessageIds() {
  return new Set(processedMessageIds);
}