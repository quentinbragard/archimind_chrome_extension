/**
 * Attempts to read the current chat item from the ChatGPT sidebar.
 * If found, it will send a SAVE_CHAT message to your background script.
 * Returns updated chatHistoryData with `providerChatId` & `savedChatName`.
 */
export function checkChatGPTChatHistory(chatHistoryData) {
  console.log("CHECKING CHAT HISTORY==========", chatHistoryData);

  // Use querySelector to select the unique chat item that has the "var(--sidebar-surface-tertiary)" style
  let currentChatItem = document.querySelector(
    'li[data-testid^="history-item-"] > div[style*="var(--sidebar-surface-tertiary)"]'
  );

  if (!currentChatItem) {
    // fallback: maybe the first item in the list if no "selected" chat is found
    currentChatItem = document.querySelector('li[data-testid^="history-item-0"]');
  }

  if (!currentChatItem) {
    console.warn("No chat item found in sidebar at this moment.");
    return chatHistoryData;
  }

  const chatTitle = currentChatItem.innerText.trim();
  // If the chat name is the same as we already have, no need to re-send
  if (chatHistoryData.savedChatName === chatTitle) {
    return chatHistoryData;
  }

  let chatId = null;
  const liElement = currentChatItem.closest('li');
  if (liElement) {
    const anchor = liElement.querySelector('a[href]');
    if (anchor) {
      const href = anchor.getAttribute('href');
      // Usually matches /c/xxx
      const match = href.match(/\/c\/([^\/\?]+)/);
      if (match) {
        chatId = match[1];
      }
    }
  }

  // If we do get a chatId, let's send a SAVE_CHAT to the background.
  if (chatId) {
    chrome.storage.sync.get('supabaseUserId', (storageData) => {
      const userId = storageData.supabaseUserId || 'default_user';
      chrome.runtime.sendMessage(
        {
          type: 'SAVE_CHAT',
          data: {
            user_id: userId,
            provider_chat_id: chatId,
            title: chatTitle,
            provider_name: 'chatGPT',
          },
        },
        () => {}
      );
    });
  }

  return {
    savedChatName: chatTitle,
    providerChatId: chatId,
  };
}
