import { getTurnNumber } from './utils/getTurnNumber.js';
import { processChatGPTNewArticles } from './chatGPT/processChatGPTNewArticles.js';
import { checkChatGPTChatHistory } from './chatGPT/checkChatGPTChatHistory.js';

// Keeps track of the highest conversation-turn number processed so far
let lastProcessedTurn = 0;
// Global object to hold chat history state
let chatHistoryData = {
  savedChatName: null,
  providerChatId: null,
};

// Add a Set to track processed message IDs at the top of the file
let processedMessageIds = new Set();

async function initializeChatHistory() {
  chatHistoryData = await waitForProviderChatId(chatHistoryData);
  console.log("INITIALIZED CHAT HISTORY", chatHistoryData);
}

function waitForProviderChatId(chatHistoryData) {
  return new Promise((resolve, reject) => {
    const historyList = document.querySelector('ol');
    const hasHistoryItems = historyList && historyList.querySelector('li[data-testid^="history-item-"]');

    if (!hasHistoryItems) {
      console.warn("No history items found. Setting providerChatId to 'no_history'.");
      if (!chatHistoryData.providerChatId) {
        let chatId = `no_history_${Date.now()}`;
        let chatTitle = `no_title_${Date.now()}`;
         // Trigger SAVE_CHAT message without waiting for a response.

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
        resolve(checkChatGPTChatHistory({
          providerChatId: chatId,
          savedChatName: chatTitle
        }));
      }
    }

    if (chatHistoryData.providerChatId && chatHistoryData.savedChatName) {
      resolve(checkChatGPTChatHistory(chatHistoryData));
    }

    // Wait 3 seconds before checking the provider chat ID
    setTimeout(() => {
      console.log("CHECKING PROVIDER CHAT ID...");
      if (chatHistoryData.providerChatId) {
        resolve(checkChatGPTChatHistory(chatHistoryData));
      } else {
        reject(new Error('Provider chat ID not found.'));
      }
    }, 3000); // Wait for 3 seconds
  });
}

initializeChatHistory().then(() => {
  // Set up a MutationObserver to watch for changes in the document
  const observer = new MutationObserver(async () => {  // Make the callback async
    console.log("MUTATION OBSERVER TRIGGERED");
    const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
    console.log("ARTICLES", articles);
    
    // Use for...of instead of forEach for sequential processing
    for (const article of articles) {
      const turnNumber = getTurnNumber(article);
      console.log("TURN NUMBER", turnNumber); 
      console.log("LAST PROCESSED TURN", lastProcessedTurn);
      
      // Check if we've already processed this message
      const messageId = article.querySelector('div[data-message-id]')?.getAttribute('data-message-id');
      if (messageId && processedMessageIds.has(messageId)) {
        console.log('Message already processed, skipping:', messageId);
        continue;
      }

      if (turnNumber > lastProcessedTurn) {
        const userMessage = article.querySelector('div[data-message-author-role="user"]');
        const assistantMessage = article.querySelector('div[data-message-author-role="assistant"]');
        const role = userMessage ? 'user' : (assistantMessage ? 'assistant' : '');
        
        if (messageId) {
          processedMessageIds.add(messageId);
        }
        
        console.log('Processing article:', article);
        lastProcessedTurn = await processChatGPTNewArticles(article, role, chatHistoryData.providerChatId);
      }
    }
    console.log("LAST PROCESSED TURN", lastProcessedTurn);
  });

  // Observe the document body for added nodes in the subtree
  observer.observe(document.body, { childList: true, subtree: true });
});

