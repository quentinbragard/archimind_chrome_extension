// Keeps track of the highest conversation-turn number processed so far
let lastProcessedTurn = 0;

// Utility to extract the numeric part from data-testid attribute
function getTurnNumber(article) {
  const dataTestId = article.getAttribute('data-testid');
  const match = dataTestId && dataTestId.match(/conversation-turn-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Process new articles that have been added to the DOM
function processNewArticles() {
  console.log('Hello World'); // Log message when processing new articles
  console.log('Processing new articles...');
  // Select all articles that represent conversation turns
  const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');

  articles.forEach((article) => {
    const turnNumber = getTurnNumber(article);
    console.log('Found article with turn number:', turnNumber);

    // Only process articles that haven't been processed yet
    if (turnNumber && turnNumber > lastProcessedTurn) {
      // Find the nested div containing the message text for user messages
      const userMessageDiv = article.querySelector('div[data-message-author-role="user"]');
      // Find the nested div containing the message text for assistant messages
      const assistantMessageDiv = article.querySelector('div[data-message-author-role="assistant"]');

      if (userMessageDiv) {
        console.log('User message div found');  
        const messageText = userMessageDiv.innerText.trim();
        const messageId = userMessageDiv.getAttribute('data-message-id');
        console.log('User message ID:', messageId); 
        console.log(`User message (turn ${turnNumber}):`, messageText);
        // Save the user message to Supabase
        sendMessageToSupabase({ type: 'user', message: messageText, rank: turnNumber, messageId });
      }

      if (assistantMessageDiv) {
        const messageText = assistantMessageDiv.innerText.trim();
        const messageId = assistantMessageDiv.getAttribute('data-message-id');
        console.log(`Assistant message (turn ${turnNumber}):`, messageText);
        // Save the assistant message to Supabase
        sendMessageToSupabase({ type: 'assistant', message: messageText, rank: turnNumber, messageId });
      }

      // Update the last processed turn
      lastProcessedTurn = Math.max(lastProcessedTurn, turnNumber);
      console.log('Updated last processed turn to:', lastProcessedTurn);
    }
  });
}

// Function to send the message data to the background script for Supabase handling
function sendMessageToSupabase({ type, message, rank, messageId }) {
  console.log(`Sending ${type} message to background script:`, message);
  chrome.runtime.sendMessage({ type: 'SAVE_MESSAGE', data: { messageType: type, message, rank, messageId } }, (response) => {
    if (response && response.success) {
      console.log(`Successfully saved ${type} message.`);
    } else {
      console.error(`Failed to save ${type} message:`, response?.error);
    }
  });
}

// Set up a MutationObserver to watch for new articles in the DOM
const observer = new MutationObserver((mutationsList) => {
  console.log('Mutation observed, processing new articles...');
  processNewArticles();
});

// Observe the document body for added nodes in the subtree
observer.observe(document.body, { childList: true, subtree: true });

// Process any articles already in the DOM when the script loads
console.log('Initial processing of articles in the DOM...');
processNewArticles();
