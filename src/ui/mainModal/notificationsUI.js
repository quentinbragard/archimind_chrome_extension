// src/ui/notificationsUI.js
import { Component } from '../../core/Component.js';
import { services } from '../../services/ServiceLocator.js';
import { formatTime } from '../../utils/domUtils.js';

export class NotificationsUI extends Component {
  constructor() {
    super(
      'notifications-container',
      (data) => `
        <div id="notifications-container">
          <ul id="notifications-list">
            ${this.renderNotifications(data.notifications || [])}
          </ul>
        </div>
      `,
      {
        'click:.notification-mark-read': (e, target) => {
          e.stopPropagation();
          const notificationItem = target.closest('.notification-item');
          if (notificationItem) {
            const notificationId = notificationItem.dataset.notificationId;
            this.markNotificationAsRead(notificationId);
          }
        },
        'click:.notification-action-button': (e, target) => {
          e.stopPropagation();
          const notificationItem = target.closest('.notification-item');
          if (notificationItem) {
            const notificationId = notificationItem.dataset.notificationId;
            this.handleNotificationAction(notificationId);
          }
        },
        'click:#clear-all-notifications': (e) => {
          e.stopPropagation();
          this.markAllNotificationsAsRead();
        },
        'click:.notification-item': (e, target) => {
          if (!target.classList.contains('read')) {
            const notificationId = target.dataset.notificationId;
            this.handleNotificationClick(notificationId);
          }
        }
      }
    );
    
    this.state = {
      notifications: []
    };
    
    // Add notification styles
    this.ensureNotificationStyles();
  }
  
  render(container, data = { notifications: [] }) {
    this.state.notifications = data.notifications;
    super.render(container, this.state);
    return this.element;
  }
  
  update(data = {}) {
    if (data.notifications) {
      this.state.notifications = data.notifications;
    }
    
    if (this.element) {
      const notificationsList = document.getElementById('notifications-list');
      if (notificationsList) {
        notificationsList.innerHTML = this.renderNotifications(this.state.notifications);
      }
    }
  }
  
  renderNotifications(notifications) {
    if (!notifications || notifications.length === 0) {
      return '<li class="empty-state"><span class="item-icon">ℹ️</span>No unread notifications</li>';
    }
    
    let html = `
      <div class="notifications-header">
        <div class="notifications-count">${notifications.length} unread notification${notifications.length !== 1 ? 's' : ''}</div>
        <button id="clear-all-notifications" class="clear-all-button">Mark all as read</button>
      </div>
    `;
    
    notifications.forEach((notification, index) => {
      html += this.createNotificationItem(notification, index);
    });
    
    return html;
  }
  
  createNotificationItem(notification, index) {
    // Check if notification is valid
    if (!notification || !notification.id) {
      console.error('❌ Invalid notification object', notification);
      return '';
    }
    
    return `
      <li class="notification-item ${notification.read_at ? 'read' : ''}"
          data-notification-id="${notification.id}"
          data-notification-type="${notification.type || 'default'}"
          style="--item-index: ${index}">
        <div class="notification-content">
          <span class="notification-icon">${this.getNotificationIcon(notification.type)}</span>
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
      </li>
    `;
  }
  
  async handleNotificationClick(notificationId) {
    const notification = this.state.notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    // Mark as read
    await this.markNotificationAsRead(notificationId);
    
    // If it has an action button, trigger the action
    if (notification.action_button) {
      this.handleNotificationAction(notificationId);
    }
  }
  
  async markNotificationAsRead(notificationId) {
    if (!notificationId) return false;
    
    try {
      // Find the notification in state
      const index = this.state.notifications.findIndex(n => n.id === notificationId);
      if (index === -1) return false;
      
      // Update locally first for responsive UI
      const now = new Date().toISOString();
      this.state.notifications[index].read_at = now;
      
      // Update UI directly for immediate feedback
      const notificationItem = document.querySelector(`li[data-notification-id="${notificationId}"]`);
      if (notificationItem) {
        notificationItem.classList.add('read');
      }
      
      // Call API service
      await services.api.markNotificationRead(notificationId);
      
      console.log('✅ Notification marked as read:', notificationId);
      
      // Refresh modal data
      const event = new CustomEvent('archimind:refresh-modal');
      document.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  }
  
  async markAllNotificationsAsRead() {
    try {
      const unreadCount = this.state.notifications.filter(n => !n.read_at).length;
      if (unreadCount === 0) return true;
      
      // Update locally first
      const now = new Date().toISOString();
      this.state.notifications.forEach(n => {
        if (!n.read_at) {
          n.read_at = now;
        }
      });
      
      // Call API service
      await services.api.markAllNotificationsRead();
      
      console.log(`✅ Marked ${unreadCount} notifications as read`);
      
      // Show success notification
      this.showToastNotification({
        title: 'Notifications Cleared',
        message: `All ${unreadCount} notifications have been marked as read.`,
        type: 'success'
      });
      
      // Refresh modal data
      const event = new CustomEvent('archimind:refresh-modal');
      document.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return false;
    }
  }
  
  async handleNotificationAction(notificationId) {
    // Find the notification
    const notification = this.state.notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    // Mark notification as read
    await this.markNotificationAsRead(notificationId);
    
    // Handle different notification types
    switch (notification.type) {
      case 'welcome_first_conversation':
        window.open('https://chat.openai.com/chat', '_blank');
        break;
      case 'insight_prompt_length':
      case 'insight_response_time':
      case 'insight_conversation_quality':
        this.showInsightDetails(notification);
        break;
      default:
        if (notification.action_button) {
          const event = new CustomEvent('archimind:refresh-modal');
          document.dispatchEvent(event);
        }
    }
  }
  
  showInsightDetails(notification) {
    // This is a placeholder for detailed analytics view
    this.showToastNotification({
      title: notification.title,
      message: 'Detailed analytics view coming soon!',
      type: 'info'
    });
  }
  
  getNotificationIcon(type) {
    if (!type) return 'ℹ️';
    
    if (type.startsWith('welcome')) return '👋';
    if (type.startsWith('insight')) return '💡';
    if (type.startsWith('alert')) return '⚠️';
    if (type.startsWith('error')) return '❌';
    if (type.startsWith('update')) return '🔄';
    if (type.startsWith('tip')) return '💬';
    
    return 'ℹ️';
  }
  
  showToastNotification(notification, duration = 5000) {
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
      <div class="archimind-toast-icon">${this.getNotificationIcon(notification.type)}</div>
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
        'error': '#F44336'
      };
      
      toast.style.borderLeftColor = colors[notification.type] || colors.info;
    }
    
    // Add close handler
    const closeBtn = toast.querySelector('.archimind-toast-close');
    closeBtn.addEventListener('click', () => {
      this.closeToast(toast);
    });
    
    // Auto-close after duration
    setTimeout(() => {
      this.closeToast(toast);
    }, duration);
  }
  
  closeToast(toast) {
    toast.classList.add('closing');
    
    // Remove after animation completes
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
  
  ensureNotificationStyles() {
    if (document.getElementById('notification-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'notification-styles';
    // Add notification styles here
    document.head.appendChild(style);
  }
}

// Create singleton instance
const notificationsUI = new NotificationsUI();

// Backward compatibility functions
export function renderNotifications(notifications) {
  const container = document.getElementById('Archimind-notifications');
  if (!container) {
    console.error('❌ Notifications container not found');
    return;
  }
  
  notificationsUI.render(container, { notifications });
}

export function showToastNotification(notification, duration = 5000) {
  notificationsUI.showToastNotification(notification, duration);
}