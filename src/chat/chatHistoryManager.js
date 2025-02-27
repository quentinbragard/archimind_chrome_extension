import { saveChatToBackend } from '../utils/api.js';
import { getChatTitleFromSidebar } from './chatHelpers.js';

// Chat history state
let chatHistoryData = {
  savedChatName: null,
  providerChatId: null,
};

let titleCheckInterval = null;
const TITLE_CHECK_INTERVAL = 3000; // Check every 3 seconds

/**
 * Initialize chat history tracking
 */
export function initializeChatHistory() {
  // This function is called once during initialization
  // The actual tracking starts when a chat ID is detected
  console.log('🔄 Chat history manager initialized');
}

/**
 * Handle a change in chat ID (new conversation or URL change)
 * @param {string} chatId - The new chat ID
 */
export function handleChatIdChange(chatId) {
  if (!chatId) {
    resetChatHistory();
    return;
  }
  
  console.log('🔄 Handling chat ID change:', chatId);
  
  // Attempt immediate detection of a real title
  const sidebarTitle = getChatTitleFromSidebar(chatId);
  
  // If sidebar is empty or "New Chat", treat as placeholder
  if (!sidebarTitle || sidebarTitle === 'New Chat') {
    const placeholder = `no_title_${Date.now()}`;
    console.log('💬 Saving chat with placeholder title:', placeholder);
    
    startTitleCheckInterval(chatId);
    chatHistoryData = {
      savedChatName: placeholder,
      providerChatId: chatId,
    };
    saveChatToBackend({chatId, chatTitle: placeholder, providerName: 'chatGPT'});
  } else {
    // We found a real title
    console.log('💬 Saving chat with title:', sidebarTitle);
    saveChatToBackend({chatId, chatTitle: sidebarTitle, providerName: 'chatGPT'});
    chatHistoryData = {
      savedChatName: sidebarTitle,
      providerChatId: chatId,
    };
  }
}

/**
 * Start interval to check for chat title updates
 * @param {string} chatId - The chat ID to monitor
 */
function startTitleCheckInterval(chatId) {
  // Clear any existing interval
  if (titleCheckInterval) {
    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }
  
  // Poll for title changes
  titleCheckInterval = setInterval(() => {
    const possibleTitle = getChatTitleFromSidebar(chatId);
    
    // If still no title or it's "New Chat", wait and check again
    if (!possibleTitle || possibleTitle === 'New Chat') {
      return;
    }
    
    // Once we find a real title, update the record
    console.log('📝 Found updated chat title:', possibleTitle);
    
    saveChatToBackend({chatId, chatTitle: possibleTitle, providerName: 'chatGPT'});
    chatHistoryData.savedChatName = possibleTitle;
    
    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }, TITLE_CHECK_INTERVAL);
}

/**
 * Update the title of the current chat
 * @param {string} newTitle - The new title
 */
export function updateChatTitle(newTitle) {
  if (!chatHistoryData.providerChatId || !newTitle) return;
  
  console.log('📝 Manually updating chat title to:', newTitle);
  
  saveChatToBackend({
    chatId: chatHistoryData.providerChatId, 
    chatTitle: newTitle, 
    providerName: 'chatGPT'
  });
  
  chatHistoryData.savedChatName = newTitle;
}

/**
 * Reset chat history tracking (e.g., when navigating away from a chat)
 */
export function resetChatHistory() {
  chatHistoryData = {
    savedChatName: null,
    providerChatId: null,
  };
  
  if (titleCheckInterval) {
    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }
  
  console.log('🧹 Chat history tracking reset');
}

/**
 * Create a fallback history record if we can't parse the chat ID
 * @returns {Object} Fallback history object
 */
export function createFallbackHistory() {
  const chatId = `no_history_${Date.now()}`;
  const chatTitle = `no_title_${Date.now()}`;
  
  saveChatToBackend({chatId, chatTitle, providerName: 'chatGPT'});
  
  return { 
    savedChatName: chatTitle, 
    providerChatId: chatId 
  };
}

/**
 * Get the current chat history data
 * @returns {Object} Current chat history data
 */
export function getChatHistoryData() {
  return { ...chatHistoryData };
}

/**
 * Clean up resources
 */
export function cleanup() {
  if (titleCheckInterval) {
    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }
}