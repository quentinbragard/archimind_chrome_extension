import { useTemplate } from '../features/templateManager.js';

/**
 * Renders templates in the modal
 * @param {Array} templates - Array of template objects
 */
export function renderTemplates(templates) {
  const templatesList = document.getElementById('templates-list');
  if (!templatesList) return;
  
  // Clear existing templates
  templatesList.innerHTML = '';
  
  // Add templates or empty state
  if (templates && templates.length > 0) {
    templates.forEach((template, index) => {
      const listItem = createTemplateItem(template, index);
      templatesList.appendChild(listItem);
    });
  } else {
    appendEmptyState(templatesList, 'No templates saved yet. Create one using the prompt enhancer!');
  }
}

/**
 * Creates a template list item
 * @param {Object} template - Template object
 * @param {number} index - Index for animation delay
 * @returns {HTMLElement} Template list item
 */
function createTemplateItem(template, index) {
  const listItem = document.createElement('li');
  listItem.setAttribute('data-template-id', template.id);
  listItem.style.setProperty('--item-index', index);
  
  // Add metadata as data attributes
  listItem.dataset.templateName = template.name;
  listItem.dataset.templateDescription = template.description || '';
  
  // Create the template item content
  listItem.innerHTML = `
    <div class="template-item-content">
      <span class="item-icon">💬</span>
      <div class="template-text">
        <span class="template-name">${template.name}</span>
        ${template.description ? `<span class="template-description">${truncateText(template.description, 60)}</span>` : ''}
      </div>
    </div>
    <div class="template-actions">
      <button class="template-preview-btn" title="Preview template">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12" y2="8"></line>
        </svg>
      </button>
    </div>
  `;
  
  // Add click handler to use template
  listItem.addEventListener('click', (e) => {
    // Don't trigger if preview button was clicked
    if (e.target.closest('.template-preview-btn')) return;
    
    useTemplate(template);
  });
  
  // Add preview button handler
  const previewBtn = listItem.querySelector('.template-preview-btn');
  previewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showTemplatePreview(template);
  });
  
  return listItem;
}

/**
 * Shows a preview modal for a template
 * @param {Object} template - Template object
 */
function showTemplatePreview(template) {
  // Remove any existing preview
  const existingPreview = document.getElementById('template-preview-modal');
  if (existingPreview) {
    existingPreview.remove();
  }
  
  // Create preview modal
  const previewModal = document.createElement('div');
  previewModal.id = 'template-preview-modal';
  previewModal.className = 'template-preview-modal';
  
  previewModal.innerHTML = `
    <div class="template-preview-content">
      <div class="template-preview-header">
        <h3>${template.name}</h3>
        <button class="template-preview-close">×</button>
      </div>
      <div class="template-preview-body">
        <p class="template-preview-description">${template.description || 'No description provided.'}</p>
        <div class="template-preview-text">${template.content}</div>
      </div>
      <div class="template-preview-footer">
        <button class="template-use-btn">Use Template</button>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(previewModal);
  
  // Add styles if needed
  if (!document.getElementById('template-preview-styles')) {
    const styles = document.createElement('style');
    styles.id = 'template-preview-styles';
    styles.textContent = `
      .template-preview-modal {
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
      
      .template-preview-content {
        background: white;
        width: 90%;
        max-width: 600px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        max-height: 80vh;
      }
      
      .template-preview-header {
        background: linear-gradient(135deg, #1C4DEB 0%, #153db8 100%);
        color: white;
        padding: 12px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .template-preview-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }
      
      .template-preview-close {
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
        opacity: 0.8;
        transition: opacity 0.2s ease;
      }
      
      .template-preview-close:hover {
        opacity: 1;
      }
      
      .template-preview-body {
        padding: 15px;
        overflow-y: auto;
        flex: 1;
      }
      
      .template-preview-description {
        color: #666;
        font-style: italic;
        margin-top: 0;
      }
      
      .template-preview-text {
        white-space: pre-wrap;
        background: #f5f7fa;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #e0e4e8;
        font-family: monospace;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .template-preview-footer {
        padding: 12px 15px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
      }
      
      .template-use-btn {
        background: #1C4DEB;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s ease;
      }
      
      .template-use-btn:hover {
        background: #153db8;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  // Add event listeners
  const closeBtn = previewModal.querySelector('.template-preview-close');
  closeBtn.addEventListener('click', () => {
    previewModal.remove();
  });
  
  const useBtn = previewModal.querySelector('.template-use-btn');
  useBtn.addEventListener('click', () => {
    useTemplate(template);
    previewModal.remove();
  });
  
  // Close on outside click
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      previewModal.remove();
    }
  });
}

/**
 * Truncates text to a specific length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Appends an empty state message to a list
 * @param {HTMLElement} listElement - The list element
 * @param {string} message - Empty state message
 */
function appendEmptyState(listElement, message) {
  const emptyItem = document.createElement('li');
  emptyItem.className = 'empty-state';
  emptyItem.innerHTML = `<span class="item-icon">ℹ️</span>${message}`;
  listElement.appendChild(emptyItem);
}