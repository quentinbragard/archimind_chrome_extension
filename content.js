// Keeps track of the highest conversation-turn number processed so far
let lastProcessedTurn = 0;

// Global variable to store the saved chat name to avoid duplicate saves.
let savedChatName = null;

// Global variable to store the provider chat ID
let globalProviderChatId = null;

// Utility to extract the numeric part from data-testid attribute
function getTurnNumber(article) {
  const dataTestId = article.getAttribute('data-testid');
  const match = dataTestId && dataTestId.match(/conversation-turn-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Process new articles that have been added to the DOM
async function processNewArticles() {
  const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');

  for (const article of articles) {
    const turnNumber = getTurnNumber(article);
    console.log('Found article with turn number:', turnNumber);

    // Only process articles that haven't been processed yet
    if (turnNumber && turnNumber > lastProcessedTurn) {
      console.log("turn number", turnNumber);
      console.log("article", article);

      const userMessageDiv = article.querySelector('div[data-message-author-role="user"]');
      if (userMessageDiv) {
        const messageText = userMessageDiv.innerText.trim();
        const messageId = userMessageDiv.getAttribute('data-message-id');
        console.log('User message ID:', messageId);
        console.log(`User message (turn ${turnNumber}):`, messageText);

        // Wait for the user message to be saved before proceeding
        await sendMessageToSupabase({ type: 'user', message: messageText, rank: turnNumber, messageId });

        // Use a MutationObserver to wait for the removal of the stop streaming button
        waitForCompleteMessage(turnNumber + 1).then((textElement) => {
          if (textElement) {
            const text = textElement.innerText.trim();
            const messageId = textElement.getAttribute('data-message-id');
            console.log(`Assistant message (turn ${turnNumber + 1}) - streaming ended. Storing message:`, text);
            sendMessageToSupabase({ type: 'assistant', message: text, rank: turnNumber + 1, messageId });
          } else {
            console.warn(`No text element found for assistant message (turn ${turnNumber + 1})`);
          }
        });
      }
      // Update the last processed turn
      lastProcessedTurn = Math.max(lastProcessedTurn, turnNumber);
      console.log('Updated last processed turn to:', lastProcessedTurn);
    }
  }
}

// Helper function: Wait until the stream has ended and the element's innerText is non-empty.
function waitForCompleteMessage(turnNumber, timeout = 120000) {
  console.log("WE TRY TO PROCESS ASSISTANT ANSWER");
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      setTimeout(() => {
        const stopButton = document.querySelector('button[data-testid="stop-button"]');

        if (!stopButton) {
          console.log("========STOP BUTTON NOT FOUND=========");
          const newArticle = document.querySelector(`article[data-testid^="conversation-turn-${turnNumber}"]`);
          console.log('New article:', newArticle);
          if (newArticle) {
            const textElement = newArticle.querySelector('div[data-message-author-role="assistant"]');
            if (textElement) {
              const text = textElement.innerText.trim();
              console.log('Text element:', textElement, 'Text:', text);
              observer.disconnect();
              resolve(textElement);
            } else {
              console.warn('No assistant message div found in new article');
              resolve(null);
            }
          } else {
            console.warn('No new article found for turn number:', turnNumber);
            resolve(null);
          }
        }
      }, 1000);
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// Function to send the message data to the background script for Supabase handling
function sendMessageToSupabase({ type, message, rank, messageId }) {
  return new Promise((resolve, reject) => {
    if (!message) {
      console.warn(`Skipping empty ${type} message for messageId: ${messageId}`);
      return resolve();
    }

    // Run checkChatHistory to ensure provider_chat_id is set
    checkChatHistory();

    // Wait until the provider_chat_id is available
    if (!globalProviderChatId) {
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
        providerChatId: globalProviderChatId // Include provider_chat_id
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
        const userMessage = node.querySelector('div[data-message-author-role="user"]');
        const assistantMessage = node.querySelector('div[data-message-author-role="assistant"]');
        const turnNumber = getTurnNumber(node);

        if (userMessage || (assistantMessage && turnNumber === 3)) {
          console.log('Relevant article detected, processing...');
          processNewArticles();
        }
      }
    });
  });
});

// Observe the document body for added nodes in the subtree
observer.observe(document.body, { childList: true, subtree: true });

// Function to check the chat history list for an updated chat name.
function checkChatHistory() {
  // Look for the first history item that uses the tertiary background color.
  const newChatItem = document.querySelector('li[data-testid="history-item-0"] > div[style*="var(--sidebar-surface-tertiary)"]');
  if (!newChatItem) {
    console.log("No new chat item with tertiary background found, waiting...");
    return; // If not found, we simply wait.
  }

  // Get the chat title from this element.
  const chatTitle = newChatItem.innerText.trim();
  console.log("Detected chat title:", chatTitle);

  // If we've already saved this chat name, do not trigger again.
  if (savedChatName === chatTitle) {
    return;
  }
  

  // Locate the list item so we can extract the anchor with the href.
  const liElement = newChatItem.closest('li');
  if (!liElement) {
    console.warn("Could not find parent li element for new chat item");
    return;
  }

  // Extract the provider chat id from the href on the <a> element (assumed format: /c/{chat_id}).
  const anchor = liElement.querySelector('a[href]');
  if (anchor) {
    const href = anchor.getAttribute('href');
    const match = href.match(/\/c\/([^\/\?]+)/);
    if (match) {
      globalProviderChatId = match[1];
    }
  }

  // Update our global variable so we don't save the same chat repeatedly.
  savedChatName = chatTitle;

  // Get the user id from chrome storage and send a SAVE_CHAT message.
  chrome.storage.sync.get('supabaseUserId', (storageData) => {
    const userId = storageData.supabaseUserId || 'default_user';
    console.log("userId", userId);  
    console.log("providerChatId", globalProviderChatId);
    console.log("chatTitle", chatTitle);
    chrome.runtime.sendMessage({
      type: 'SAVE_CHAT',
      data: {
        user_id: userId,
        provider_chat_id: globalProviderChatId,
        title: chatTitle,
        provider_name: 'chatGPT'
      }
    }, (response) => {
      if (response && response.success) {
        console.log("Chat saved successfully:", chatTitle);
      } else {
        console.error("Failed to save chat:", response?.error);
      }
    });
  });
}
