import { services } from '../services/ServiceLocator.js';
import { showToastNotification } from '../ui/mainModal/notificationsUI.js';
import { updateButton } from '../ui/mainButton/mainButton.js';

// In-memory cache for notifications
let notificationsCache = [];
let isPollingActive = false;
let pollingInterval = null;
const POLLING_INTERVAL = 60000; // Check for new notifications every minute

/**
 * Initializes the notifications manager and starts polling
 */
export async function initNotificationsManager() {
    console.log('🔔 Initializing notifications manager');
    
    try {
        // Initial fetch of notifications
        await refreshNotifications();
        
        // Start polling for new notifications
        startNotificationPolling();
        
        return true;
    } catch (error) {
        console.error('❌ Error initializing notifications manager:', error);
        return false;
    }
}

/**
 * Refreshes notifications from the server
 */
export async function refreshNotifications() {
    try {
        const prevUnreadCount = getUnreadCount();
        const notifications = await services.api.fetchNotifications();
        notificationsCache = notifications || [];
        
        // Update the main button badge to show unread count
        const newUnreadCount = getUnreadCount();
        updateNotificationBadge();
        
        // Add pulse effect when new notifications arrive
        if (newUnreadCount > prevUnreadCount) {
            updateButton({
                notification: newUnreadCount.toString(),
                pulse: true
            });
        }
        
        console.log(`✅ Fetched ${notifications.length} notifications (${newUnreadCount} unread)`);
        
        return notifications;
    } catch (error) {
        console.error('❌ Error refreshing notifications:', error);
        return notificationsCache; // Return cached data on error
    }
}

/**
 * Starts polling for new notifications
 */

export function startNotificationPolling() {
    if (isPollingActive) return;
    
    console.log('🔄 Starting notification polling');
    
    isPollingActive = true;
    pollingInterval = setInterval(async () => {
        const currentUnreadCount = getUnreadCount();
        const previousNotifications = [...notificationsCache]; // Save current state
        
        await refreshNotifications();
        
        // If we have new unread notifications, show a toast
        const newUnreadCount = getUnreadCount();
        if (newUnreadCount > currentUnreadCount) {
            const newCount = newUnreadCount - currentUnreadCount;
            
            // Add animation to the badge
            const badgeElement = document.querySelector('.notification-badge');
            if (badgeElement) {
                badgeElement.style.animation = 'none';
                setTimeout(() => {
                    badgeElement.style.animation = 'badge-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                }, 10);
            }
            
            showToastNotification({
                title: `${newCount} New Notification${newCount > 1 ? 's' : ''}`,
                message: 'Click to view your notifications',
                type: 'info'
            });
        }
    }, POLLING_INTERVAL);
}
/**
 * Stops polling for new notifications
 */
export function stopNotificationPolling() {
    if (!isPollingActive) return;
    
    console.log('🛑 Stopping notification polling');
    
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    
    isPollingActive = false;
}

/**
 * Updates the notification count badge on the main button
 */
function updateNotificationBadge() {
    const unreadCount = getUnreadCount();
    
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
 * Gets the count of unread notifications
 * @returns {number} Unread count
 */
function getUnreadCount() {
    return notificationsCache.filter(n => !n.read_at).length;
}

/**
 * Handles a notification action button click
 * @param {string} notificationId - Notification ID
 */
export async function handleNotificationAction(notificationId) {
    // Find the notification
    const notification = notificationsCache.find(n => n.id === notificationId);
    if (!notification) return;
    
    // Mark notification as read
    await markNotificationAsRead(notificationId);
    
    // Handle different notification types
    switch (notification.type) {
        case 'welcome_first_conversation':
            // Navigate to ChatGPT page or open new chat
            window.open('https://chat.openai.com/chat', '_blank');
            break;
            
        case 'insight_prompt_length':
        case 'insight_response_time':
        case 'insight_conversation_quality':
            // Show insight details in a dialog
            showInsightDetails(notification);
            break;
            
        default:
            // Default action is to open the modal if there's no specific action
            if (notification.action_button) {
                // Instead of directly calling refreshModalData which may create circular dependencies,
                // we'll use a DOM event to trigger it
                const event = new CustomEvent('archimind:refresh-modal');
                document.dispatchEvent(event);
            }
    }
}

/**
 * Shows detailed information for an insight notification
 * @param {Object} notification - Notification object
 */
function showInsightDetails(notification) {
    // This is a placeholder - you would implement a dialog or panel
    // to display more detailed analytics based on the insight type
    showToastNotification({
        title: notification.title,
        message: 'Detailed analytics view coming soon!',
        type: 'info'
    });
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
        const now = new Date().toISOString();
        notificationsCache[index].read_at = now;
        updateNotificationBadge();
        
        // Update UI directly for immediate visual feedback
        const notificationItem = document.querySelector(`li[data-notification-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.classList.add('read');
            
            // Optional: Add a transition effect
            notificationItem.style.transition = 'opacity 0.3s ease, background-color 0.3s ease';
            notificationItem.style.opacity = '0.7';
        }
        
        // Send to backend
        await services.api.markNotificationRead(notificationId);
        
        console.log('✅ Notification marked as read:', notificationId);
        
        // Refresh modal data by triggering an event
        const event = new CustomEvent('archimind:refresh-modal');
        document.dispatchEvent(event);
        
        return true;
    } catch (error) {
        console.error('❌ Error marking notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
    try {
        // Get all unread notification IDs
        const unreadCount = getUnreadCount();
        
        if (unreadCount === 0) return true;
        
        // Update locally first
        const now = new Date().toISOString();
        notificationsCache.forEach(n => {
            if (!n.read_at) {
                n.read_at = now;
            }
        });
        
        updateNotificationBadge();
        
        // Send to backend
        await services.api.markAllNotificationsRead();
        
        console.log(`✅ Marked ${unreadCount} notifications as read`);
        
        // Show success notification
        showToastNotification({
            title: 'Notifications Cleared',
            message: `All ${unreadCount} notifications have been marked as read.`,
            type: 'success'
        });
        
        // Refresh modal data by triggering an event
        const event = new CustomEvent('archimind:refresh-modal');
        document.dispatchEvent(event);
        
        return true;
    } catch (error) {
        console.error('❌ Error marking all notifications as read:', error);
        return false;
    }
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
        filteredNotifications = filteredNotifications.filter(n => !n.read_at);
    }
    
    return filteredNotifications;
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
 * Cleanup function to call when unloading the manager
 */
export function cleanup() {
    stopNotificationPolling();
    notificationsCache = [];
}