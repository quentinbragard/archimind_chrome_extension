// src/ui/quickActionsUI.js
import { Component } from '../../core/Component.js';
import { showToastNotification } from './notificationsUI.js';

// Define available quick actions
const quickActions = [
  {
    id: 'generate-report',
    icon: '📄',
    title: 'Generate Session Report',
    description: 'Create a detailed report of your ChatGPT usage',
    handler: 'handleGenerateReport',
    comingSoon: true
  },
  {
    id: 'optimize-prompts',
    icon: '✨',
    title: 'Analyze & Optimize Prompts',
    description: 'Get insights and suggestions for your prompts',
    handler: 'handleOptimizePrompts',
    comingSoon: true
  },
  {
    id: 'learn-techniques',
    icon: '🧠',
    title: 'Learn Prompting Techniques',
    description: 'Discover tips and tricks for better prompting',
    handler: 'handleLearnTechniques',
    comingSoon: false
  }
];

export class QuickActionsUI extends Component {
  constructor() {
    super(
      'quick-actions-container',
      () => `
        <ul id="Archimind-actions-list" class="features-list">
          ${this.renderQuickActions()}
        </ul>
      `,
      {
        'click:li': (e, target) => {
          const actionId = target.id;
          const action = quickActions.find(a => a.id === actionId);
          
          if (action && action.handler) {
            // Call the handler method if it exists
            if (typeof this[action.handler] === 'function') {
              this[action.handler]();
            }
          }
        }
      }
    );
  }
  
  renderQuickActions() {
    let html = '';
    
    quickActions.forEach((action, index) => {
      html += this.createActionItem(action, index);
    });
    
    return html;
  }
  
  createActionItem(action, index) {
    // Add "coming soon" badge if applicable
    const badgeHtml = action.comingSoon ? 
      '<span class="coming-soon-badge">Coming Soon</span>' : '';
    
    return `
      <li id="${action.id}" style="--item-index: ${index}">
        <span class="item-icon">${action.icon}</span>
        <div class="action-content">
          <span class="action-title">${action.title}</span>
          <span class="action-description">${action.description}</span>
        </div>
        ${badgeHtml}
      </li>
    `;
  }
  
  isComingSoon(actionId) {
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
  
  handleGenerateReport() {
    if (this.isComingSoon('generate-report')) return;
    
    // Using ApiService to generate a report
    showToastNotification({
      title: 'Generating Report',
      message: 'Your usage report is being generated. This may take a moment.',
      type: 'info'
    });
    
    // In a real implementation, we would call:
    // services.api.generateReport().then(report => { ... })
    
    // Simulate API call
    setTimeout(() => {
      showToastNotification({
        title: 'Report Complete',
        message: 'Your usage report has been generated and is ready to view.',
        type: 'success'
      });
    }, 3000);
  }
  
  handleOptimizePrompts() {
    if (this.isComingSoon('optimize-prompts')) return;
    
    // Using ApiService to analyze prompts
    showToastNotification({
      title: 'Prompt Analysis',
      message: 'Analyzing your recent prompts to provide optimization suggestions.',
      type: 'info'
    });
    
    // In a real implementation, we would call:
    // services.api.analyzePrompts().then(suggestions => { ... })
  }
  
  handleLearnTechniques() {
    if (this.isComingSoon('learn-techniques')) return;
    
    // Show prompting tips dialog
    this.showPromptingTips();
  }
  
  showPromptingTips() {
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
          
          <!-- More tip sections would go here -->
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(tipsDialog);
    
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
}

// Create singleton instance
const quickActionsUI = new QuickActionsUI();

// Backward compatibility function
export function renderQuickActions() {
  const container = document.getElementById('Archimind-quick-actions');
  if (!container) {
    console.error('❌ Quick actions container not found');
    return;
  }
  
  quickActionsUI.render(container);
}