/**
 * Extract the turn number from a conversation article
 * @param {HTMLElement} article - The article element
 * @returns {number|null} Turn number or null if not found
 */
export function getTurnNumber(article) {
    const dataTestId = article.getAttribute('data-testid');
    const match = dataTestId ? dataTestId.match(/conversation-turn-(\d+)/) : null;
    return match ? parseInt(match[1], 10) : null;
  }
  
  /**
   * Get the model info from the UI
   * @returns {string|null} Model name or null if not found
   */
  export function getModelInfo() {
    const modelButton = document.querySelector('button[data-testid="model-switcher-dropdown-button"]');
    if (modelButton) {
      return modelButton.innerText.trim();
    }
    
    // Fallback for custom GPT
    const customGptButton = document.querySelector('div[data-testid="undefined-button"]');
    if (customGptButton) {
      return customGptButton.innerText.trim();
    }
    
    return null;
  }
  
  /**
   * Looks up the chat title from the sidebar
   * @param {string} chatId - Chat ID
   * @returns {string|null} Chat title or null if not found
   */
  export function getChatTitleFromSidebar(chatId) {
    const historyList = document.querySelector('ol');
    if (!historyList) {
      console.log('[Archimind] No history list found.');
      return null;
    }
  
    const sideLink = historyList.querySelector(`a[href="/c/${chatId}"]`);
    if (!sideLink) {
      console.log(`[Archimind] No sidebar link found for chatId: ${chatId}`);
      return null;
    }
  
    const titleDiv = sideLink.querySelector('div[title]');
    const chatTitle = titleDiv
      ? titleDiv.getAttribute('title').trim()
      : sideLink.innerText.trim();
  
    return chatTitle || null;
  }
  
  /**
   * Extracts the user message from an article element
   * @param {HTMLElement} article - The article element
   * @returns {string|null} User message or null if not found
   */
  export function extractUserMessage(article) {
    const userMessageDiv = article.querySelector('div[data-message-author-role="user"]');
    return userMessageDiv ? userMessageDiv.innerText.trim() : null;
  }
  
  /**
   * Extracts the assistant message from an article element
   * @param {HTMLElement} article - The article element
   * @returns {string|null} Assistant message or null if not found
   */
  export function extractAssistantMessage(article) {
    const assistantMessageDiv = article.querySelector('div[data-message-author-role="assistant"]');
    return assistantMessageDiv ? assistantMessageDiv.innerText.trim() : null;
  }
  
  /**
   * Extracts the message ID from an article element
   * @param {HTMLElement} article - The article element
   * @param {string} role - Message role ("user" or "assistant")
   * @returns {string|null} Message ID or null if not found
   */
  export function extractMessageId(article, role) {
    const messageDiv = article.querySelector(`div[data-message-author-role="${role}"]`);
    return messageDiv ? messageDiv.getAttribute('data-message-id') : null;
  }
  
  /**
   * Extracts all conversation turns from the page
   * @returns {Array} Array of turn objects with {turnNumber, userMessage, assistantMessage}
   */
  export function extractAllTurns() {
    const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
    const turns = [];
    
    articles.forEach(article => {
      const turnNumber = getTurnNumber(article);
      if (turnNumber === null) return;
      
      const userMessage = extractUserMessage(article);
      const assistantMessage = extractAssistantMessage(article);
      
      if (userMessage || assistantMessage) {
        turns.push({
          turnNumber,
          userMessage,
          assistantMessage,
          userMessageId: userMessage ? extractMessageId(article, 'user') : null,
          assistantMessageId: assistantMessage ? extractMessageId(article, 'assistant') : null
        });
      }
    });
    
    // Sort by turn number
    return turns.sort((a, b) => a.turnNumber - b.turnNumber);
  }
  
  /**
   * Wait for the ChatGPT message to finish streaming
   * @param {number} turnNumber - Turn number to wait for
   * @param {number} maxTimeMs - Maximum time to wait in milliseconds
   * @returns {Promise<HTMLElement|null>} The message element or null if timed out
   */
  export function waitForCompletedMessage(turnNumber, maxTimeMs = 120000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = 500;
      
      const intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Check if we've exceeded max wait time
        if (elapsed >= maxTimeMs) {
          clearInterval(intervalId);
          resolve(null);
          return;
        }
        
        // Check for the assistant message
        const selector = `article[data-testid="conversation-turn-${turnNumber}"] div[data-message-author-role="assistant"]`;
        const element = document.querySelector(selector);
        
        if (element && element.innerText.trim().length > 0) {
          // Check if stop button is still visible (message still streaming)
          const stopButton = document.querySelector('button[data-testid="stop-button"]');
          
          if (!stopButton) {
            // Message fully loaded
            clearInterval(intervalId);
            resolve(element);
          }
        }
      }, checkInterval);
    });
  }