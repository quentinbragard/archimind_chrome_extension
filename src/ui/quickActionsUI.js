import { showToastNotification } from './notificationsUI.js';

// Define available quick actions
const quickActions = [
  {
    id: 'generate-report',
    icon: '📄',
    title: 'Generate Session Report',
    description: 'Create a detailed report of your ChatGPT usage',
    handler: handleGenerateReport,
    comingSoon: true
  },
  {
    id: 'optimize-prompts',
    icon: '✨',
    title: 'Analyze & Optimize Prompts',
    description: 'Get insights and suggestions for your prompts',
    handler: handleOptimizePrompts,
    comingSoon: true
  },
  {
    id: 'learn-techniques',
    icon: '🧠',
    title: 'Learn Prompting Techniques',
    description: 'Discover tips and tricks for better prompting',
    handler: handleLearnTechniques,
    comingSoon: false
  }
];

/**
 * Renders quick actions in the modal
 */
export function renderQuickActions() {
  const actionsList = document.getElementById('Archimind-actions-list');
  if (!actionsList) return;
  
  // Clear existing actions
  actionsList.innerHTML = '';
  
  // Add quick actions
  quickActions.forEach((action, index) => {
    const listItem = createActionItem(action, index);
    actionsList.appendChild(listItem);
  });
}

/**
 * Creates a quick action list item
 * @param {Object} action - Action object
 * @param {number} index - Index for animation delay
 * @returns {HTMLElement} Action list item
 */
function createActionItem(action, index) {
  const listItem = document.createElement('li');
  listItem.id = action.id;
  listItem.style.setProperty('--item-index', index);
  
  // Add "coming soon" badge if applicable
  const badgeHtml = action.comingSoon ? 
    '<span class="coming-soon-badge">Coming Soon</span>' : '';
  
  listItem.innerHTML = `
    <span class="item-icon">${action.icon}</span>
    <div class="action-content">
      <span class="action-title">${action.title}</span>
      <span class="action-description">${action.description}</span>
    </div>
    ${badgeHtml}
  `;
  
  // Add click handler
  listItem.addEventListener('click', () => {
    action.handler();
  });
  
  return listItem;
}

/**
 * Handler for the Generate Report action
 */
function handleGenerateReport() {
  if (isComingSoon('generate-report')) return;
  
  // Implement report generation logic here
  showToastNotification({
    title: 'Generating Report',
    message: 'Your usage report is being generated. This may take a moment.',
    type: 'info'
  });
  
  // Simulate report generation (would be replaced with actual API call)
  setTimeout(() => {
    showToastNotification({
      title: 'Report Complete',
      message: 'Your usage report has been generated and is ready to view.',
      type: 'success'
    });
  }, 3000);
}

/**
 * Handler for the Optimize Prompts action
 */
function handleOptimizePrompts() {
  if (isComingSoon('optimize-prompts')) return;
  
  // Implement prompt optimization logic here
  showToastNotification({
    title: 'Prompt Analysis',
    message: 'Analyzing your recent prompts to provide optimization suggestions.',
    type: 'info'
  });
}

/**
 * Handler for the Learn Techniques action
 */
function handleLearnTechniques() {
  if (isComingSoon('learn-techniques')) return;
  
  // Show prompting tips (simplified version - would be replaced with richer content)
  showPromptingTips();
}

/**
 * Check if an action is marked as coming soon
 * @param {string} actionId - Action ID
 * @returns {boolean} Whether it's coming soon
 */
function isComingSoon(actionId) {
  const action = quickActions.find(a => a.id === actionId);
  if (action && action.comingSoon) {
    showToastNotification({
      title: 'Coming Soon',
      message: `The "${action.title}" feature is currently in development. Stay tuned!`,
      type: 'info'
    });
    return true;
  }
  return false;
}

/**
 * Shows a dialog with prompting tips
 */
function showPromptingTips() {
  // Remove any existing tips dialog
  const existingDialog = document.getElementById('prompting-tips-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }
  
  // Create tips dialog
  const tipsDialog = document.createElement('div');
  tipsDialog.id = 'prompting-tips-dialog';
  tipsDialog.className = 'tips-dialog';
  
  tipsDialog.innerHTML = `
    <div class="tips-dialog-content">
      <div class="tips-dialog-header">
        <h3>Effective Prompting Techniques</h3>
        <button class="tips-dialog-close">×</button>
      </div>
      <div class="tips-dialog-body">
        <div class="tip-section">
          <h4>1. Be Specific and Clear</h4>
          <p>Clearly state what you're looking for. The more specific your prompt, the better the response.</p>
          <div class="example">
            <p><strong>Instead of:</strong> "Tell me about AI"</p>
            <p><strong>Try:</strong> "Explain the difference between machine learning and deep learning, with 3 examples of each"</p>
          </div>
        </div>
        
        <div class="tip-section">
          <h4>2. Provide Context</h4>
          <p>Include relevant background information to help the model understand your needs.</p>
          <div class="example">
            <p><strong>Instead of:</strong> "Write a response to this email"</p>
            <p><strong>Try:</strong> "I'm a marketing manager responding to a potential client who asked about our pricing. Write a friendly but professional email response."</p>
          </div>
        </div>
        
        <div class="tip-section">
          <h4>3. Specify Format and Length</h4>
          <p>Request specific formats or structures to get more useful responses.</p>
          <div class="example">
            <p><strong>Instead of:</strong> "Give me ideas for my presentation"</p>
            <p><strong>Try:</strong> "Give me 5 bullet points, each with a supporting data point, that I can include in my 10-minute presentation on renewable energy"</p>
          </div>
        </div>
        
        <div class="tip-section">
          <h4>4. Use Step-by-Step Instructions</h4>
          <p>Break down complex requests into clear steps.</p>
          <div class="example">
            <p><strong>Instead of:</strong> "Help me with this coding problem"</p>
            <p><strong>Try:</strong> "I need to create a function that sorts an array of objects by their date property. 1) Explain the approach, 2) Write the function in JavaScript, 3) Show an example usage"</p>
          </div>
        </div>
        
        <div class="tip-section">
          <h4>5. Use the Enhancer Tool</h4>
          <p>Remember to use the Archimind Prompt Enhancer to automatically improve your prompts!</p>
        </div>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(tipsDialog);
  
  // Add styles if needed
  if (!document.getElementById('tips-dialog-styles')) {
    const styles = document.createElement('style');
    styles.id = 'tips-dialog-styles';
    styles.textContent = `
      .tips-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10002;
        animation: fadeIn 0.2s ease;
      }
      
      .tips-dialog-content {
        background: white;
        width: 90%;
        max-width: 700px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        max-height: 85vh;
      }
      
      .tips-dialog-header {
        background: linear-gradient(135deg, #1C4DEB 0%, #153db8 100%);
        color: white;
        padding: 12px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .tips-dialog-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }
      
      .tips-dialog-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .tips-dialog-body {
        padding: 15px;
        overflow-y: auto;
      }
      
      .tip-section {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }
      
      .tip-section:last-child {
        border-bottom: none;
      }
      
      .tip-section h4 {
        color: #1C4DEB;
        margin-top: 0;
        margin-bottom: 8px;
      }
      
      .example {
        background: #f5f7fa;
        padding: 12px;
        border-radius: 6px;
        margin-top: 10px;
      }
      
      .example p {
        margin: 5px 0;
      }
      
      /* Add styling for the coming soon badge */
      .coming-soon-badge {
        background: rgba(28, 77, 235, 0.1);
        color: #1C4DEB;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        margin-left: 8px;
        font-weight: 500;
      }
    `;
    document.head.appendChild(styles);
  }
  
  // Add close event listener
  const closeBtn = tipsDialog.querySelector('.tips-dialog-close');
  closeBtn.addEventListener('click', () => {
    tipsDialog.remove();
  });
  
  // Close on outside click
  tipsDialog.addEventListener('click', (e) => {
    if (e.target === tipsDialog) {
      tipsDialog.remove();
    }
  });
}