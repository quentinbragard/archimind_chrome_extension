/**
 * Checks the chat history for a new chat with the "tertiary" background.
 * Updates the provided chatHistoryData object with the chat title and provider_chat_id.
 * Also triggers a SAVE_CHAT message to the background script.
 *
 * @param {object} chatHistoryData - Object with properties: savedChatName and providerChatId.
 * @returns {object} The updated chatHistoryData.
 */

export function checkChatGPTChatHistory(chatHistoryData) {
  console.log("CHECKING CHAT HISTORY==========", chatHistoryData);


  // Use querySelector to select the unique chat item
  let currentChatItem = document.querySelector('li[data-testid^="history-item-"] > div[style*="var(--sidebar-surface-tertiary)"]');

  if (!currentChatItem) {
    console.warn("No CURRENT CHAT ITEM found. Checking for first item...");
    // Check for the first item if no current chat item is found
    currentChatItem = document.querySelector('li[data-testid^="history-item-0"]');
  }

  if (!currentChatItem) {
    console.warn("No chat item found.");
    return chatHistoryData;
  }

  console.log("CHAT ITEM", currentChatItem);

  const chatTitle = currentChatItem.innerText.trim();
  
  if (chatHistoryData.savedChatName === chatTitle) return chatHistoryData;
  let chatId = null;

  const liElement = currentChatItem.closest('li');
  if (!liElement) return chatHistoryData;

  const anchor = liElement.querySelector('a[href]');
  if (anchor) {
    const href = anchor.getAttribute('href');
    const match = href.match(/\/c\/([^\/\?]+)/);
    if (match) {
      chatId = match[1];
    }
  }

  // Trigger SAVE_CHAT message without waiting for a response.
  if (chatId) {
    chrome.storage.sync.get('supabaseUserId', (storageData) => {
      const userId = storageData.supabaseUserId || 'default_user';
      chrome.runtime.sendMessage({
        type: 'SAVE_CHAT',
        data: {
          user_id: userId,
          provider_chat_id: chatId,
          title: chatTitle,
          provider_name: 'chatGPT'
        }
      }, () => {});
    });
  }

  return {
    savedChatName: chatTitle,
    providerChatId: chatId
  };
}
