import { useTemplate } from '../../features/templateManager.js';
import { apiRequest } from '../../utils/api.js';
import { showToastNotification } from './notificationsUI.js';

// Template state
let templatesCache = {
  templates: [],
  folders: [],
  templatesByFolder: {}
};

let officialTemplatesCache = {
  templates: [],
  categories: {}
};

/**
 * Renders templates in the modal organized by folders
 * @param {Array} templates - Array of template objects
 */
export function renderTemplates(templates) {
  const templatesList = document.getElementById('templates-list');
  if (!templatesList) return;
  
  // Cache templates data
  templatesCache.templates = templates || [];
  
  // Clear existing templates
  templatesList.innerHTML = '';
  
  // Check if we have any templates
  if (templates && templates.length > 0) {
    // Add the folder structure
    renderFolderStructure(templatesList, templates);
  } else {
    appendEmptyState(templatesList);
  }
  
  // Add "Add template" button next to section title
  addTemplateButton();
}

/**
 * Adds the "Add Template" button next to the section title
 */
function addTemplateButton() {
  const sectionTitle = document.querySelector('#Archimind-prompt-list h3');
  if (!sectionTitle) return;
  
  // Check if button already exists
  if (sectionTitle.querySelector('.add-template-btn')) return;
  
  const addButton = document.createElement('button');
  addButton.className = 'add-template-btn';
  addButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `;
  addButton.title = "Add new template";
  
  // Add the button to the section title
  sectionTitle.appendChild(addButton);
  
  // Add click event to open template selection modal
  addButton.addEventListener('click', openTemplateSelectionModal);
  
  // Add style if needed
  if (!document.getElementById('template-button-style')) {
    const style = document.createElement('style');
    style.id = 'template-button-style';
    style.textContent = `
      .add-template-btn {
        background: none;
        border: none;
        color: #1C4DEB;
        cursor: pointer;
        margin-left: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        border-radius: 4px;
        transition: background 0.2s ease;
      }
      
      .add-template-btn:hover {
        background: rgba(28, 77, 235, 0.1);
      }
      
      /* Folder structure styles */
      .folder-container {
        margin-bottom: 15px;
      }
      
      .folder-header {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 8px 10px;
        background: rgba(28, 77, 235, 0.05);
        border-radius: 6px;
        margin-bottom: 8px;
      }
      
      .folder-header:hover {
        background: rgba(28, 77, 235, 0.1);
      }
      
      .folder-icon {
        margin-right: 8px;
        color: #1C4DEB;
        transition: transform 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      
      /* Folder icon for closed folders */
      .folder-container:not(.open) > .folder-header .folder-icon:before {
        content: '📁';
      }
      
      /* Folder icon for open folders */
      .folder-container.open > .folder-header .folder-icon:before {
        content: '📂';
      }
      
      .folder-name {
        font-weight: 500;
        flex: 1;
      }
      
      .folder-count {
        color: #777;
        font-size: 12px;
      }
      
      .folder-content {
        padding-left: 20px;
        overflow: hidden;
        max-height: 0;
        transition: max-height 0.3s ease;
        border-left: 1px dashed rgba(28, 77, 235, 0.2);
        margin-left: 10px;
      }
      
      .folder-container.open .folder-content {
        max-height: 2000px; /* Increased max-height to handle deeper nesting */
      }
      
      .folder-container.open > .folder-header .folder-icon {
        transform: rotate(90deg);
      }
      
      /* Ensure we have enough room for multiple levels of nesting */
      .folder-content .folder-content .folder-content {
        max-height: 0;
      }
      
      .folder-container.open > .folder-content .folder-container.open > .folder-content {
        max-height: 1800px;
      }
      
      .folder-container.open > .folder-content .folder-container.open > .folder-content .folder-container.open > .folder-content {
        max-height: 1600px;
      }
      
      /* Empty state */
      .empty-templates {
        text-align: center;
        padding: 20px;
        background: rgba(28, 77, 235, 0.05);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
      }
      
      .empty-templates-icon {
        font-size: 24px;
        color: #1C4DEB;
      }
      
      .empty-templates-text {
        color: #555;
        margin: 0;
      }
      
      .create-template-btn {
        background: #1C4DEB;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: background 0.2s ease;
      }
      
      .create-template-btn:hover {
        background: #0e3bc5;
      }
      
      /* Templates selection modal */
      .template-selection-modal {
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
      
      .template-selection-content {
        background: white;
        width: 90%;
        max-width: 800px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        max-height: 85vh;
      }
      
      .template-selection-header {
        background: linear-gradient(135deg, #1C4DEB 0%, #153db8 100%);
        color: white;
        padding: 12px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .template-selection-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }
      
      .template-selection-close {
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
      
      .template-selection-tabs {
        display: flex;
        border-bottom: 1px solid #eee;
      }
      
      .template-selection-tab {
        padding: 12px 20px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
      }
      
      .template-selection-tab.active {
        border-bottom-color: #1C4DEB;
        color: #1C4DEB;
      }
      
      .template-selection-body {
        padding: 15px;
        overflow-y: auto;
        flex: 1;
      }
      
      .template-selection-footer {
        padding: 12px 15px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      
      .template-selection-empty {
        text-align: center;
        padding: 30px;
        color: #777;
      }
      
      .template-selection-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 15px;
      }
      
      .template-card {
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
      }
      
      .template-card:hover {
        border-color: #1C4DEB;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }
      
      .template-card.selected {
        border-color: #1C4DEB;
        background: rgba(28, 77, 235, 0.05);
      }
      
      .template-card-title {
        font-weight: 600;
        margin-bottom: 5px;
      }
      
      .template-card-description {
        font-size: 13px;
        color: #777;
        margin-bottom: 10px;
        flex: 1;
      }
      
      .template-card-category, .template-card-folder {
        font-size: 12px;
        color: #1C4DEB;
        background: rgba(28, 77, 235, 0.1);
        padding: 2px 6px;
        border-radius: 10px;
        display: inline-block;
      }
      
      .template-card-folder {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .template-card-folder:before {
        content: "📁";
        font-size: 11px;
      }
      
      /* Form for creating a new template */
      .template-form-container {
        padding: 15px;
      }
      
      .template-form-group {
        margin-bottom: 15px;
      }
      
      .template-form-label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }
      
      .template-form-input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .template-form-textarea {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        font-family: monospace;
        min-height: 150px;
      }
      
      .template-form-select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .primary-button, .secondary-button {
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        border: none;
      }
      
      .primary-button {
        background: #1C4DEB;
        color: white;
      }
      
      .secondary-button {
        background: #f5f5f5;
        color: #333;
        border: 1px solid #ddd;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Renders the folder structure and templates
 * @param {HTMLElement} container - The container element
 * @param {Array} templates - Array of template objects
 */
function renderFolderStructure(container, templates) {
  // Group templates by folder
  const templatesByFolder = {};
  
  // Create a "root" folder for templates without a folder
  templatesByFolder.root = [];
  
  // Organize templates by folder
  templates.forEach(template => {
    const folder = template.folder || 'root';
    
    if (!templatesByFolder[folder]) {
      templatesByFolder[folder] = [];
    }
    
    templatesByFolder[folder].push(template);
  });
  
  // Store in cache
  templatesCache.templatesByFolder = templatesByFolder;
  
  // Extract all unique folders
  const folders = new Set();
  Object.keys(templatesByFolder).forEach(folderPath => {
    if (folderPath !== 'root') {
      // Split folder path to get individual folders
      const parts = folderPath.split('/');
      let currentPath = '';
      
      parts.forEach(part => {
        if (currentPath) currentPath += '/';
        currentPath += part;
        folders.add(currentPath);
      });
    }
  });
  
  // Convert to array and sort
  const folderArray = Array.from(folders).sort();
  
  // Store in cache
  templatesCache.folders = folderArray;
  
  // Render root templates first (if any)
  if (templatesByFolder.root.length > 0) {
    const rootFolder = document.createElement('div');
    rootFolder.className = 'folder-container open';
    rootFolder.innerHTML = `
      <div class="folder-header">
        <span class="folder-icon">📂</span>
        <span class="folder-name">My Templates</span>
        <span class="folder-count">${templatesByFolder.root.length}</span>
      </div>
      <div class="folder-content" style="max-height: 1000px;">
        <ul class="templates-list root-templates"></ul>
      </div>
    `;
    
    container.appendChild(rootFolder);
    
    // Render root templates
    const rootTemplatesList = rootFolder.querySelector('.root-templates');
    templatesByFolder.root.forEach((template, index) => {
      const templateItem = createTemplateItem(template, index);
      rootTemplatesList.appendChild(templateItem);
    });
    
    // Add folder toggle
    const folderHeader = rootFolder.querySelector('.folder-header');
    folderHeader.addEventListener('click', () => {
      rootFolder.classList.toggle('open');
    });
  }
  
  // Create a map to track folder elements by path
  const folderElements = {};
  
  // Get top level folders first
  const topLevelFolders = folderArray.filter(path => !path.includes('/'));
  
  // Process all folders to create elements first
  folderArray.forEach(folderPath => {
    // Get templates in this exact folder (not in subfolders)
    const templatesInFolder = templatesByFolder[folderPath] || [];
    
    // Skip if no templates
    if (templatesInFolder.length === 0) return;
    
    // Split path to get folder name and parent path
    const parts = folderPath.split('/');
    const folderName = parts[parts.length - 1];
    
    // Create folder element
    const folder = document.createElement('div');
    folder.className = 'folder-container';
    folder.innerHTML = `
      <div class="folder-header">
        <span class="folder-icon">📂</span>
        <span class="folder-name">${folderName}</span>
        <span class="folder-count">${templatesInFolder.length}</span>
      </div>
      <div class="folder-content">
        <ul class="templates-list folder-${folderPath.replace(/\//g, '-')}"></ul>
      </div>
    `;
    
    // Store folder element for reference
    folderElements[folderPath] = folder;
    
    // Add folder toggle
    const folderHeader = folder.querySelector('.folder-header');
    folderHeader.addEventListener('click', () => {
      folder.classList.toggle('open');
    });
  });
  
  // Now place folders in the hierarchy
  folderArray.forEach(folderPath => {
    const folder = folderElements[folderPath];
    if (!folder) return;
    
    const parts = folderPath.split('/');
    
    // Determine where to append folder
    if (parts.length > 1) { // This is a subfolder
      // Get parent path
      const parentPath = parts.slice(0, parts.length - 1).join('/');
      const parentFolder = folderElements[parentPath];
      
      if (parentFolder) {
        // Place in parent folder's content
        const parentContent = parentFolder.querySelector('.folder-content');
        parentContent.appendChild(folder);
      } else {
        // If parent folder wasn't created (no templates directly in it)
        // add to container as top level
        container.appendChild(folder);
      }
    } else {
      // This is a top-level folder
      container.appendChild(folder);
    }
  });
  
  // Render templates in each folder
  folderArray.forEach(folderPath => {
    const templatesInFolder = templatesByFolder[folderPath] || [];
    if (templatesInFolder.length === 0) return;
    
    const folder = folderElements[folderPath];
    if (!folder) return;
    
    const templatesList = folder.querySelector(`.folder-${folderPath.replace(/\//g, '-')}`);
    templatesInFolder.forEach((template, index) => {
      const templateItem = createTemplateItem(template, index);
      templatesList.appendChild(templateItem);
    });
  });
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
  
  // Get template name (from name field or first line of content)
  const templateName = template.name || extractTemplateName(template.content);
  
  // Create the template item content
  listItem.innerHTML = `
    <div class="template-item-content">
      <span class="item-icon">📝</span>
      <div class="template-text">
        <span class="template-name">${templateName}</span>
        <span class="template-description">${truncateText(template.content, 60)}</span>
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
 * Appends an empty state with call-to-action
 * @param {HTMLElement} listElement - The list element
 */
function appendEmptyState(listElement) {
  const emptyContainer = document.createElement('div');
  emptyContainer.className = 'empty-templates';
  emptyContainer.innerHTML = `
    <div class="empty-templates-icon">📝</div>
    <p class="empty-templates-text">You don't have any templates yet</p>
    <button class="create-template-btn">Create your first template</button>
  `;
  
  // Add click handler for creating template
  const createBtn = emptyContainer.querySelector('.create-template-btn');
  createBtn.addEventListener('click', openTemplateSelectionModal);
  
  listElement.appendChild(emptyContainer);
}

/**
 * Opens the template selection modal
 */
function openTemplateSelectionModal() {
  // Remove any existing modal
  const existingModal = document.getElementById('template-selection-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'template-selection-modal';
  modal.className = 'template-selection-modal';
  
  modal.innerHTML = `
    <div class="template-selection-content">
      <div class="template-selection-header">
        <h3>Add New Template</h3>
        <button class="template-selection-close">×</button>
      </div>
      <div class="template-selection-tabs">
        <div class="template-selection-tab active" data-tab="official">Official Templates</div>
        <div class="template-selection-tab" data-tab="scratch">Start from Scratch</div>
      </div>
      <div class="template-selection-body">
        <div class="template-selection-loading">
          <p>Loading templates...</p>
        </div>
      </div>
      <div class="template-selection-footer">
        <button class="secondary-button" id="cancel-template-selection">Cancel</button>
        <button class="primary-button" id="use-selected-template" disabled>Use Selected Template</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.template-selection-close');
  closeBtn.addEventListener('click', () => modal.remove());
  
  const cancelBtn = modal.querySelector('#cancel-template-selection');
  cancelBtn.addEventListener('click', () => modal.remove());
  
  const useSelectedBtn = modal.querySelector('#use-selected-template');
  useSelectedBtn.addEventListener('click', () => {
    const selectedTemplate = modal.querySelector('.template-card.selected');
    if (selectedTemplate) {
      const templateId = selectedTemplate.getAttribute('data-template-id');
      // Switch to form view for the selected template
      showTemplateForm(templateId);
    }
  });
  
  // Tab switching
  const tabs = modal.querySelectorAll('.template-selection-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show correct content
      const tabName = tab.getAttribute('data-tab');
      if (tabName === 'official') {
        loadOfficialTemplates();
      } else if (tabName === 'scratch') {
        showTemplateForm();
      }
    });
  });
  
  // Load official templates by default
  loadOfficialTemplates();
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * Loads official templates into the modal organized by folders
 */
async function loadOfficialTemplates() {
  const modal = document.getElementById('template-selection-modal');
  if (!modal) return;
  
  const modalBody = modal.querySelector('.template-selection-body');
  
  // Show loading state
  modalBody.innerHTML = `
    <div class="template-selection-loading">
      <p>Loading templates...</p>
    </div>
  `;
  
  try {
    // Call API to get official templates
    const response = await apiRequest('/prompt-templates/official-templates');
    
    // Store all templates in cache
    officialTemplatesCache.templates = response.templates || [];
    
    // Check if we have templates
    if (!response.templates || response.templates.length === 0) {
      modalBody.innerHTML = `
        <div class="template-selection-empty">
          <p>No official templates available yet.</p>
        </div>
      `;
      return;
    }
    
    // Group templates by folder
    const templatesByFolder = {};
    
    // Create a "root" folder for templates without a folder
    templatesByFolder.root = [];
    
    // Organize templates by folder
    response.templates.forEach(template => {
      const folder = template.folder || 'root';
      
      if (!templatesByFolder[folder]) {
        templatesByFolder[folder] = [];
      }
      
      templatesByFolder[folder].push(template);
    });
    
    // Store in cache
    officialTemplatesCache.templatesByFolder = templatesByFolder;
    
    // Extract all unique folders
    const folders = new Set();
    Object.keys(templatesByFolder).forEach(folderPath => {
      if (folderPath !== 'root') {
        // Split folder path to get individual folders
        const parts = folderPath.split('/');
        let currentPath = '';
        
        parts.forEach(part => {
          if (currentPath) currentPath += '/';
          currentPath += part;
          folders.add(currentPath);
        });
      }
    });
    
    // Convert to array and sort
    const folderArray = Array.from(folders).sort();
    
    // Store in cache
    officialTemplatesCache.folders = folderArray;
    
    // Prepare container for templates
    modalBody.innerHTML = '';
    
    // Create folder elements container
    const foldersContainer = document.createElement('div');
    foldersContainer.className = 'template-folders-container';
    modalBody.appendChild(foldersContainer);
    
    // Render root templates first (if any)
    if (templatesByFolder.root.length > 0) {
      const rootFolder = document.createElement('div');
      rootFolder.className = 'folder-container open';
      rootFolder.innerHTML = `
        <div class="folder-header">
          <span class="folder-icon"></span>
          <span class="folder-name">All Templates</span>
          <span class="folder-count">${templatesByFolder.root.length}</span>
        </div>
        <div class="folder-content" style="max-height: 2000px;">
          <div class="template-selection-grid root-templates"></div>
        </div>
      `;
      
      foldersContainer.appendChild(rootFolder);
      
      // Render root templates
      const rootTemplatesGrid = rootFolder.querySelector('.root-templates');
      templatesByFolder.root.forEach(template => {
        const templateCard = createTemplateCard(template);
        rootTemplatesGrid.appendChild(templateCard);
      });
      
      // Add folder toggle
      const folderHeader = rootFolder.querySelector('.folder-header');
      folderHeader.addEventListener('click', () => {
        rootFolder.classList.toggle('open');
      });
    }
    
    // Create a map to track folder elements by path
    const folderElements = {};
    
    // Get top level folders first
    const topLevelFolders = folderArray.filter(path => !path.includes('/'));
    
    // Process all folders to create elements
    folderArray.forEach(folderPath => {
      // Get templates in this exact folder (not in subfolders)
      const templatesInFolder = templatesByFolder[folderPath] || [];
      
      // Skip if no templates
      if (templatesInFolder.length === 0) return;
      
      // Split path to get folder name and parent path
      const parts = folderPath.split('/');
      const folderName = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join('/');
      
      // Create folder element
      const folder = document.createElement('div');
      folder.className = 'folder-container';
      // Only open top-level folders by default
      if (!parentPath) {
        folder.classList.add('open');
      }
      
      folder.innerHTML = `
        <div class="folder-header">
          <span class="folder-icon"></span>
          <span class="folder-name">${folderName}</span>
          <span class="folder-count">${templatesInFolder.length}</span>
        </div>
        <div class="folder-content">
          <div class="template-selection-grid folder-${folderPath.replace(/\//g, '-')}"></div>
        </div>
      `;
      
      // Store folder element for reference
      folderElements[folderPath] = folder;
      
      // Add folder toggle
      const folderHeader = folder.querySelector('.folder-header');
      folderHeader.addEventListener('click', () => {
        folder.classList.toggle('open');
      });
    });
    
    // Now place folders in their proper hierarchy
    folderArray.forEach(folderPath => {
      const folder = folderElements[folderPath];
      if (!folder) return;
      
      const parts = folderPath.split('/');
      
      // Determine where to append folder
      if (parts.length > 1) { // This is a subfolder
        // Get parent path
        const parentPath = parts.slice(0, parts.length - 1).join('/');
        const parentFolder = folderElements[parentPath];
        
        if (parentFolder) {
          // Place in parent folder's content
          const parentContent = parentFolder.querySelector('.folder-content');
          parentContent.appendChild(folder);
        }
      } else {
        // This is a top-level folder
        foldersContainer.appendChild(folder);
      }
    });
    
    // Render templates in each folder
    folderArray.forEach(folderPath => {
      const templatesInFolder = templatesByFolder[folderPath] || [];
      if (templatesInFolder.length === 0) return;
      
      const folder = folderElements[folderPath];
      if (!folder) return;
      
      const templatesGrid = folder.querySelector(`.folder-${folderPath.replace(/\//g, '-')}`);
      templatesInFolder.forEach(template => {
        const templateCard = createTemplateCard(template);
        templatesGrid.appendChild(templateCard);
      });
    });
    
    // If no folders were rendered (but we have templates), just show all templates in a grid
    if (folderArray.length === 0 && templatesByFolder.root.length === 0 && response.templates.length > 0) {
      const allTemplatesContainer = document.createElement('div');
      allTemplatesContainer.innerHTML = `
        <h4 class="template-category-title">All Templates</h4>
        <div class="template-selection-grid"></div>
      `;
      
      const grid = allTemplatesContainer.querySelector('.template-selection-grid');
      response.templates.forEach(template => {
        const templateCard = createTemplateCard(template);
        grid.appendChild(templateCard);
      });
      
      modalBody.appendChild(allTemplatesContainer);
    }
  } catch (error) {
    console.error('Error loading official templates:', error);
    modalBody.innerHTML = `
      <div class="template-selection-empty">
        <p>Error loading templates. Please try again later.</p>
      </div>
    `;
  }
}

/**
 * Creates a template card for the selection grid
 * @param {Object} template - Template object
 * @returns {HTMLElement} Template card element
 */
function createTemplateCard(template) {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.setAttribute('data-template-id', template.id);
  
  // Get folder display name (if any)
  let folderDisplay = '';
  if (template.folder) {
    // Display just the last folder name, not the full path
    const folderParts = template.folder.split('/');
    const lastFolder = folderParts[folderParts.length - 1];
    folderDisplay = `<div class="template-card-folder">${lastFolder}</div>`;
  }
  
  card.innerHTML = `
    <div class="template-card-title">${template.name || 'Untitled Template'}</div>
    <div class="template-card-description">${truncateText(template.description || '', 100)}</div>
    ${folderDisplay}
  `;
  
  // Add click handler
  card.addEventListener('click', () => {
    // Toggle selection
    const modal = document.getElementById('template-selection-modal');
    if (!modal) return;
    
    // Remove selection from other cards
    const cards = modal.querySelectorAll('.template-card');
    cards.forEach(c => c.classList.remove('selected'));
    
    // Select this card
    card.classList.add('selected');
    
    // Enable the "Use Selected" button
    const useSelectedBtn = modal.querySelector('#use-selected-template');
    useSelectedBtn.disabled = false;
  });
  
  return card;
}

/**
 * Shows the template form for creating or editing a template
 * @param {string} officialTemplateId - ID of official template to base on (optional)
 */
function showTemplateForm(officialTemplateId = null) {
  const modal = document.getElementById('template-selection-modal');
  if (!modal) return;
  
  const modalBody = modal.querySelector('.template-selection-body');
  const modalFooter = modal.querySelector('.template-selection-footer');
  
  // Get all folders for the dropdown
  const folders = templatesCache.folders || [];
  
  // Find official template if ID provided
  let officialTemplate = null;
  if (officialTemplateId) {
    officialTemplate = officialTemplatesCache.templates.find(t => t.id === officialTemplateId);
  }
  
  // Update modal title
  const modalTitle = modal.querySelector('.template-selection-header h3');
  if (modalTitle) {
    modalTitle.textContent = officialTemplate 
      ? `Create template based on "${officialTemplate.name}"`
      : 'Create New Template';
  }
  
  // Render form
  modalBody.innerHTML = `
    <div class="template-form-container">
      <div class="template-form-group">
        <label class="template-form-label" for="template-name">Template Name *</label>
        <input type="text" id="template-name" class="template-form-input" value="${officialTemplate ? `Copy of ${officialTemplate.name}` : ''}" placeholder="Give your template a name" required>
      </div>
      
      <div class="template-form-group">
        <label class="template-form-label" for="template-folder">Folder (optional)</label>
        <select id="template-folder" class="template-form-select">
          <option value="">Root (no folder)</option>
          ${folders.map(folder => `<option value="${folder}">${folder}</option>`).join('')}
          <option value="new_folder">+ Create new folder</option>
        </select>
      </div>
      
      <div id="new-folder-group" class="template-form-group" style="display: none;">
        <label class="template-form-label" for="new-folder-input">New Folder Name *</label>
        <input type="text" id="new-folder-input" class="template-form-input" placeholder="marketing/campaigns">
        <small>Use '/' to create subfolders (e.g., marketing/campaigns)</small>
      </div>
      
      <div class="template-form-group">
        <label class="template-form-label" for="template-description">Description (optional)</label>
        <input type="text" id="template-description" class="template-form-input" value="${officialTemplate?.description || ''}" placeholder="Add a helpful description">
      </div>
      
      <div class="template-form-group">
        <label class="template-form-label" for="template-content">Content *</label>
        <textarea id="template-content" class="template-form-textarea" placeholder="Enter template content">${officialTemplate?.content || ''}</textarea>
      </div>
    </div>
  `;
  
  // Update footer buttons
  modalFooter.innerHTML = `
    <button class="secondary-button" id="back-to-templates">Back</button>
    <button class="primary-button" id="save-template">Save Template</button>
  `;
  
  // Add event listeners
  const backBtn = modalFooter.querySelector('#back-to-templates');
  backBtn.addEventListener('click', () => {
    // Go back to templates selection
    const activeTab = modal.querySelector('.template-selection-tab.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'official') {
      loadOfficialTemplates();
    } else {
      // Switch to official tab and load templates
      const tabs = modal.querySelectorAll('.template-selection-tab');
      tabs.forEach(t => t.classList.remove('active'));
      const officialTab = modal.querySelector('[data-tab="official"]');
      if (officialTab) officialTab.classList.add('active');
      loadOfficialTemplates();
    }
  });
  
  const saveBtn = modalFooter.querySelector('#save-template');
  saveBtn.addEventListener('click', () => saveTemplate(officialTemplateId));
  
  // Handle new folder selection
  const folderSelect = modalBody.querySelector('#template-folder');
  const newFolderGroup = modalBody.querySelector('#new-folder-group');
  
  folderSelect.addEventListener('change', () => {
    if (folderSelect.value === 'new_folder') {
      newFolderGroup.style.display = 'block';
    } else {
      newFolderGroup.style.display = 'none';
    }
  });
}

/**
 * Saves a new template
 * @param {string} officialTemplateId - ID of official template to base on (optional)
 */
async function saveTemplate(officialTemplateId = null) {
  const modal = document.getElementById('template-selection-modal');
  if (!modal) return;
  
  // Get form inputs
  const nameInput = modal.querySelector('#template-name');
  const folderSelect = modal.querySelector('#template-folder');
  const newFolderInput = modal.querySelector('#new-folder-input');
  const descriptionInput = modal.querySelector('#template-description');
  const contentInput = modal.querySelector('#template-content');
  
  // Validate required fields
  if (!nameInput.value.trim()) {
    nameInput.focus();
    return;
  }
  
  if (!contentInput.value.trim()) {
    contentInput.focus();
    return;
  }
  
  // Determine folder
  let folder = null;
  if (folderSelect.value === 'new_folder') {
    if (!newFolderInput.value.trim()) {
      newFolderInput.focus();
      return;
    }
    folder = newFolderInput.value.trim();
  } else if (folderSelect.value) {
    folder = folderSelect.value;
  }
  
  try {
    // Prepare template data
    const templateData = {
      name: nameInput.value.trim(),
      content: contentInput.value.trim(),
      description: descriptionInput.value.trim() || undefined,
      folder: folder,
      based_on_official_id: officialTemplateId
    };
    
    // Create template
    const response = await apiRequest('/prompt-templates/template', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
    
    if (response.success) {
      // Close modal
      modal.remove();
      
      // Show success notification
      showToastNotification({
        title: 'Template Saved',
        message: 'Your template has been saved successfully',
        type: 'success'
      });
      
      // Refresh templates in modal
      const event = new CustomEvent('archimind:refresh-modal');
      document.dispatchEvent(event);
    } else {
      throw new Error('Failed to save template');
    }
  } catch (error) {
    console.error('Error saving template:', error);
    showToastNotification({
      title: 'Error',
      message: 'Failed to save template. Please try again.',
      type: 'error'
    });
  }
}

/**
 * Extract a display name from template content
 * @param {string} content - Template content
 * @returns {string} Extracted name
 */
function extractTemplateName(content) {
  if (!content) return "Untitled Template";
  
  // Try to get the first line (which often contains a role or purpose)
  const firstLine = content.split('\n')[0].trim();
  
  // If first line is short enough, use it as is
  if (firstLine.length <= 40) {
    return firstLine;
  }
  
  // Otherwise, take the first few words that might identify the template
  const words = firstLine.split(' ');
  return words.slice(0, 4).join(' ') + '...';
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
  
  // Extract a name for display
  const templateName = template.name || extractTemplateName(template.content);
  
  previewModal.innerHTML = `
    <div class="template-preview-content">
      <div class="template-preview-header">
        <h3>${templateName}</h3>
        <button class="template-preview-close">×</button>
      </div>
      <div class="template-preview-body">
        ${template.description ? `<p class="template-preview-description">${template.description}</p>` : ''}
        <div class="template-preview-text">${template.content}</div>
      </div>
      <div class="template-preview-footer">
        <button class="template-edit-btn">Edit</button>
        <button class="template-use-btn">Use Template</button>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(previewModal);
  
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
  
  const editBtn = previewModal.querySelector('.template-edit-btn');
  editBtn.addEventListener('click', () => {
    previewModal.remove();
    showEditTemplateForm(template);
  });
  
  // Close on outside click
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
      previewModal.remove();
    }
  });
}

/**
 * Shows a form to edit an existing template
 * @param {Object} template - Template to edit
 */
function showEditTemplateForm(template) {
  // Remove any existing modal
  const existingModal = document.getElementById('template-edit-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Get all folders for the dropdown
  const folders = templatesCache.folders || [];
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'template-edit-modal';
  modal.className = 'template-selection-modal'; // Reuse styles
  
  modal.innerHTML = `
    <div class="template-selection-content">
      <div class="template-selection-header">
        <h3>Edit Template</h3>
        <button class="template-selection-close">×</button>
      </div>
      <div class="template-selection-body">
        <div class="template-form-container">
          <div class="template-form-group">
            <label class="template-form-label" for="edit-template-name">Template Name *</label>
            <input type="text" id="edit-template-name" class="template-form-input" value="${template.name || ''}" placeholder="Give your template a name" required>
          </div>
          
          <div class="template-form-group">
            <label class="template-form-label" for="edit-template-folder">Folder (optional)</label>
            <select id="edit-template-folder" class="template-form-select">
              <option value="">Root (no folder)</option>
              ${folders.map(folder => `<option value="${folder}" ${template.folder === folder ? 'selected' : ''}>${folder}</option>`).join('')}
              <option value="new_folder">+ Create new folder</option>
            </select>
          </div>
          
          <div id="edit-new-folder-group" class="template-form-group" style="display: none;">
            <label class="template-form-label" for="edit-new-folder-input">New Folder Name *</label>
            <input type="text" id="edit-new-folder-input" class="template-form-input" placeholder="marketing/campaigns">
            <small>Use '/' to create subfolders (e.g., marketing/campaigns)</small>
          </div>
          
          <div class="template-form-group">
            <label class="template-form-label" for="edit-template-description">Description (optional)</label>
            <input type="text" id="edit-template-description" class="template-form-input" value="${template.description || ''}" placeholder="Add a helpful description">
          </div>
          
          <div class="template-form-group">
            <label class="template-form-label" for="edit-template-content">Content *</label>
            <textarea id="edit-template-content" class="template-form-textarea" placeholder="Enter template content">${template.content || ''}</textarea>
          </div>
        </div>
      </div>
      <div class="template-selection-footer">
        <button class="danger-button" id="delete-template">Delete</button>
        <button class="secondary-button" id="cancel-edit-template">Cancel</button>
        <button class="primary-button" id="save-edit-template">Save Changes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  const closeBtn = modal.querySelector('.template-selection-close');
  closeBtn.addEventListener('click', () => modal.remove());
  
  const cancelBtn = modal.querySelector('#cancel-edit-template');
  cancelBtn.addEventListener('click', () => modal.remove());
  
  const saveBtn = modal.querySelector('#save-edit-template');
  saveBtn.addEventListener('click', () => updateTemplate(template.id));
  
  const deleteBtn = modal.querySelector('#delete-template');
  deleteBtn.addEventListener('click', () => confirmDeleteTemplate(template.id, template.name));
  
  // Handle new folder selection
  const folderSelect = modal.querySelector('#edit-template-folder');
  const newFolderGroup = modal.querySelector('#edit-new-folder-group');
  
  folderSelect.addEventListener('change', () => {
    if (folderSelect.value === 'new_folder') {
      newFolderGroup.style.display = 'block';
    } else {
      newFolderGroup.style.display = 'none';
    }
  });
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

/**
 * Updates an existing template
 * @param {string} templateId - ID of template to update
 */
async function updateTemplate(templateId) {
  const modal = document.getElementById('template-edit-modal');
  if (!modal) return;
  
  // Get form inputs
  const nameInput = modal.querySelector('#edit-template-name');
  const folderSelect = modal.querySelector('#edit-template-folder');
  const newFolderInput = modal.querySelector('#edit-new-folder-input');
  const descriptionInput = modal.querySelector('#edit-template-description');
  const contentInput = modal.querySelector('#edit-template-content');
  
  // Validate required fields
  if (!nameInput.value.trim()) {
    nameInput.focus();
    return;
  }
  
  if (!contentInput.value.trim()) {
    contentInput.focus();
    return;
  }
  
  // Determine folder
  let folder = null;
  if (folderSelect.value === 'new_folder') {
    if (!newFolderInput.value.trim()) {
      newFolderInput.focus();
      return;
    }
    folder = newFolderInput.value.trim();
  } else if (folderSelect.value) {
    folder = folderSelect.value;
  }
  
  try {
    // Prepare template data
    const templateData = {
      name: nameInput.value.trim(),
      content: contentInput.value.trim(),
      description: descriptionInput.value.trim() || undefined,
      folder: folder
    };
    
    // Update template
    const response = await apiRequest(`/prompt-templates/template/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData)
    });
    
    if (response.success) {
      // Close modal
      modal.remove();
      
      // Show success notification
      showToastNotification({
        title: 'Template Updated',
        message: 'Your template has been updated successfully',
        type: 'success'
      });
      
      // Refresh templates in modal
      const event = new CustomEvent('archimind:refresh-modal');
      document.dispatchEvent(event);
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
  }
}

/**
 * Shows a confirmation dialog for deleting a template
 * @param {string} templateId - ID of template to delete
 * @param {string} templateName - Name of template to delete
 */
function confirmDeleteTemplate(templateId, templateName) {
  // Create confirmation dialog
  const dialog = document.createElement('div');
  dialog.className = 'template-confirm-delete';
  dialog.innerHTML = `
    <div class="template-confirm-delete-content">
      <h3>Delete Template?</h3>
      <p>Are you sure you want to delete "${templateName}"? This action cannot be undone.</p>
      <div class="template-confirm-delete-buttons">
        <button class="secondary-button" id="cancel-delete">Cancel</button>
        <button class="danger-button" id="confirm-delete">Delete</button>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .template-confirm-delete {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10003;
    }
    
    .template-confirm-delete-content {
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .template-confirm-delete-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    
    .danger-button {
      background: #e53935;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
  
  // Add to document
  document.body.appendChild(dialog);
  
  // Add event listeners
  const cancelBtn = dialog.querySelector('#cancel-delete');
  cancelBtn.addEventListener('click', () => dialog.remove());
  
  const confirmBtn = dialog.querySelector('#confirm-delete');
  confirmBtn.addEventListener('click', async () => {
    try {
      const response = await apiRequest(`/prompt-templates/template/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.success) {
        // Close all modals
        dialog.remove();
        const editModal = document.getElementById('template-edit-modal');
        if (editModal) editModal.remove();
        
        // Show success notification
        showToastNotification({
          title: 'Template Deleted',
          message: 'Your template has been deleted successfully',
          type: 'success'
        });
        
        // Refresh templates in modal
        const event = new CustomEvent('archimind:refresh-modal');
        document.dispatchEvent(event);
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
      dialog.remove();
    }
  });
  
  // Close on outside click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.remove();
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