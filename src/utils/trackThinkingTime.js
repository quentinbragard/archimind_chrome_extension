// Function to track the time while the "Stop" button is visible
export function trackThinkingTime() {
  return new Promise((resolve) => {
    let thinkingTime = 0;
    const stopButton = document.querySelector('button[data-testid="stop-button"]');

    if (stopButton) {
      console.log("Stop button found, starting timer...");
      const intervalId = setInterval(() => {
        thinkingTime += 1; // Increment by 1 second
        console.log(`Thinking time: ${thinkingTime} s`);
      }, 1000);

      // Observe the stop button to detect when it disappears
      const observer = new MutationObserver(() => {
        if (!document.body.contains(stopButton)) {
          clearInterval(intervalId);
          console.log(`Final thinking time: ${thinkingTime} ms`);
          //wait 1 second before resolving
          setTimeout(() => {
            observer.disconnect();
            resolve(thinkingTime);
          }, 1000);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      resolve(thinkingTime);
    }
  });
} 