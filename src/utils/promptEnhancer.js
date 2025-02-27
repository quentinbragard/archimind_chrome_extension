import { getAuthToken } from './auth.js';

/**
 * Class to handle prompt enhancement functionality
 */
export class PromptEnhancer {
    constructor() {
        this.isActive = false;
        this.enhancerButton = null;
        this.enhancerPanel = null;
        this.inputObserver = null;
        this.lastAnalyzedText = '';
        this.debounceTimeout = null;
        this.inputArea = null;
        this.enhancedPrompt = null;
    }

    /**
     * Initialize the prompt enhancer
     */
    init() {
        console.log("📝 Initializing Prompt Enhancer");
        this.injectEnhancerElements();
        this.startInputObserver();
        this.addEventListeners();
        this.isActive = true;
    }

    /**
     * Create and inject the enhancer button and panel
     */
    injectEnhancerElements() {
        // Check if elements already exist
        if (document.getElementById('archimind-enhancer-button')) {
            return;
        }

        // Create enhancer button
        this.enhancerButton = document.createElement('button');
        this.enhancerButton.id = 'archimind-enhancer-button';
        this.enhancerButton.className = 'archimind-enhancer-button hidden';
        this.enhancerButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z"></path>
                <circle cx="12" cy="12" r="4"></circle>
            </svg>
            <span>Enhance Prompt</span>
        `;
        document.body.appendChild(this.enhancerButton);

        // Create enhancer panel
        this.enhancerPanel = document.createElement('div');
        this.enhancerPanel.id = 'archimind-enhancer-panel';
        this.enhancerPanel.className = 'archimind-enhancer-panel hidden';
        this.enhancerPanel.innerHTML = `
            <div class="enhancer-header">
                <h3>Enhanced Prompt</h3>
                <div class="enhancer-actions">
                    <button id="archimind-save-template" title="Save as Template">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                    </button>
                    <button id="archimind-use-prompt" title="Use This Prompt">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                        </svg>
                    </button>
                    <button id="archimind-close-enhancer" title="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="archimind-enhanced-content" class="enhancer-content">
                <div class="enhancer-loading hidden">
                    <div class="spinner"></div>
                    <p>Enhancing your prompt...</p>
                </div>
                <div class="enhanced-prompt-container">
                    <p class="enhanced-prompt"></p>
                </div>
            </div>
            <div id="archimind-save-template-form" class="save-template-form hidden">
                <h4>Save as Template</h4>
                <input type="text" id="template-name" placeholder="Template Name" class="template-input">
                <textarea id="template-description" placeholder="Description (optional)" class="template-input"></textarea>
                <div class="template-actions">
                    <button id="cancel-save-template" class="secondary-btn">Cancel</button>
                    <button id="confirm-save-template" class="primary-btn">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.enhancerPanel);

        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            .archimind-enhancer-button {
                position: absolute;
                right: 50px;
                background-color: #1C4DEB;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 6px 12px;
                font-size: 13px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                transition: all 0.2s ease;
                z-index: 1000;
            }
            
            .archimind-enhancer-button:hover {
                background-color: #0e3bc5;
                transform: translateY(-1px);
            }
            
            .archimind-enhancer-panel {
                position: absolute;
                width: 90%;
                max-width: 600px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 1001;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transition: all 0.3s ease;
                border: 1px solid rgba(28, 77, 235, 0.2);
            }
            
            .enhancer-header {
                background: linear-gradient(135deg, #1C4DEB 0%, #153db8 100%);
                color: white;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .enhancer-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 500;
            }
            
            .enhancer-actions {
                display: flex;
                gap: 8px;
            }
            
            .enhancer-actions button {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 4px;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: white;
                transition: background 0.2s ease;
            }
            
            .enhancer-actions button:hover {
                background: rgba(255, 255, 255, 0.4);
            }
            
            .enhancer-content {
                padding: 15px;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .enhancer-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 20px;
                gap: 10px;
            }
            
            .spinner {
                width: 30px;
                height: 30px;
                border: 3px solid rgba(28, 77, 235, 0.3);
                border-radius: 50%;
                border-top-color: #1C4DEB;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .enhanced-prompt {
                white-space: pre-wrap;
                margin: 0;
                line-height: 1.5;
                color: #333;
            }
            
            .save-template-form {
                padding: 15px;
                border-top: 1px solid #eee;
            }
            
            .save-template-form h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #333;
            }
            
            .template-input {
                width: 100%;
                padding: 8px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 14px;
            }
            
            textarea.template-input {
                min-height: 60px;
                resize: vertical;
            }
            
            .template-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            
            .primary-btn, .secondary-btn {
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                border: none;
            }
            
            .primary-btn {
                background: #1C4DEB;
                color: white;
            }
            
            .secondary-btn {
                background: #f5f5f5;
                color: #333;
                border: 1px solid #ddd;
            }
            
            .hidden {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Start observing the ChatGPT input area
     */
    startInputObserver() {
        // Function to check for the input area
        const checkForInputArea = () => {
            const inputArea = document.getElementById('prompt-textarea');
            if (inputArea && !this.inputArea) {
                this.inputArea = inputArea;
                this.observeInputChanges();
                return true;
            }
            return !!this.inputArea;
        };

        // Check immediately
        if (!checkForInputArea()) {
            // If not found, set up a mutation observer to detect when it's added
            const observer = new MutationObserver((mutations) => {
                if (checkForInputArea()) {
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * Observe changes to the input area text
     */
    observeInputChanges() {
        // Position the enhancer button relative to the input area
        this.positionEnhancerButton();

        // Watch for input changes
        this.inputArea.addEventListener('input', () => {
            this.handleInputChange();
        });

        // Watch for input area position changes (e.g., when window resizes)
        window.addEventListener('resize', () => {
            this.positionEnhancerButton();
        });
    }

    /**
     * Position the enhancer button next to the input area
     */
    positionEnhancerButton() {
        if (!this.inputArea || !this.enhancerButton) return;

        const rect = this.inputArea.getBoundingClientRect();
        
        // Position the button at the top right of the input area
        this.enhancerButton.style.top = `${rect.top - 40}px`;
        this.enhancerButton.style.left = `${rect.right - 150}px`;
    }

    /**
     * Handle input changes with debouncing
     */
    handleInputChange() {
        // Clear previous timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        const inputText = this.inputArea.value.trim();
        
        // Only show button if there's meaningful text to enhance
        if (inputText.length > 15) {
            this.enhancerButton.classList.remove('hidden');
            this.positionEnhancerButton();
        } else {
            this.enhancerButton.classList.add('hidden');
        }

        // Update last analyzed text
        this.lastAnalyzedText = inputText;
    }

    /**
     * Add event listeners for all interactive elements
     */
    addEventListeners() {
        // Button click to show panel and generate enhanced prompt
        document.addEventListener('click', (e) => {
            if (e.target.closest('#archimind-enhancer-button')) {
                this.showEnhancerPanel();
                this.generateEnhancedPrompt();
            } else if (e.target.closest('#archimind-close-enhancer')) {
                this.hideEnhancerPanel();
            } else if (e.target.closest('#archimind-use-prompt')) {
                this.useEnhancedPrompt();
            } else if (e.target.closest('#archimind-save-template')) {
                this.showSaveTemplateForm();
            } else if (e.target.closest('#confirm-save-template')) {
                this.saveAsTemplate();
            } else if (e.target.closest('#cancel-save-template')) {
                this.hideSaveTemplateForm();
            }
        });
    }

    /**
     * Show the enhancer panel
     */
    showEnhancerPanel() {
        if (!this.enhancerPanel) return;

        // Position the panel
        if (this.inputArea) {
            const rect = this.inputArea.getBoundingClientRect();
            this.enhancerPanel.style.top = `${rect.top - 350}px`; // above the input
            this.enhancerPanel.style.left = `${(window.innerWidth - this.enhancerPanel.offsetWidth) / 2}px`; // center horizontally
        }

        this.enhancerPanel.classList.remove('hidden');
    }

    /**
     * Hide the enhancer panel
     */
    hideEnhancerPanel() {
        if (this.enhancerPanel) {
            this.enhancerPanel.classList.add('hidden');
            this.hideSaveTemplateForm();
        }
    }

    /**
     * Show the form to save as template
     */
    showSaveTemplateForm() {
        const form = document.getElementById('archimind-save-template-form');
        const content = document.getElementById('archimind-enhanced-content');
        
        if (form && content) {
            content.classList.add('hidden');
            form.classList.remove('hidden');
        }
    }

    /**
     * Hide the save template form
     */
    hideSaveTemplateForm() {
        const form = document.getElementById('archimind-save-template-form');
        const content = document.getElementById('archimind-enhanced-content');
        
        if (form && content) {
            form.classList.add('hidden');
            content.classList.remove('hidden');
            
            // Reset form fields
            document.getElementById('template-name').value = '';
            document.getElementById('template-description').value = '';
        }
    }

    /**
     * Generate enhanced prompt from the current input text
     */
    async generateEnhancedPrompt() {
        const loadingEl = this.enhancerPanel.querySelector('.enhancer-loading');
        const promptContainerEl = this.enhancerPanel.querySelector('.enhanced-prompt-container');
        const promptEl = this.enhancerPanel.querySelector('.enhanced-prompt');
        
        // Show loading state
        loadingEl.classList.remove('hidden');
        promptContainerEl.classList.add('hidden');
        
        try {
            const token = await getAuthToken();
            
            const response = await fetch('http://127.0.0.1:8000/prompt-generator/enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    draft_prompt: this.lastAnalyzedText
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Store the enhanced prompt
            this.enhancedPrompt = data.enhanced_prompt;
            
            // Update UI
            promptEl.textContent = this.enhancedPrompt;
            loadingEl.classList.add('hidden');
            promptContainerEl.classList.remove('hidden');
            
        } catch (error) {
            console.error('❌ Error generating enhanced prompt:', error);
            loadingEl.classList.add('hidden');
            promptContainerEl.classList.remove('hidden');
            promptEl.textContent = 'Sorry, there was an error enhancing your prompt. Please try again.';
        }
    }

    /**
     * Use the enhanced prompt by replacing the content in the input area
     */
    useEnhancedPrompt() {
        if (!this.enhancedPrompt || !this.inputArea) return;
        
        // Replace the input area content
        this.inputArea.value = this.enhancedPrompt;
        
        // Trigger an input event to ensure any ChatGPT listeners detect the change
        this.inputArea.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Focus on the input area
        this.inputArea.focus();
        
        // Hide the enhancer panel
        this.hideEnhancerPanel();
        
        // Hide the enhancer button
        this.enhancerButton.classList.add('hidden');
    }

    /**
     * Save the current enhanced prompt as a template
     */
    async saveAsTemplate() {
        if (!this.enhancedPrompt) return;
        
        const nameEl = document.getElementById('template-name');
        const descriptionEl = document.getElementById('template-description');
        
        const name = nameEl.value.trim();
        const description = descriptionEl.value.trim();
        
        if (!name) {
            alert('Please provide a name for your template.');
            return;
        }
        
        try {
            const token = await getAuthToken();
            
            const response = await fetch('http://127.0.0.1:8000/prompt-generator/save-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    content: this.enhancedPrompt,
                    description: description || null
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            // Hide the form
            this.hideSaveTemplateForm();
            
            // Provide visual feedback that it was saved
            const promptEl = this.enhancerPanel.querySelector('.enhanced-prompt');
            const originalText = promptEl.textContent;
            promptEl.textContent = `✅ Template saved as "${name}"`;
            
            // Restore original text after feedback
            setTimeout(() => {
                promptEl.textContent = originalText;
            }, 2000);
            
        } catch (error) {
            console.error('❌ Error saving template:', error);
            alert('There was an error saving your template. Please try again.');
        }
    }

    /**
     * Clean up resources when the enhancer is no longer needed
     */
    destroy() {
        // Remove elements
        if (this.enhancerButton) {
            this.enhancerButton.remove();
            this.enhancerButton = null;
        }
        
        if (this.enhancerPanel) {
            this.enhancerPanel.remove();
            this.enhancerPanel = null;
        }
        
        // Stop any active processes
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        this.inputArea = null;
        this.enhancedPrompt = null;
        this.isActive = false;
    }
}