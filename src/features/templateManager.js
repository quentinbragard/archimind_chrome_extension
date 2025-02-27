import { saveTemplate, trackTemplateUsage } from '../utils/api.js';
import { closeModal } from '../ui/modalManager.js';
import { showToastNotification } from '../ui/notificationsUI.js';

/**
 * Uses a prompt template by inserting it into the ChatGPT input area
 * @param {Object} template - Template object 
 */
export function useTemplate(template) {
  if (!template || !template.content) {
    console.error('❌ Invalid template:', template);
    return;
  }
  
  // Find the ChatGPT input area
  const inputArea = document.getElementById('prompt-textarea');
  if (!inputArea) {
    console.error('❌ ChatGPT input area not found');
    return;
  }
  
  // Insert template content
  inputArea.value = template.content;
  
  // Trigger an input event to ensure ChatGPT detects the change
  inputArea.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Focus the input area
  inputArea.focus();
  
  // Track template usage
  if (template.id) {
    trackTemplateUsage(template.id)
      .then(() => {
        console.log('✅ Template usage tracked:', template.id);
      })
      .catch(err => {
        console.error('❌ Error tracking template usage:', err);
      });
  }
  
  // Close the modal
  closeModal();
  
  // Show success notification
  showToastNotification({
    title: 'Template Applied',
    message: `"${template.name}" has been inserted into the input area.`,
    type: 'success'
  });
}

/**
 * Saves a new template
 * @param {Object} templateData - Template data
 * @param {string} templateData.name - Template name (will be stored in the content field)
 * @param {string} templateData.content - Template content
 * @param {string} templateData.folder - Template folder (optional)
 * @returns {Promise<Object>} Saved template
 */
export async function createTemplate(templateData) {
  if (!templateData.content) {
    throw new Error('Template content is required');
  }
  
  try {
    // Format the template data to match the database structure
    const formattedData = {
      content: templateData.content,
      folder: templateData.folder || null,
      // We don't need to send id, created_at or user_id
      // as those will be handled by the backend
    };
    
    const savedTemplate = await saveTemplate(formattedData);
    
    // Show success notification
    showToastNotification({
      title: 'Template Saved',
      message: `Your template has been saved successfully.`,
      type: 'success'
    });
    
    return savedTemplate;
  } catch (error) {
    // Show error notification
    showToastNotification({
      title: 'Error Saving Template',
      message: error.message || 'An unexpected error occurred',
      type: 'error'
    });
    
    throw error;
  }
}

/**
 * Shows a dialog to create a new template
 * @param {string} initialContent - Initial content for the template
 */
export function showCreateTemplateDialog(initialContent = '') {
  // Remove any existing dialog
  const existingDialog = document.getElementById('create-template-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.id = 'create-template-dialog';
  dialog.className = 'template-dialog';
  
  dialog.innerHTML = `
    <div class="template-dialog-content">
      <div class="template-dialog-header">
        <h3>Save as Template</h3>
        <button class="template-dialog-close">×</button>
      </div>
      <div class="template-dialog-body">
        <div class="form-group">
          <label for="template-name">Template Name *</label>
          <input type="text" id="template-name" class="template-input" placeholder="Give your template a name" required>
        </div>
        <div class="form-group">
          <label for="template-description">Description (optional)</label>
          <textarea id="template-description" class="template-input" placeholder="Add a helpful description"></textarea>
        </div>
        <div class="form-group">
          <label for="template-content">Content *</label>
          <textarea id="template-content" class="template-input template-content" placeholder="Template content">${initialContent}</textarea>
        </div>
      </div>
      <div class="template-dialog-footer">
        <button class="secondary-btn" id="cancel-template">Cancel</button>
        <button class="primary-btn" id="save-template">Save Template</button>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(dialog);
  
  // Add styles if needed
  if (!document.getElementById('template-dialog-styles')) {
    const styles = document.createElement('style');
    styles.id = 'template-dialog-styles';
    styles.textContent = `
      .template-dialog {
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
      
      .template-dialog-content {
        background: white;
        width: 90%;
        max-width: 600px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        max-height: 85vh;
      }
      
      .template-dialog-header {
        background: linear-gradient(135deg, #1C4DEB 0%, #153db8 100%);
        color: white;
        padding: 12px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .template-dialog-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }
      
      .template-dialog-close {
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
      
      .template-dialog-body {
        padding: 15px;
        overflow-y: auto;
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        font-size: 14px;
      }
      
      .template-input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        font-family: inherit;
      }
      
      .template-content {
        min-height: 150px;
        resize: vertical;
        font-family: monospace;
      }
      
      .template-dialog-footer {
        padding: 12px 15px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      
      .primary-btn, .secondary-btn {
        padding: 8px 15px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        border: none;
      }
      
      .primary-btn {
        background: #1C4DEB;
        color: white;
      }
      
      .primary-btn:hover {
        background: #153db8;
      }
      
      .secondary-btn {
        background: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
      }
      
      .secondary-btn:hover {
        background: #e5e5e5;
      }
    `;
    document.head.appendChild(styles);
  }
  
  // Add event listeners
  const closeBtn = dialog.querySelector('.template-dialog-close');
  closeBtn.addEventListener('click', () => {
    dialog.remove();
  });
  
  const cancelBtn = dialog.querySelector('#cancel-template');
  cancelBtn.addEventListener('click', () => {
    dialog.remove();
  });
  
  const saveBtn = dialog.querySelector('#save-template');
  saveBtn.addEventListener('click', async () => {
    const nameInput = dialog.querySelector('#template-name');
    const descriptionInput = dialog.querySelector('#template-description');
    const contentInput = dialog.querySelector('#template-content');
    
    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!name) {
      nameInput.focus();
      return;
    }
    
    if (!content) {
      contentInput.focus();
      return;
    }
    
    try {
      await createTemplate({
        name,
        description: description || undefined,
        content
      });
      
      dialog.remove();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  });
  
  // Close on outside click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.remove();
    }
  });
  
  // Focus name input
  setTimeout(() => {
    const nameInput = dialog.querySelector('#template-name');
    if (nameInput) {
      nameInput.focus();
    }
  }, 100);
}