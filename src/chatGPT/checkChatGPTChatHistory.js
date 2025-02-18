/**
 * Checks the chat history for a new chat with the "tertiary" background.
 * Updates the provided chatHistoryData object with the chat title and provider_chat_id.
 * Also triggers a SAVE_CHAT message to the background script.
 *
 * @param {object} chatHistoryData - Object with properties: savedChatName and globalProviderChatId.
 * @returns {object} The updated chatHistoryData.
 */

export function checkChatGPTChatHistory(chatHistoryData) {
  const newChatItem = document.querySelector('li[data-testid="history-item-0"] > div[style*="var(--sidebar-surface-tertiary)"]');
  if (!newChatItem) return chatHistoryData;
  
  const chatTitle = newChatItem.innerText.trim();
  if (chatHistoryData.savedChatName === chatTitle) return chatHistoryData;
  
  const liElement = newChatItem.closest('li');
  if (!liElement) return chatHistoryData;
  
  const anchor = liElement.querySelector('a[href]');
  if (anchor) {
    const href = anchor.getAttribute('href');
    const match = href.match(/\/c\/([^\/\?]+)/);
    if (match) {
      chatHistoryData.globalProviderChatId = match[1];
    }
  }
  chatHistoryData.savedChatName = chatTitle;
  
  // Trigger SAVE_CHAT message without waiting for a response.
  chrome.storage.sync.get('supabaseUserId', (storageData) => {
    const userId = storageData.supabaseUserId || 'default_user';
    chrome.runtime.sendMessage({
      type: 'SAVE_CHAT',
      data: {
        user_id: userId,
        provider_chat_id: chatHistoryData.globalProviderChatId,
        title: chatTitle,
        provider_name: 'chatGPT'
      }
    }, () => {});
  });
  return chatHistoryData;
} 
