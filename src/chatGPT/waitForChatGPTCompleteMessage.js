/**
 * Wait up to 10 seconds for the assistant message in the *next* turn 
 * to finish streaming. Return the relevant <div> if found, else null.
 * 
 * @param {number} turnNumber - The turn we expect for the assistant.
 * @returns {Promise<HTMLElement|null>}
 */
export function waitForChatGPTCompleteMessage(turnNumber) {
  return new Promise((resolve) => {
    const checkInterval = 500;
    const maxTime = 1200000; // 120 seconds
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += checkInterval;
      const selector = `article[data-testid="conversation-turn-${turnNumber}"] div[data-message-author-role="assistant"]`;
      const element = document.querySelector(selector);
      if (element && element.innerText.trim().length > 0) {
        clearInterval(interval);
        resolve(element);
      } else if (elapsed >= maxTime) {
        clearInterval(interval);
        resolve(null);
      }
    }, checkInterval);
  });
}
