import { handleChatIdChange, resetChatHistory } from '../chat/chatHistoryManager.js';
import { resetMessageProcessing } from '../chat/messageProcessor.js';

let currentURL = window.location.href;
let urlCheckInterval = null;
const URL_CHECK_INTERVAL = 1000; // Check every second

/**
 * Start listening for URL changes
 */
export function startUrlChangeListener() {
  if (urlCheckInterval) {
    stopUrlChangeListener();
  }
  
  urlCheckInterval = setInterval(checkForUrlChange, URL_CHECK_INTERVAL);
  console.log('👀 Started URL change listener');
}

/**
 * Stop listening for URL changes
 */
export function stopUrlChangeListener() {
  if (urlCheckInterval) {
    clearInterval(urlCheckInterval);
    urlCheckInterval = null;
    console.log('🛑 Stopped URL change listener');
  }
}

/**
 * Check if the URL has changed and handle the change
 */
function checkForUrlChange() {
  const newURL = window.location.href;
  
  if (newURL !== currentURL) {
    console.log('🔄 URL changed:', newURL);
    currentURL = newURL;
    handleUrlChange(newURL);
  }
}

/**
 * Handle a URL change
 * @param {string} url - The new URL
 */
function handleUrlChange(url) {
  // Check if this is a chat URL
  const chatIdMatch = url.match(/\/c\/([^/?]+)/);
  
  if (chatIdMatch && chatIdMatch[1]) {
    // This is a chat page with a chat ID
    const chatId = chatIdMatch[1].trim();
    console.log('🆔 Chat ID found:', chatId);
    
    // Reset message processing for the new chat
    resetMessageProcessing();
    
    // Initialize chat history tracking with this chat ID
    handleChatIdChange(chatId);
  } else {
    // Not a chat page or no chat ID
    console.log('ℹ️ No chat ID in URL, resetting chat tracking');
    resetChatHistory();
  }
}

/**
 * Get the current URL state
 * @returns {Object} Current URL state
 */
export function getUrlState() {
  return {
    currentURL,
    isMonitoring: !!urlCheckInterval,
    isChatPage: /\/c\/[^/?]+/.test(currentURL),
    chatId: extractChatId(currentURL)
  };
}

/**
 * Extract chat ID from URL if present
 * @param {string} url - URL to extract from
 * @returns {string|null} Chat ID or null
 */
function extractChatId(url) {
  const match = url.match(/\/c\/([^/?]+)/);
  return match && match[1] ? match[1].trim() : null;
}