import { markNotificationAsRead } from '../features/notificationsManager.js';

/**
 * Renders notifications in the modal
 * @param {Array} notifications - Array of notification objects
 */
export function renderNotifications(notifications) {
  const notificationsList = document.getElementById('notifications-list');
  if (!notificationsList) return;
  
  // Clear existing notifications
  notificationsList.innerHTML = '';
  
  // Add notifications or empty state
  if (notifications && notifications.length > 0) {
    notifications.forEach((notification, index) => {
      const listItem = createNotificationItem(notification, index);
      notificationsList.appendChild(listItem);
    });
  } else {
    appendEmptyState(notificationsList, 'No new notifications');
  }
}

/**
 * Creates a notification list item
 * @param {Object} notification - Notification object
 * @param {number} index - Index for animation delay
 * @returns {HTMLElement} Notification list item
 */
function createNotificationItem(notification, index) {
  const listItem = document.createElement('li');
  listItem.className = 'notification-item';
  listItem.setAttribute('data-notification-id', notification.id);
  listItem.style.setProperty('--item-index', index);
  
  // Add priority class if present
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
  
  // Add click handler to mark as read
  listItem.addEventListener('click', () => {
    markNotificationAsRead(notification.id);
    listItem.classList.add('read');
  });
  
  return listItem;
}

/**
 * Get the appropriate icon for a notification type
 * @param {string} type - Notification type
 * @returns {string} Icon emoji
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
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time string
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

/**
 * Shows a toast notification
 * @param {Object} notification - Notification object
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {string} notification.type - Notification type
 * @param {number} duration - Duration in ms (default: 5000)
 */
export function showToastNotification(notification, duration = 5000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('archimind-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'archimind-toast-container';
    document.body.appendChild(toastContainer);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #archimind-toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .archimind-toast {
        background: white;
        border-left: 4px solid #1C4DEB;
        padding: 12px 15px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 300px;
        animation: toast-in 0.3s ease forwards;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      
      .archimind-toast.closing {
        animation: toast-out 0.3s ease forwards;
      }
      
      .archimind-toast-icon {
        font-size: 18px;
      }
      
      .archimind-toast-content {
        flex: 1;
      }
      
      .archimind-toast-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 3px;
      }
      
      .archimind-toast-message {
        font-size: 13px;
        color: #555;
      }
      
      .archimind-toast-close {
        cursor: pointer;
        font-size: 16px;
        opacity: 0.6;
        transition: opacity 0.2s ease;
      }
      
      .archimind-toast-close:hover {
        opacity: 1;
      }
      
      @keyframes toast-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes toast-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'archimind-toast';
  toast.innerHTML = `
    <div class="archimind-toast-icon">${getNotificationIcon(notification.type)}</div>
    <div class="archimind-toast-content">
      <div class="archimind-toast-title">${notification.title}</div>
      <div class="archimind-toast-message">${notification.message}</div>
    </div>
    <div class="archimind-toast-close">×</div>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Set type-specific styles
  if (notification.type) {
    const colors = {
      'info': '#1C4DEB',
      'success': '#28a745',
      'warning': '#ffc107',
      'error': '#dc3545',
      'tip': '#17a2b8',
      'update': '#6f42c1'
    };
    
    toast.style.borderLeftColor = colors[notification.type] || colors.info;
  }
  
  // Add close handler
  const closeBtn = toast.querySelector('.archimind-toast-close');
  closeBtn.addEventListener('click', () => {
    closeToast(toast);
  });
  
  // Auto-close after duration
  setTimeout(() => {
    closeToast(toast);
  }, duration);
}

/**
 * Closes a toast notification with animation
 * @param {HTMLElement} toast - Toast element
 */
function closeToast(toast) {
  toast.classList.add('closing');
  
  // Remove after animation completes
  setTimeout(() => {
    toast.remove();
  }, 300);
}