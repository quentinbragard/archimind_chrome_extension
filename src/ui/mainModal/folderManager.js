// src/ui/FolderManager.js
export class FolderManager {
    constructor() {
      this.folderTree = {};
    }
    
    /**
     * Builds a folder tree from a flat list of templates and folders
     * @param {Array} templates - Array of template objects
     * @param {Array} folderPaths - Array of folder paths
     * @returns {Object} Folder tree structure
     */
    buildFolderTree(templates, folderPaths = []) {
      // Initialize empty folder tree
      this.folderTree = {
        root: {
          name: 'Root',
          templates: [],
          subfolders: {},
          path: 'root'
        }
      };
      
      // First add all known folders to the tree
      folderPaths.forEach(folderPath => {
        this.addFolderToTree(folderPath);
      });
      
      // Then add any implicit folders from template folder paths
      templates.forEach(template => {
        if (template.folder && template.folder !== 'root') {
          this.addFolderToTree(template.folder);
        }
      });
      
      // Finally add templates to their respective folders
      templates.forEach(template => {
        const folderPath = template.folder || 'root';
        this.addTemplateToFolder(template, folderPath);
      });
      
      return this.folderTree;
    }
    
    /**
     * Add a folder path to the tree
     * @param {string} folderPath - Folder path with '/' separator
     */
    addFolderToTree(folderPath) {
      if (!folderPath || folderPath === 'root') return;
      
      const parts = folderPath.split('/');
      let currentLevel = this.folderTree;
      let currentPath = '';
      
      parts.forEach((part, index) => {
        // Build the path incrementally
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        // Create folder if it doesn't exist at this level
        if (!currentLevel[currentPath]) {
          currentLevel[currentPath] = {
            name: part,
            templates: [],
            subfolders: {},
            path: currentPath,
            parent: index > 0 ? parts.slice(0, index).join('/') : 'root'
          };
        }
        
        // Add as subfolder to parent
        const parentPath = index > 0 ? parts.slice(0, index).join('/') : 'root';
        if (currentLevel[parentPath]) {
          currentLevel[parentPath].subfolders[currentPath] = currentLevel[currentPath];
        }
        
        // Move to next level
        currentLevel = currentLevel;
      });
    }
    
    /**
     * Add a template to the appropriate folder
     * @param {Object} template - Template object
     * @param {string} folderPath - Folder path
     */
    addTemplateToFolder(template, folderPath) {
      if (!folderPath || folderPath === 'root') {
        // Add to root folder
        this.folderTree.root.templates.push(template);
        return;
      }
      
      // Add to specific folder
      if (this.folderTree[folderPath]) {
        this.folderTree[folderPath].templates.push(template);
      } else {
        // If folder doesn't exist, create it
        this.addFolderToTree(folderPath);
        this.folderTree[folderPath].templates.push(template);
      }
    }
    
    /**
     * Get all templates in a folder, optionally including templates from subfolders
     * @param {string} folderPath - Folder path
     * @param {boolean} includeSubfolders - Whether to include templates from subfolders
     * @returns {Array} Array of templates
     */
    getTemplatesInFolder(folderPath, includeSubfolders = false) {
      if (!folderPath || folderPath === 'root') {
        return includeSubfolders ? 
          this.getAllTemplates() : 
          [...this.folderTree.root.templates];
      }
      
      if (!this.folderTree[folderPath]) {
        return [];
      }
      
      if (!includeSubfolders) {
        return [...this.folderTree[folderPath].templates];
      }
      
      // Include templates from all subfolders
      const result = [...this.folderTree[folderPath].templates];
      
      // Function to recursively add templates from subfolders
      const addSubfolderTemplates = (folder) => {
        Object.values(folder.subfolders).forEach(subfolder => {
          result.push(...subfolder.templates);
          addSubfolderTemplates(subfolder);
        });
      };
      
      addSubfolderTemplates(this.folderTree[folderPath]);
      
      return result;
    }
    
    /**
     * Get all templates in the tree
     * @returns {Array} Array of all templates
     */
    getAllTemplates() {
      const result = [];
      
      // Function to recursively add templates from folders
      const addFolderTemplates = (folder) => {
        result.push(...folder.templates);
        
        Object.values(folder.subfolders).forEach(subfolder => {
          addFolderTemplates(subfolder);
        });
      };
      
      addFolderTemplates(this.folderTree.root);
      
      return result;
    }
    
    /**
     * Render a folder tree as HTML elements
     * @param {Object} options - Rendering options
     * @returns {HTMLElement} Root container element
     */
    renderFolderTree(options = {}) {
      const {
        container = document.createElement('div'),
        folderTemplate = this.defaultFolderTemplate,
        templateTemplate = this.defaultTemplateTemplate,
        onFolderClick = () => {},
        onTemplateClick = () => {}
      } = options;
      
      // Clear container
      container.innerHTML = '';
      
      // Recursive function to render folders
      const renderFolder = (folder, level = 0) => {
        // Create folder element
        const folderElement = folderTemplate(folder, level);
        
        // Add event listener
        folderElement.querySelector('.folder-header').addEventListener('click', (e) => {
          e.stopPropagation();
          onFolderClick(folder, folderElement);
          folderElement.classList.toggle('open');
        });
        
        // Get folder content container
        const folderContent = folderElement.querySelector('.folder-content');
        
        // Add templates
        folder.templates.forEach(template => {
          const templateElement = templateTemplate(template);
          templateElement.addEventListener('click', () => onTemplateClick(template));
          folderContent.appendChild(templateElement);
        });
        
        // Add subfolders
        Object.values(folder.subfolders).forEach(subfolder => {
          const subfolderElement = renderFolder(subfolder, level + 1);
          folderContent.appendChild(subfolderElement);
        });
        
        return folderElement;
      };
      
      // Start rendering from the root
      container.appendChild(renderFolder(this.folderTree.root));
      
      return container;
    }
    
    /**
     * Default template for rendering folders
     * @param {Object} folder - Folder object
     * @param {number} level - Nesting level
     * @returns {HTMLElement} Folder element
     */
    defaultFolderTemplate(folder, level) {
      const folderElement = document.createElement('div');
      folderElement.className = 'folder-container';
      folderElement.dataset.path = folder.path;
      folderElement.dataset.level = level;
      
      // Open top-level folders by default
      if (level === 0 || folder.path === 'root') {
        folderElement.classList.add('open');
      }
      
      folderElement.innerHTML = `
        <div class="folder-header">
          <span class="folder-icon"></span>
          <span class="folder-name">${folder.name}</span>
          <span class="folder-count">${folder.templates.length}</span>
        </div>
        <div class="folder-content"></div>
      `;
      
      return folderElement;
    }
    
    /**
     * Default template for rendering templates
     * @param {Object} template - Template object
     * @returns {HTMLElement} Template element
     */
    defaultTemplateTemplate(template) {
      const templateElement = document.createElement('div');
      templateElement.className = 'template-item';
      templateElement.dataset.id = template.id;
      
      templateElement.innerHTML = `
        <div class="template-item-content">
          <span class="item-icon">📝</span>
          <div class="template-text">
            <span class="template-name">${template.name || 'Untitled Template'}</span>
            <span class="template-description">${this.truncateText(template.description || template.content || '', 60)}</span>
          </div>
        </div>
      `;
      
      return templateElement;
    }
    
    /**
     * Truncate text to a specific length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength) {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }
  }
  
  // Usage in templatesUI.js
  /*
  import { FolderManager } from '../ui/FolderManager.js';
  
  // When loading official templates
  async function loadOfficialTemplates() {
    // Fetch templates from API
    const response = await apiRequest('/prompt-templates/official-templates');
    
    // Create folder manager
    const folderManager = new FolderManager();
    
    // Build folder tree
    const folderTree = folderManager.buildFolderTree(
      response.templates || [], 
      response.folders || []
    );
    
    // Render the folder tree
    const container = document.querySelector('.template-folders-container');
    folderManager.renderFolderTree({
      container,
      onFolderClick: (folder, element) => {
        console.log('Folder clicked:', folder);
      },
      onTemplateClick: (template) => {
        console.log('Template clicked:', template);
        selectTemplate(template);
      }
    });
  }
  */