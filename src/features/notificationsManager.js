import { markNotificationRead } from '../utils/api.js';
import { refreshModalData } from '../ui/modalManager.js';
import { showToastNotification } from '../ui/notificationsUI.js';
import { updateButton } from '../ui/mainButton.js';

// In-memory cache for notifications
let notificationsCache = [];

/**
 * Initializes the notifications manager
 * @param {Array} notifications - Initial notifications array
 */
export function initNotificationsManager(notifications = []) {
  console.log('🔔 Initializing notifications manager');
  
  // Set initial cache
  notificationsCache = notifications;
  
  // Update the main button badge to show unread count
  updateNotificationBadge();
}

/**
 * Updates the notification count badge on the main button
 */
function updateNotificationBadge() {
  const unreadCount = notificationsCache.filter(n => !n.read).length;
  
  if (unreadCount > 0) {
    updateButton({
      notification: unreadCount.toString(),
      pulse: true
    });
  } else {
    updateButton({
      notification: null,
      pulse: false
    });
  }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 */
export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return;
  
  try {
    // Find the notification in cache
    const index = notificationsCache.findIndex(n => n.id === notificationId);
    if (index === -1) return;
    
    // Update locally first for responsive UI
    notificationsCache[index].read = true;
    updateNotificationBadge();
    
    // Send to backend
    await markNotificationRead(notificationId);
    
    console.log('✅ Notification marked as read:', notificationId);
    
    // Refresh modal data to get updated list
    refreshModalData();
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    // Get all unread notification IDs
    const unreadIds = notificationsCache
      .filter(n => !n.read)
      .map(n => n.id);
    
    if (unreadIds.length === 0) return;
    
    // Update locally first
    notificationsCache.forEach(n => {
      n.read = true;
    });
    
    updateNotificationBadge();
    
    // Send to backend - would implement batch operation in actual API
    await Promise.all(unreadIds.map(id => markNotificationRead(id)));
    
    console.log('✅ All notifications marked as read');
    
    // Show success notification
    showToastNotification({
      title: 'Notifications Cleared',
      message: `All ${unreadIds.length} notifications have been marked as read.`,
      type: 'success'
    });
    
    // Refresh modal data
    refreshModalData();
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
  }
}

/**
 * Update the notifications cache
 * @param {Array} notifications - New notifications array
 */
export function updateNotificationsCache(notifications) {
  notificationsCache = notifications || [];
  updateNotificationBadge();
}

/**
 * Get a notification by ID
 * @param {string} notificationId - Notification ID
 * @returns {Object|null} Notification object or null
 */
export function getNotification(notificationId) {
  return notificationsCache.find(n => n.id === notificationId) || null;
}

/**
 * Get all notifications
 * @param {Object} filters - Filter options
 * @param {boolean} filters.unreadOnly - Only return unread notifications
 * @returns {Array} Filtered notifications
 */
export function getNotifications(filters = {}) {
  let filteredNotifications = [...notificationsCache];
  
  if (filters.unreadOnly) {
    filteredNotifications = filteredNotifications.filter(n => !n.read);
  }
  
  return filteredNotifications;
}

/**
 * Dismisses a notification locally (without backend call)
 * @param {string} notificationId - Notification ID 
 */
export function dismissNotification(notificationId) {
  const index = notificationsCache.findIndex(n => n.id === notificationId);
  if (index === -1) return;
  
  // Remove from cache
  notificationsCache.splice(index, 1);
  
  // Update badge
  updateNotificationBadge();
}