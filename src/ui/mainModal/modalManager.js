// src/ui/modalManager.js
import { Component } from '../../core/Component.js';
import { services } from '../../services/ServiceLocator.js';
import { renderNotifications } from './notificationsUI.js';
import { renderTemplates } from './templatesUI.js';
import { renderQuickActions } from './quickActionsUI.js';

export class ModalManager extends Component {
  constructor() {
    super(
      'Archimind-modal',
      () => `
        <div class="Archimind-modal-content">
          <div class="modal-header">
            <h2><span class="modal-icon">📊</span>Archimind Stats</h2>
            <button id="close-Archimind-modal" class="header-close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="stat-summary">
              <div class="stat-card">
                <span class="stat-number" id="modal-total-prompts">-</span>
                <span class="stat-label">Prompts Today</span>
              </div>
            </div>
            
            <!-- Notifications section -->
            <div id="Archimind-notifications">
              <h3><span class="section-icon">🔔</span>Notifications</h3>
              <ul id="notifications-list"></ul>
            </div>
            
            <!-- Templates section -->
            <div id="Archimind-prompt-list">
              <h3><span class="section-icon">💡</span>My Templates</h3>
              <ul id="templates-list"></ul>
            </div>
            
            <!-- Quick actions section -->
            <div id="Archimind-quick-actions">
              <h3><span class="section-icon">🚀</span>Quick Actions</h3>
              <ul id="Archimind-actions-list" class="features-list"></ul>
            </div>
          </div>
        </div>
      `,
      {
        'click:#close-Archimind-modal': (e) => {
          e.stopPropagation();
          this.close();
        }
      }
    );
    
    this.isOpen = false;
    
    // Listen for refresh event
    document.addEventListener('archimind:refresh-modal', () => {
      this.refreshData();
    });
  }
  
  render(container) {
    super.render(container);
    this.element.id = 'Archimind-modal';
    this.element.classList.add('hidden');
    
    // Add click handler to close when clicking outside
    document.addEventListener('click', (event) => {
      if (this.isOpen && 
          this.element && 
          !this.element.contains(event.target) && 
          event.target.id !== "Archimind-extension-button") {
        this.close();
      }
    });
    
    return this.element;
  }
  
  open() {
    if (!this.element) {
      this.render(document.body);
    }
    
    this.element.classList.remove("hidden");
    this.isOpen = true;
    
    // Reset animations on list items
    this.resetListAnimations();
    
    console.log("🔓 Modal opened");
    
    // Refresh data when opening
    this.refreshData();
  }
  
  close() {
    if (this.element) {
      this.element.classList.add("hidden");
      this.isOpen = false;
      console.log("🔒 Modal closed");
    }
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  resetListAnimations() {
    if (!this.element) return;
    
    const lists = this.element.querySelectorAll('ul');
    lists.forEach(list => {
      const items = Array.from(list.children);
      items.forEach((item, index) => {
        // Clone the item to reset its animation
        const clone = item.cloneNode(true);
        clone.style.setProperty('--item-index', index);
        item.parentNode.replaceChild(clone, item);
      });
    });
  }
  
  async refreshData() {
    try {
      console.log("🔄 Refreshing modal data...");
      
      // Fetch data in parallel using ApiService
      const [templates, stats] = await Promise.all([
        services.api.getUserTemplates(),
        services.api.getUserStats()
      ]);
      
      // Get notifications using ApiService
      const notifications = await services.api.fetchUnreadNotifications();
      
      console.log("✅ Data fetched successfully:", {
        templatesCount: templates ? templates.templates.length : 0,
        notificationsCount: notifications ? notifications.length : 0,
        statsReceived: !!stats
      });
      
      // Update modal sections
      renderNotifications(notifications || []);
      renderTemplates(templates || { templates: [], folders: [] });
      renderQuickActions();
      
      // Update modal stats
      this.updateModalStats(stats || {});
      
      console.log("🔄 Modal data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing modal data:", error);
      // Attempt to render available data even if some fetches failed
      try {
        renderNotifications([]);
        renderTemplates({ templates: [], folders: [] });
        renderQuickActions();
      } catch (renderError) {
        console.error("❌ Critical error rendering UI:", renderError);
      }
    }
  }
  
  updateModalStats(stats) {
    const totalPromptsEl = this.element.querySelector('#modal-total-prompts');
    if (totalPromptsEl && stats.total_prompts !== undefined) {
      totalPromptsEl.textContent = stats.total_prompts;
    }
  }
  
  getState() {
    return {
      isOpen: this.isOpen,
      isInjected: !!this.element
    };
  }
}

// Create singleton instance
const modalManager = new ModalManager();

// Backward compatibility functions
export function injectModal() {
  modalManager.render(document.body);
  console.log("🖼️ Injecting Archimind modal");
}

export function openModal() {
  modalManager.open();
}

export function closeModal() {
  modalManager.close();
}

export function toggleModal() {
  modalManager.toggle();
}

export function refreshModalData() {
  modalManager.refreshData();
}

export function getModalState() {
  return modalManager.getState();
}

export function removeModal() {
  modalManager.remove();
}