import { services } from '../services/ServiceLocator.js';
import { closeModal, refreshModalData } from '../ui/mainModal/modalManager.js';
import { showToastNotification } from '../ui/mainModal/notificationsUI.js';

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
    services.api.trackTemplateUsage(template.id)
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
    message: `"${template.name || 'Template'}" has been inserted into the input area.`,
    type: 'success'
  });
}

/**
 * Get all user templates with folder structure
 * @returns {Promise<Object>} User templates and folder structure
 */
export async function getUserTemplates() {
  try {
    return await services.api.fetchUserTemplates();
  } catch (error) {
    console.error('Error getting user templates:', error);
    return { templates: [], folders: [], templates_by_folder: {} };
  }
}

/**
 * Get all official templates
 * @returns {Promise<Object>} Official templates
 */
export async function getOfficialTemplates() {
  try {
    return await services.api.fetchOfficialTemplates();
  } catch (error) {
    console.error('Error getting official templates:', error);
    return { templates: [], categories: {} };
  }
}

/**
 * Create a new template
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Created template
 */
export async function createNewTemplate(templateData) {
  try {
    const response = await services.api.createTemplate(templateData);
    
    if (response.success) {
      showToastNotification({
        title: 'Template Created',
        message: 'Your template has been created successfully.',
        type: 'success'
      });
      
      // Refresh templates in modal
      refreshModalData();
      
      return response.template;
    } else {
      throw new Error('Failed to create template');
    }
  } catch (error) {
    console.error('Error creating template:', error);
    
    showToastNotification({
      title: 'Error',
      message: 'Failed to create template. Please try again.',
      type: 'error'
    });
    
    throw error;
  }
}

/**
 * Update an existing template
 * @param {string} templateId - Template ID
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Updated template
 */
export async function updateExistingTemplate(templateId, templateData) {
  try {
    const response = await services.api.updateTemplate(templateId, templateData);
    
    if (response.success) {
      showToastNotification({
        title: 'Template Updated',
        message: 'Your template has been updated successfully.',
        type: 'success'
      });
      
      // Refresh templates in modal
      refreshModalData();
      
      return response.template;
    } else {
      throw new Error('Failed to update template');
    }
  } catch (error) {
    console.error('Error updating template:', error);
    
    showToastNotification({
      title: 'Error',
      message: 'Failed to update template. Please try again.',
      type: 'error'
    });
    
    throw error;
  }
}

/**
 * Delete a template
 * @param {string} templateId - Template ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteExistingTemplate(templateId) {
  try {
    const response = await services.api.deleteTemplate(templateId);
    
    if (response.success) {
      showToastNotification({
        title: 'Template Deleted',
        message: 'Your template has been deleted successfully.',
        type: 'success'
      });
      
      // Refresh templates in modal
      refreshModalData();
      
      return true;
    } else {
      throw new Error('Failed to delete template');
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    
    showToastNotification({
      title: 'Error',
      message: 'Failed to delete template. Please try again.',
      type: 'error'
    });
    
    return false;
  }
}

/**
 * Extract folder hierarchy from a folder path
 * @param {string} folderPath - Folder path (e.g., "marketing/campaigns/email")
 * @returns {Array} Array of folder objects with name and path
 */
export function extractFolderHierarchy(folderPath) {
  if (!folderPath) return [];
  
  const parts = folderPath.split('/');
  const folders = [];
  let currentPath = '';
  
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) currentPath += '/';
    currentPath += parts[i];
    
    folders.push({
      name: parts[i],
      path: currentPath,
      level: i
    });
  }
  
  return folders;
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
      await services.api.createTemplate({
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