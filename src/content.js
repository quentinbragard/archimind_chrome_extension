import { getTurnNumber } from './utils/getTurnNumber.js';
import { getUserId } from './utils/getUserId.js'
import { saveChatToBackend } from './utils/saveChatToBackend.js';
import { processChatGPTNewArticles } from './chatGPT/processChatGPTNewArticles.js';
import { getChatTitleFromSidebar } from './utils/getChatTitleFromSidebar.js';

let chatHistoryData = {
  savedChatName: null,
  providerChatId: null,
};
let lastProcessedTurn = 0;
const processedMessageIds = new Set();

let currentURL = window.location.href;
let observer = null;
let titleCheckInterval = null;
let userId = null;

// ============= ENTRY POINTS =============
init();

/** Main init: called once on script load */
async function init() {
  userId = await getUserId();
  if (!userId) {
    console.error('Supabase user ID not set.');
    return;
  }
  handleUrlChange();
  // Start the MutationObserver regardless, but its callback will bail out if no chat provider ID is set.
  startMutationObserver();
  listenForUrlChanges();
}

/**
 * Checks the current URL for a chatId ( /c/<chatId> ).
 * If found, tries to get the title from the sidebar or uses a placeholder if we see "New Chat" or no sidebar item.
 */
function handleUrlChange() {
  const url = window.location.href;

  // If no /c/<chatId> => nothing to do (home page or brand new conversation not yet started)
  if (!/\/c\/[^/]+/.test(url)) {
    console.log('[ChatGPT Extension] No chat provider ID in URL.');
    chatHistoryData = { savedChatName: null, providerChatId: null };
    return;
  }

  // Extract the chatId
  const match = url.match(/\/c\/([^/?]+)/);
  if (!match || !match[1]) {
    chatHistoryData = fallbackNoHistory();
    return;
  }

  const chatId = match[1].trim();
  console.log('[ChatGPT Extension] Found chatId:', chatId);

  // Attempt immediate detection of a real title:
  const sidebarTitle = getChatTitleFromSidebar(chatId);

  // If sidebar is empty or "New Chat", treat as placeholder
  if (!sidebarTitle || sidebarTitle === 'New Chat') {
    const placeholder = `no_title_${Date.now()}`;
    console.log('Saving chat with placeholder title:', placeholder);

    startTitleCheckInterval(chatId);
    chatHistoryData = {
        savedChatName: placeholder,
        providerChatId: chatId,
      };
    saveChatToBackend({userId, chatId, chatTitle:placeholder, providerName: 'chatGPT'});
  } else {
    // We found a real title
    console.log('Saving chat with title:', sidebarTitle);
    saveChatToBackend({userId, chatId, chatTitle:sidebarTitle, providerName: 'chatGPT'});
    chatHistoryData = {
      savedChatName: sidebarTitle,
      providerChatId: chatId,
    };
  }
}


/**
 * Sets an interval to keep checking if the conversation's real title
 * has replaced "New Chat" (or is no longer missing).
 */
function startTitleCheckInterval(chatId) {
  // Clear any existing interval
  if (titleCheckInterval) {
    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }

  // Poll every 3 seconds
  titleCheckInterval = setInterval(() => {
    const possibleTitle = getChatTitleFromSidebar(chatId);

    // If still no title or it's "New Chat", wait 5 seconds and check again
    if (!possibleTitle || possibleTitle === 'New Chat') {
      return;
    }
    // Once we find a real title, update the record
    console.log('[ChatGPT Extension] Found updated title:', possibleTitle);

    saveChatToBackend({userId, chatId, chatTitle:possibleTitle, providerName: 'chatGPT'});
    chatHistoryData.savedChatName = possibleTitle;

    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }, 3000);
}

/** Creates a fallback "no_history" record if we can't parse the chatId. */
function fallbackNoHistory() {
  const chatId = `no_history_${Date.now()}`;
  const chatTitle = `no_title_${Date.now()}`;
  saveChatToBackend({userId, chatId, chatTitle, providerName: 'chatGPT'});
  return { savedChatName: chatTitle, providerChatId: chatId };
}

// ============ MutationObserver for new messages ============
let isProcessing = false;

function processNewArticleIfNotRunning(article) {
  if (isProcessing) return; // Skip if processing is already underway

  isProcessing = true;
  processChatGPTNewArticles(userId, article, chatHistoryData.providerChatId, lastProcessedTurn, chatHistoryData)
    .then((updatedTurn) => {
      lastProcessedTurn = updatedTurn;
    })
    .catch((err) => {
      console.error('[ChatGPT Extension] Error in processChatGPTNewArticles:', err);
    })
    .finally(() => {
      isProcessing = false;
    });
}


function startMutationObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    // Check if a valid chat provider ID is set; if not, skip processing messages.
    if (!chatHistoryData.providerChatId) {
      return;
    }

    const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
    if (!articles || !articles.length) return;

    for (const article of articles) {
        const turnNumber = getTurnNumber(article);
        if (turnNumber == null) continue;
      
        const messageId = article.querySelector('div[data-message-id]')?.getAttribute('data-message-id');
        if (!messageId) continue;
      
        if (processedMessageIds.has(messageId)) {
          continue;
        }
        processedMessageIds.add(messageId);
      
        if (turnNumber > lastProcessedTurn) {
          processNewArticleIfNotRunning(article);
        }
      }
      
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ============ Detect URL changes ============
function listenForUrlChanges() {
  setInterval(() => {
    if (window.location.href !== currentURL) {
      console.log('[ChatGPT Extension] URL changed:', window.location.href);
      currentURL = window.location.href;

      processedMessageIds.clear();
      lastProcessedTurn = 0;

      handleUrlChange();
    }
  }, 1000);
}
