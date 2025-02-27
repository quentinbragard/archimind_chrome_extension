import { markNotificationAsRead, markAllNotificationsAsRead, handleNotificationAction } from '../features/notificationsManager.js';
import { formatTime } from '../utils/domUtils.js';

/**
 * Renders notifications in the modal
 * @param {Array} notifications - Array of notification objects
 */
export function renderNotifications(notifications) {
    const notificationsList = document.getElementById('notifications-list');
    if (!notificationsList) {
        console.error('❌ Notifications list element not found');
        return;
    }
    
    // Clear existing notifications
    notificationsList.innerHTML = '';
    
    // Add header with count and clear button if we have notifications
    if (notifications && notifications.length > 0) {
        // Add clear all button
        const headerContainer = document.createElement('div');
        headerContainer.className = 'notifications-header';
        headerContainer.innerHTML = `
            <div class="notifications-count">${notifications.length} unread notification${notifications.length !== 1 ? 's' : ''}</div>
            <button id="clear-all-notifications" class="clear-all-button">Mark all as read</button>
        `;
        notificationsList.appendChild(headerContainer);
        
        // Add event listener for clear all button
        const clearAllBtn = headerContainer.querySelector('#clear-all-notifications');
        clearAllBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await markAllNotificationsAsRead();
        });
        
        // Add notifications
        notifications.forEach((notification, index) => {
            const listItem = createNotificationItem(notification, index);
            notificationsList.appendChild(listItem);
        });
    } else {
        appendEmptyState(notificationsList, 'No unread notifications');
    }
    
    // Add notification styles if they don't exist
    ensureNotificationStyles();
}

/**
 * Creates a notification list item
 * @param {Object} notification - Notification object
 * @param {number} index - Index for animation delay
 * @returns {HTMLElement} Notification list item
 */
function createNotificationItem(notification, index) {
    // Check if notification is valid
    if (!notification || !notification.id) {
        console.error('❌ Invalid notification object', notification);
        return document.createElement('li');
    }
    
    const listItem = document.createElement('li');
    listItem.className = 'notification-item';
    if (notification.read_at) {
        listItem.classList.add('read');
    }
    
    listItem.setAttribute('data-notification-id', notification.id);
    listItem.setAttribute('data-notification-type', notification.type || 'default');
    listItem.style.setProperty('--item-index', index);
    
    // Add notification content
    listItem.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(notification.type)}</span>
            <div class="notification-text">
                <span class="notification-title">${notification.title || 'Notification'}</span>
                <span class="notification-body">${notification.body || ''}</span>
                ${notification.action_button ? 
                    `<button class="notification-action-button">${notification.action_button}</button>` : ''}
            </div>
        </div>
        <div class="notification-meta">
            <span class="notification-time">${formatTime(notification.created_at, { relative: true })}</span>
            <button class="notification-mark-read" title="Mark as read">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </button>
        </div>
    `;
    
    // Add click handler for the notification action button
    const actionButton = listItem.querySelector('.notification-action-button');
    if (actionButton) {
        actionButton.addEventListener('click', (e) => {
            e.stopPropagation();
            handleNotificationAction(notification.id);
        });
    }
    
    // Add click handler for mark as read button
    const markReadBtn = listItem.querySelector('.notification-mark-read');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            markNotificationAsRead(notification.id);
        });
    }
    
    // Add click handler for the whole notification (if not already read)
    if (!notification.read_at) {
        listItem.addEventListener('click', () => {
            markNotificationAsRead(notification.id);
            
            // If it has an action button, trigger the action
            if (notification.action_button) {
                handleNotificationAction(notification.id);
            }
        });
    }
    
    return listItem;
}

/**
 * Ensure notification styles are added to the document
 */
function ensureNotificationStyles() {
    if (document.getElementById('notification-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notifications-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 0 10px 0;
            border-bottom: 1px solid #eee;
            margin-bottom: 10px;
        }
        
        .notifications-count {
            font-size: 14px;
            font-weight: 500;
            color: #666;
        }
        
        .clear-all-button {
            background: none;
            border: none;
            color: #1C4DEB;
            font-size: 13px;
            cursor: pointer;
            padding: 3px 6px;
            border-radius: 4px;
        }
        
        .clear-all-button:hover {
            background: rgba(28, 77, 235, 0.1);
        }
        
        .notification-item {
            background: #f8f9fa;
            border-left: 4px solid #1C4DEB;
            margin-bottom: 12px;
            padding: 12px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            cursor: pointer;
            transition: all 0.2s ease;
            animation: slideIn 0.3s ease forwards;
            animation-delay: calc(var(--item-index, 0) * 0.08s);
        }
        
        .notification-item:hover {
            background: #f0f4f9;
            transform: translateX(3px);
        }
        
        .notification-item.read {
            border-left-color: #ccc;
            opacity: 0.7;
            cursor: default;
        }
        
        .notification-item.read:hover {
            transform: none;
        }
        
        .notification-content {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            flex: 1;
        }
        
        .notification-icon {
            font-size: 18px;
            margin-top: 2px;
        }
        
        .notification-text {
            display: flex;
            flex-direction: column;
            flex: 1;
        }
        
        .notification-title {
            font-weight: 600;
            margin-bottom: 4px;
            font-size: 14px;
        }
        
        .notification-body {
            font-size: 13px;
            color: #555;
            margin-bottom: 8px;
            line-height: 1.4;
        }
        
        .notification-action-button {
            align-self: flex-start;
            background: #1C4DEB;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            margin-top: 5px;
            transition: background 0.2s ease;
        }
        
        .notification-action-button:hover {
            background: #0e3bc5;
        }
        
        .notification-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
            margin-left: 12px;
        }
        
        .notification-time {
            font-size: 11px;
            color: #888;
            white-space: nowrap;
        }
        
        .notification-mark-read {
            background: none;
            border: none;
            color: #888;
            padding: 4px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            visibility: hidden;
            opacity: 0;
            transition: all 0.2s ease;
        }
        
        .notification-item:hover .notification-mark-read {
            visibility: visible;
            opacity: 1;
        }
        
        .notification-mark-read:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #1C4DEB;
        }
        
        /* Notification types */
        .notification-item[data-notification-type^="welcome"] {
            border-left-color: #4CAF50;
        }
        
        .notification-item[data-notification-type^="insight"] {
            border-left-color: #2196F3;
        }
        
        .notification-item[data-notification-type^="alert"] {
            border-left-color: #FF9800;
        }
        
        .notification-item[data-notification-type^="error"] {
            border-left-color: #F44336;
        }
        
        .empty-state {
            text-align: center;
            padding: 20px;
            color: #888;
            font-style: italic;
            font-size: 14px;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-10px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        /* Toast notification styles */
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

/**
 * Get the appropriate icon for a notification type
 * @param {string} type - Notification type
 * @returns {string} Icon emoji
 */
function getNotificationIcon(type) {
    if (!type) return 'ℹ️';
    
    if (type.startsWith('welcome')) return '👋';
    if (type.startsWith('insight')) return '💡';
    if (type.startsWith('alert')) return '⚠️';
    if (type.startsWith('error')) return '❌';
    if (type.startsWith('update')) return '🔄';
    if (type.startsWith('tip')) return '💬';
    
    return 'ℹ️';
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
            'success': '#4CAF50',
            'warning': '#FF9800',
            'error': '#F44336',
            'tip': '#2196F3',
            'update': '#9C27B0'
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