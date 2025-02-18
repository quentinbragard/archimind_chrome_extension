import { getTurnNumber } from './utils/getTurnNumber.js';
import { processChatGPTNewArticles } from './chatGPT/processChatGPTNewArticles.js';
import { checkChatGPTChatHistory } from './chatGPT/checkChatGPTChatHistory.js';


// Keeps track of the highest conversation-turn number processed so far
let lastProcessedTurn = 0;
console.log("LAST PROCESSED TURN", lastProcessedTurn);

// Global object to hold chat history state
let chatHistoryData = {
  savedChatName: null,
  globalProviderChatId: null,
};

// Function to send the message data to the background script for Supabase handling
function sendMessageToSupabase({ type, message, rank, messageId }) {
  return new Promise((resolve, reject) => {
    if (!message) {
      console.warn(`Skipping empty ${type} message for messageId: ${messageId}`);
      return resolve();
    }

    // Update chatHistoryData via the external check function
    console.log("CHECKING CHAT HISTORY");
    chatHistoryData = checkChatGPTChatHistory(chatHistoryData) || chatHistoryData;
    console.log("CHAT HISTORY CHECKED");

    // Wait until the provider_chat_id is available
    if (!chatHistoryData.globalProviderChatId) {
      console.warn(`Waiting for provider_chat_id before sending ${type} message.`);
      setTimeout(() => sendMessageToSupabase({ type, message, rank, messageId }).then(resolve).catch(reject), 2000);
      return;
    }

    console.log(`Sending ${type} message:`, message);
    const correctedRank = rank - 1;
    chrome.runtime.sendMessage({
      type: 'SAVE_MESSAGE',
      data: {
        messageType: type,
        message,
        rank: correctedRank,
        messageId,
        providerChatId: chatHistoryData.globalProviderChatId
      }
    }, (response) => {
      if (response && response.success) {
        console.log(`Successfully saved ${type} message.`);
        resolve();
      } else {
        console.error(`Failed to save ${type} message:`, response?.error);
        reject(response?.error);
      }
    });
  });
}

// Existing MutationObserver setup
const observer = new MutationObserver((mutationsList) => {
  console.log("MUTATION OBSERVER"); 
  mutationsList.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.matches('article[data-testid^="conversation-turn-"]')
      ) {
        console.log("NODE", node);
        const userMessage = node.querySelector('div[data-message-author-role="user"]');
        const assistantMessage = node.querySelector('div[data-message-author-role="assistant"]');
        const turnNumber = getTurnNumber(node);
        console.log("TURN NUMBER====================", turnNumber); 

        if (userMessage || (assistantMessage && turnNumber === 3)) {
          console.log('Relevant article detected, processing...');
          processChatGPTNewArticles(lastProcessedTurn, sendMessageToSupabase)
            .then(updatedTurn => { lastProcessedTurn = updatedTurn; })
            .catch(() => {});
        }
      }
    });
  });
});

// Observe the document body for added nodes in the subtree
observer.observe(document.body, { childList: true, subtree: true });

