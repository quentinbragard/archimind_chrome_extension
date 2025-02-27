import { getTurnNumber } from './utils/getTurnNumber.js';
import { getUserId } from './utils/getUserId.js';
import { saveChatToBackend } from './utils/saveChatToBackend.js';
import { processChatGPTNewArticles } from './chatGPT/processChatGPTNewArticles.js';
import { getChatTitleFromSidebar } from './utils/getChatTitleFromSidebar.js';
import { startStatsUpdates, stopStatsUpdates, fetchPromptTemplates, fetchNotifications } from './utils/statsManager.js';
import { PromptEnhancer } from './utils/promptEnhancer.js';

import "./content-style.css";

let chatHistoryData = {
  savedChatName: null,
  providerChatId: null,
};
let lastProcessedTurn = 0;
const processedMessageIds = new Set();

let currentURL = window.location.href;
let observer = null;
let titleCheckInterval = null;
let userId = null;
let promptEnhancer = null;
let statsUpdateInterval = null;

// ============= ENTRY POINTS =============
init();

/** Main init: called once on script load */
async function init() {
  console.log("===========Init");
  userId = await getUserId();
  console.log("===========UserId:", userId);
  if (!userId) {
    console.error('Supabase user ID not set.');
    return;
  }
  console.log("Ready to inject Archimind components");

  injectArchimindButton(); // Add Archimind UI elements
  injectStatsPanel();
  handleUrlChange();
  startMutationObserver();
  listenForUrlChanges();
  
  // Start stats updates
  statsUpdateInterval = startStatsUpdates(30000); // Update every 30 seconds
  
  // Initialize prompt enhancer
  promptEnhancer = new PromptEnhancer();
  promptEnhancer.init();
  
  // Load initial data for modal
  refreshModalData();
}

/**
 * Refresh the data shown in the Archimind modal
 */
async function refreshModalData() {
  try {
    // Get templates and notifications
    const [templates, notifications] = await Promise.all([
      fetchPromptTemplates(),
      fetchNotifications()
    ]);
    
    // Update templates list
    updateTemplatesList(templates);
    
    // Update notifications
    updateNotificationsList(notifications);
    
    console.log("✅ Modal data refreshed");
  } catch (error) {
    console.error("❌ Error refreshing modal data:", error);
  }
}

/**
 * Update the templates list in the modal
 */
function updateTemplatesList(templates) {
  const templatesList = document.getElementById('Archimind-prompt-list');
  if (!templatesList) return;
  
  // Clear existing list
  const listContainer = templatesList.querySelector('ul');
  if (listContainer) {
    listContainer.innerHTML = '';
    
    // Add templates
    if (templates && templates.length > 0) {
      templates.forEach((template, index) => {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-template-id', template.id);
        listItem.style.setProperty('--item-index', index);
        listItem.innerHTML = `<span class="item-icon">💬</span>${template.name}`;
        
        // Add click handler to use template
        listItem.addEventListener('click', () => {
          const inputArea = document.getElementById('prompt-textarea');
          if (inputArea) {
            inputArea.value = template.content;
            inputArea.dispatchEvent(new Event('input', { bubbles: true }));
            inputArea.focus();
            
            // Track template usage
            fetch(`http://127.0.0.1:8000/prompt-generator/use-template/${template.id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
              }
            }).catch(err => console.error('Error tracking template usage:', err));
            
            // Close modal
            document.getElementById('Archimind-modal').classList.add('hidden');
          }
        });
        
        listContainer.appendChild(listItem);
      });
    } else {
      // Show empty state
      const emptyItem = document.createElement('li');
      emptyItem.className = 'empty-state';
      emptyItem.innerHTML = `<span class="item-icon">ℹ️</span>No templates yet. Save one from the prompt enhancer!`;
      listContainer.appendChild(emptyItem);
    }
  }
}

/**
 * Update the notifications list in the modal
 */
function updateNotificationsList(notifications) {
  // Create notifications section if it doesn't exist
  let notificationsSection = document.getElementById('Archimind-notifications');
  
  if (!notificationsSection) {
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) return;
    
    notificationsSection = document.createElement('div');
    notificationsSection.id = 'Archimind-notifications';
    
    notificationsSection.innerHTML = `
      <h3><span class="section-icon">🔔</span>Notifications</h3>
      <ul id="notifications-list"></ul>
    `;
    
    // Insert at the top of the modal body
    modalBody.insertBefore(notificationsSection, modalBody.firstChild);
  }
  
  const notificationsList = document.getElementById('notifications-list');
  if (!notificationsList) return;
  
  // Clear existing notifications
  notificationsList.innerHTML = '';
  
  // Add notifications
  if (notifications && notifications.length > 0) {
    notifications.forEach((notification, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'notification-item';
      listItem.setAttribute('data-notification-id', notification.id);
      listItem.style.setProperty('--item-index', index);
      
      // Set priority class
      if (notification.priority) {
        listItem.classList.add(`priority-${notification.priority}`);
      }
      
      listItem.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">${getNotificationIcon(notification.type)}</span>
          <div class="notification-text">
            <span class="notification-title">${notification.title}</span>
            <span class="notification-message">${notification.message}</span>
          </div>
        </div>
        <span class="notification-time">${formatNotificationTime(notification.created_at)}</span>
      `;
      
      notificationsList.appendChild(listItem);
    });
  } else {
    // Show empty state
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.innerHTML = `<span class="item-icon">ℹ️</span>No new notifications`;
    notificationsList.appendChild(emptyItem);
  }
  
  // Add styles if they don't exist
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      .notification-item {
        background: #f8f9fa;
        border-left: 4px solid #1C4DEB;
        margin-bottom: 10px;
        padding: 10px 12px;
        border-radius: 4px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        cursor: default;
      }
      
      .notification-item.priority-high {
        border-left-color: #dc3545;
        background-color: #fff8f8;
      }
      
      .notification-item.priority-medium {
        border-left-color: #fd7e14;
        background-color: #fff9f2;
      }
      
      .notification-content {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        flex: 1;
      }
      
      .notification-icon {
        font-size: 16px;
      }
      
      .notification-text {
        display: flex;
        flex-direction: column;
      }
      
      .notification-title {
        font-weight: 500;
        margin-bottom: 2px;
      }
      
      .notification-message {
        font-size: 13px;
        color: #666;
      }
      
      .notification-time {
        font-size: 12px;
        color: #999;
        white-space: nowrap;
        margin-left: 10px;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Get the appropriate icon for a notification type
 */
function getNotificationIcon(type) {
  const icons = {
    'info': 'ℹ️',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌',
    'tip': '💡',
    'update': '🔄'
  };
  
  return icons[type] || 'ℹ️';
}

/**
 * Format the notification timestamp
 */
function formatNotificationTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

function injectStatsPanel() {
  console.log("Injecting Stats Panel...");

  // Check if the panel already exists
  if (document.getElementById("Archimind-stats-panel")) return;

  // Create the stats panel div
  const statsPanel = document.createElement("div");
  statsPanel.id = "Archimind-stats-panel";
  statsPanel.innerHTML = `
      <div id="Archimind-stats-summary">
          <div class="stat-item" data-tooltip="Total number of prompts used in this session">
              <span class="stat-icon">💬</span> <span id="total-prompts">0</span>
          </div>
          <div class="stat-item" data-tooltip="Average quality score of your conversations">
              <span class="stat-icon">⭐</span> <span id="average-score">-</span><span class="stat-unit">/20</span>
          </div>
          <div class="stat-item" data-tooltip="Energy efficiency of your AI usage">
              <span class="stat-icon">⚡</span> <span id="efficiency">-</span><span class="stat-unit">kWh</span>
          </div>
      </div>
  `;

  // Add the panel to the body
  document.body.appendChild(statsPanel);

  console.log("✅ Stats panel injected successfully");
}

/** Injects the Archimind floating button and popup modal */
function injectArchimindButton() {
  console.log("===========Injecting Archimind Button");
  if (document.getElementById("Archimind-extension-button")) return;

  // Floating Button
  const button = document.createElement("button");
  button.id = "Archimind-extension-button";
  button.setAttribute("aria-label", "Open Archimind");
  button.innerHTML = `<span class="button-pulse"></span>`;
  document.body.appendChild(button);

  // Modal
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
        <div id="Archimind-prompt-list">
          <h3><span class="section-icon">💡</span>My Templates</h3>
          <ul>
            <!-- Templates will be loaded here -->
            <li><span class="item-icon">💬</span>Loading templates...</li>
          </ul>
        </div>
        <h3><span class="section-icon">🚀</span>Quick Actions</h3>
        <ul id="Archimind-actions-list" class="features-list">
          <li id="generate-report-action"><span class="item-icon">📄</span>Generate Session Report</li>
          <li id="optimize-prompts-action"><span class="item-icon">✨</span>Analyze & Optimize Prompts</li>
          <li id="learn-techniques-action"><span class="item-icon">🧠</span>Learn Prompting Techniques</li>
        </ul>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Add animation delays to list items
  const listItems = modal.querySelectorAll('li');
  listItems.forEach((item, index) => {
    item.style.setProperty('--item-index', index);
  });

  // Button Click -> Show Modal with animation
  let isOpen = false;
  button.addEventListener("click", () => {
    isOpen = !isOpen;
    if (isOpen) {
      modal.classList.remove("hidden");
      // Reset animations
      const lists = modal.querySelectorAll('ul');
      lists.forEach(list => {
        const items = Array.from(list.children);
        items.forEach((item, index) => {
          const clone = item.cloneNode(true);
          clone.style.setProperty('--item-index', index);
          item.parentNode.replaceChild(clone, item);
        });
      });
      
      // Refresh data
      refreshModalData();
      
      // Update modal stats from the header stats
      const totalPromptsEl = document.getElementById('total-prompts');
      const modalTotalPromptsEl = document.getElementById('modal-total-prompts');
      if (totalPromptsEl && modalTotalPromptsEl) {
        modalTotalPromptsEl.textContent = totalPromptsEl.textContent;
      }
    } else {
      modal.classList.add("hidden");
    }
  });

  // Close Button
  document.getElementById("close-Archimind-modal").addEventListener("click", (e) => {
    e.stopPropagation();
    isOpen = false;
    modal.classList.add("hidden");
  });

  // Quick Actions Click Handlers
  document.getElementById('generate-report-action').addEventListener('click', () => {
    alert('This feature will generate a detailed report of your ChatGPT usage. Coming soon!');
  });
  
  document.getElementById('optimize-prompts-action').addEventListener('click', () => {
    alert('This feature will analyze your prompts and suggest improvements. Coming soon!');
  });
  
  document.getElementById('learn-techniques-action').addEventListener('click', () => {
    alert('This feature will provide tips and tricks for more effective prompting. Coming soon!');
  });

  // Close modal when clicking outside
  document.addEventListener('click', (event) => {
    if (isOpen && 
        !modal.contains(event.target) && 
        !button.contains(event.target)) {
      isOpen = false;
      modal.classList.add("hidden");
    }
  });
}

// ============ Existing Chat Saving & Processing Logic ============
function handleUrlChange() {
  const url = window.location.href;

  // If no /c/<chatId> => nothing to do (home page or brand new conversation not yet started)
  if (!/\/c\/[^/]+/.test(url)) {
    console.log('[ChatGPT Extension] No chat provider ID in URL.');
    chatHistoryData = { savedChatName: null, providerChatId: null };
    return;
  }

  // Extract the chatId
  const match = url.match(/\/c\/([^/?]+)/);
  if (!match || !match[1]) {
    chatHistoryData = fallbackNoHistory();
    return;
  }

  const chatId = match[1].trim();
  console.log('[ChatGPT Extension] Found chatId:', chatId);

  // Attempt immediate detection of a real title:
  const sidebarTitle = getChatTitleFromSidebar(chatId);

  // If sidebar is empty or "New Chat", treat as placeholder
  if (!sidebarTitle || sidebarTitle === 'New Chat') {
    const placeholder = `no_title_${Date.now()}`;
    console.log('Saving chat with placeholder title:', placeholder);

    startTitleCheckInterval(chatId);
    chatHistoryData = {
        savedChatName: placeholder,
        providerChatId: chatId,
      };
    saveChatToBackend({chatId, chatTitle:placeholder, providerName: 'chatGPT'});
  } else {
    // We found a real title
    console.log('Saving chat with title:', sidebarTitle);
    saveChatToBackend({chatId, chatTitle:sidebarTitle, providerName: 'chatGPT'});
    chatHistoryData = {
      savedChatName: sidebarTitle,
      providerChatId: chatId,
    };
  }
}

/**
 * Sets an interval to keep checking if the conversation's real title
 * has replaced "New Chat" (or is no longer missing).
 */
function startTitleCheckInterval(chatId) {
  // Clear any existing interval
  if (titleCheckInterval) {
    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }

  // Poll every 3 seconds
  titleCheckInterval = setInterval(() => {
    const possibleTitle = getChatTitleFromSidebar(chatId);

    // If still no title or it's "New Chat", wait and check again
    if (!possibleTitle || possibleTitle === 'New Chat') {
      return;
    }
    // Once we find a real title, update the record
    console.log('[ChatGPT Extension] Found updated title:', possibleTitle);

    saveChatToBackend({chatId, chatTitle:possibleTitle, providerName: 'chatGPT'});
    chatHistoryData.savedChatName = possibleTitle;

    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }, 3000);
}

/** Creates a fallback "no_history" record if we can't parse the chatId. */
function fallbackNoHistory() {
  const chatId = `no_history_${Date.now()}`;
  const chatTitle = `no_title_${Date.now()}`;
  saveChatToBackend({chatId, chatTitle, providerName: 'chatGPT'});
  return { savedChatName: chatTitle, providerChatId: chatId };
}

// ============ MutationObserver for new messages ============
let isProcessing = false;

function processNewArticleIfNotRunning(article) {
  if (isProcessing) return; // Skip if processing is already underway

  isProcessing = true;
  processChatGPTNewArticles(article, chatHistoryData.providerChatId, lastProcessedTurn, chatHistoryData)
    .then((updatedTurn) => {
      lastProcessedTurn = updatedTurn;
    })
    .catch((err) => {
      console.error('[ChatGPT Extension] Error in processChatGPTNewArticles:', err);
    })
    .finally(() => {
      isProcessing = false;
    });
}

function startMutationObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    // Check if a valid chat provider ID is set; if not, skip processing messages.
    if (!chatHistoryData.providerChatId) {
      return;
    }

    const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
    if (!articles || !articles.length) return;

    for (const article of articles) {
        const turnNumber = getTurnNumber(article);
        if (turnNumber == null) continue;
      
        const messageId = article.querySelector('div[data-message-id]')?.getAttribute('data-message-id');
        if (!messageId) continue;
      
        if (processedMessageIds.has(messageId)) {
          continue;
        }
        processedMessageIds.add(messageId);
      
        if (turnNumber > lastProcessedTurn) {
          processNewArticleIfNotRunning(article);
        }
      }
      
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ============ Detect URL changes ============
function listenForUrlChanges() {
  setInterval(() => {
    if (window.location.href !== currentURL) {
      console.log('[ChatGPT Extension] URL changed:', window.location.href);
      currentURL = window.location.href;

      processedMessageIds.clear();
      lastProcessedTurn = 0;

      handleUrlChange();
    }
  }, 1000);
}

// Clean up resources when the page is unloaded
window.addEventListener('beforeunload', () => {
  if (observer) {
    observer.disconnect();
  }
  
  if (titleCheckInterval) {
    clearInterval(titleCheckInterval);
  }
  
  if (statsUpdateInterval) {
    stopStatsUpdates();
  }
  
  if (promptEnhancer) {
    promptEnhancer.destroy();
  }
});