export function waitForChatGPTCompleteMessage(turnNumber) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const selector = `article[data-testid="conversation-turn-${turnNumber}"] div[data-message-author-role="assistant"]`;
      const element = document.querySelector(selector);
      if (element && element.innerText.trim().length > 0) {
        clearInterval(interval);
        resolve(element);
      }
    }, 500);
    setTimeout(() => {
      clearInterval(interval);
      resolve(null);
    }, 10000);
  });
} 