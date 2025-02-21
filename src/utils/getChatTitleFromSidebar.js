/**
 * Looks up the <a href="/c/<chatId>"> in the sidebar, returns a string title or null.
 */
export function getChatTitleFromSidebar(chatId) {
    const historyList = document.querySelector('ol');
    if (!historyList) {
      console.log('[ChatGPT Extension] No history list found.');
      return null;
    }
  
    const sideLink = historyList.querySelector(`a[href="/c/${chatId}"]`);
    if (!sideLink) {
      console.log(`[ChatGPT Extension] No sidebar link found for chatId: ${chatId}`);
      return null;
    }
  
    const titleDiv = sideLink.querySelector('div[title]');
    const chatTitle = titleDiv
      ? titleDiv.getAttribute('title').trim()
      : sideLink.innerText.trim();
  
    console.log(`[ChatGPT Extension] Retrieved chat title: ${chatTitle}`);
    return chatTitle || null;
  }
  