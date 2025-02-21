// Extract the model information
export function getModelInfo() {
    
    const modelButton = document.querySelector('button[data-testid="model-switcher-dropdown-button"]');
    if (modelButton) {
      return modelButton.innerText.trim();
    }
    // fallback for custom GPT
    const customGptButton = document.querySelector('div[data-testid="undefined-button"]');
    if (customGptButton) {
      return customGptButton.innerText.trim();
    }
    return null;
  }