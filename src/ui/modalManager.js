import { renderNotifications } from './notificationsUI.js';
import { renderTemplates } from './templatesUI.js';
import { renderQuickActions } from './quickActionsUI.js';
import { fetchPromptTemplates, fetchUserStats } from '../utils/statsManager.js';
import { getNotifications } from '../features/notificationsManager.js';

// Modal state
let modalElement = null;
let isModalOpen = false;

/**
 * Injects the modal into the DOM
 */
export function injectModal() {
  console.log("🖼️ Injecting Archimind modal");
  
  // Check if modal already exists
  if (document.getElementById("Archimind-modal")) {
    console.log("⚠️ Modal already exists, skipping injection");
    modalElement = document.getElementById("Archimind-modal");
    return;
  }
  
  // Create the modal element
  const modal = document.createElement("div");
  modal.id = "Archimind-modal";
  modal.classList.add("hidden");
  modal.innerHTML = `
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
  `;
  
  // Add the modal to the body
  document.body.appendChild(modal);
  
  // Store reference
  modalElement = modal;
  
  // Add event listeners
  setupModalEventListeners();
  
  console.log("✅ Modal injected successfully");
}

/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
  // Close button click
  const closeButton = document.getElementById("close-Archimind-modal");
  if (closeButton) {
    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      closeModal();
    });
  }
  
  // Close when clicking outside the modal
  document.addEventListener('click', (event) => {
    if (isModalOpen && 
        modalElement && 
        !modalElement.contains(event.target) && 
        event.target.id !== "Archimind-extension-button") {
      closeModal();
    }
  });
}

/**
 * Opens the modal
 */
export function openModal() {
  if (!modalElement) {
    injectModal();
  }
  
  modalElement.classList.remove("hidden");
  isModalOpen = true;
  
  // Reset animations on list items
  resetListAnimations();
  
  console.log("🔓 Modal opened");
}

/**
 * Closes the modal
 */
export function closeModal() {
  if (modalElement) {
    modalElement.classList.add("hidden");
    isModalOpen = false;
    console.log("🔒 Modal closed");
  }
}

/**
 * Toggles the modal visibility
 */
export function toggleModal() {
  if (isModalOpen) {
    closeModal();
  } else {
    openModal();
  }
}

/**
 * Reset list animations for a smoother experience when reopening
 */
function resetListAnimations() {
  if (!modalElement) return;
  
  const lists = modalElement.querySelectorAll('ul');
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

/**
 * Refreshes the modal data
 */
export async function refreshModalData() {
  try {
    // Fetch data in parallel
    const [templates, notifications, stats] = await Promise.all([
      fetchPromptTemplates(),
      getNotifications(),
      fetchUserStats()
    ]);
    
    // Update modal sections
    renderNotifications(notifications);
    renderTemplates(templates);
    renderQuickActions();
    
    // Update modal stats
    updateModalStats(stats);
    
    console.log("🔄 Modal data refreshed successfully");
  } catch (error) {
    console.error("❌ Error refreshing modal data:", error);
  }
}

/**
 * Updates the stats shown in the modal
 * @param {Object} stats - User stats
 */
function updateModalStats(stats) {
  const totalPromptsEl = document.getElementById('modal-total-prompts');
  if (totalPromptsEl && stats.total_prompts !== undefined) {
    totalPromptsEl.textContent = stats.total_prompts;
  }
}

/**
 * Gets the current modal state
 * @returns {Object} Modal state
 */
export function getModalState() {
  return {
    isOpen: isModalOpen,
    isInjected: !!modalElement
  };
}

/**
 * Removes the modal from the DOM
 */
export function removeModal() {
  if (modalElement) {
    modalElement.remove();
    modalElement = null;
    isModalOpen = false;
  }
}