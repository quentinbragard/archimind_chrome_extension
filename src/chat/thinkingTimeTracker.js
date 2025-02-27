/**
 * Tracks the time while the ChatGPT "Stop" button is visible,
 * which indicates that the model is generating a response.
 * 
 * @returns {Promise<number>} The thinking time in seconds
 */
export function trackThinkingTime() {
    return new Promise((resolve) => {
      let thinkingTime = 0;
      const stopButton = document.querySelector('button[data-testid="stop-button"]');
      
      // If stop button is not found, return 0 immediately
      if (!stopButton) {
        console.log('[Archimind] Stop button not found, assuming thinking already complete');
        resolve(0);
        return;
      }
      
      console.log('[Archimind] Stop button found, starting thinking time measurement');
      
      // Start timer to track thinking time
      const intervalId = setInterval(() => {
        thinkingTime += 0.1; // Increment by 100ms
        
        // Log less frequently to avoid console spam
        if (Math.floor(thinkingTime * 10) % 10 === 0) {
          console.log(`[Archimind] Thinking time: ${thinkingTime.toFixed(1)}s`);
        }
      }, 100);
      
      // Observe the stop button to detect when it disappears
      const observer = new MutationObserver(() => {
        if (!document.body.contains(stopButton)) {
          clearInterval(intervalId);
          console.log(`[Archimind] Final thinking time: ${thinkingTime.toFixed(2)}s`);
          
          // Wait a brief moment to ensure the response is fully loaded
          setTimeout(() => {
            observer.disconnect();
            resolve(thinkingTime);
          }, 500);
        }
      });
      
      // Start observing the document body for changes
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      // Fallback in case the stop button never disappears
      // (should not happen, but just in case)
      setTimeout(() => {
        if (intervalId) {
          clearInterval(intervalId);
          observer.disconnect();
          console.log(`[Archimind] Thinking time measurement timeout reached: ${thinkingTime.toFixed(2)}s`);
          resolve(thinkingTime);
        }
      }, 300000); // 5 minutes max
    });
  }
  
  /**
   * Analyzes thinking time to estimate complexity
   * 
   * @param {number} thinkingTime - Thinking time in seconds
   * @returns {string} Complexity category (simple, moderate, complex)
   */
  export function getComplexityFromThinkingTime(thinkingTime) {
    if (thinkingTime < 2) {
      return 'simple';
    } else if (thinkingTime < 10) {
      return 'moderate';
    } else {
      return 'complex';
    }
  }
  
  /**
   * Gets an estimate of the energy used based on thinking time
   * 
   * @param {number} thinkingTime - Thinking time in seconds
   * @param {string} model - Model name (optional)
   * @returns {number} Estimated energy usage in watts
   */
  export function estimateEnergyUsage(thinkingTime, model = '') {
    // Base energy factor (very rough approximation)
    let energyFactor = 0.01; // watts per second
    
    // Adjust based on model if provided
    if (model.toLowerCase().includes('gpt-4')) {
      energyFactor = 0.025; // Higher for more complex models
    }
    
    return thinkingTime * energyFactor;
  }