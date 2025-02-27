import { getAuthToken, refreshAuthToken } from './auth.js';

// Base API URL
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Makes an authenticated API request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export async function apiRequest(endpoint, options = {}) {
    // Get auth token
    let token = await getAuthToken();
    
    // Set default options
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    // Merge options
    const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        // Make request
        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
        
        // Handle unauthorized (token expired)
        if (response.status === 403) {
            console.log('🔄 Token expired, refreshing...');
            token = await refreshAuthToken();
            
            // Update authorization header with new token
            fetchOptions.headers.Authorization = `Bearer ${token}`;
            
            // Retry request with new token
            return apiRequest(endpoint, options);
        }
        
        // Handle error responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `API error: ${response.status}`);
        }
        
        // Parse response
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`❌ API request failed (${endpoint}):`, error);
        throw error;
    }
}

// Original API functions...

/**
 * Save a chat to the backend
 * @param {Object} chatData - Chat data
 * @returns {Promise<Object>} Response data
 */
export async function saveChatToBackend(chatData) {
    return apiRequest('/save/chat', {
        method: 'POST',
        body: JSON.stringify({
            provider_chat_id: chatData.chatId,
            title: chatData.chatTitle,
            provider_name: chatData.providerName
        })
    });
}

/**
 * Save a message to the backend
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Response data
 */
export async function saveMessageToBackend(messageData) {
    return apiRequest('/save/message', {
        method: 'POST',
        body: JSON.stringify({
            message_id: messageData.messageId,
            content: messageData.message,
            role: messageData.role,
            rank: messageData.rank,
            provider_chat_id: messageData.providerChatId,
            model: messageData.model || 'unknown',
            thinking_time: messageData.thinkingTime || 0
        })
    });
}

// Notification related API functions

/**
 * Fetch all notifications for the current user
 * @returns {Promise<Array>} Notifications array
 */
export async function fetchNotifications() {
    return apiRequest('/notifications');
}

/**
 * Fetch only unread notifications for the current user
 * @returns {Promise<Array>} Unread notifications array
 */
export async function fetchUnreadNotifications() {
    return apiRequest('/notifications/unread');
}

/**
 * Get notification counts (total and unread)
 * @returns {Promise<Object>} Counts object with total and unread properties
 */
export async function getNotificationCounts() {
    return apiRequest('/notifications/count');
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Response data
 */
export async function markNotificationRead(notificationId) {
    return apiRequest(`/notifications/${notificationId}/read`, {
        method: 'POST'
    });
}

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Response data
 */
export async function markAllNotificationsRead() {
    return apiRequest('/notifications/read-all', {
        method: 'POST'
    });
}

// Stats and Template API functions...

/**
 * Get user statistics
 * @returns {Promise<Object>} User stats
 */
export async function fetchUserStats() {
    return apiRequest('/stats/user');
}

/**
 * Get user's prompt templates
 * @returns {Promise<Array>} Templates array
 */
export async function fetchPromptTemplates() {
    const response = await apiRequest('/stats/templates');
    return response.templates || [];
}

// Prompt enhancement API functions...

/**
 * Enhance a prompt
 * @param {Object} promptData - Prompt data
 * @returns {Promise<Object>} Enhanced prompt data
 */
export async function enhancePrompt(promptData) {
    return apiRequest('/prompt-generator/enhance', {
        method: 'POST',
        body: JSON.stringify(promptData)
    });
}

/**
 * Save a template
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Saved template
 */
export async function saveTemplate(templateData) {
    const response = await apiRequest('/prompt-generator/save-template', {
        method: 'POST',
        body: JSON.stringify(templateData)
    });
    
    return response.template || response;
}

/**
 * Track template usage
 * @param {string} templateId - Template ID
 * @returns {Promise<Object>} Response data
 */
export async function trackTemplateUsage(templateId) {
    return apiRequest(`/prompt-generator/use-template/${templateId}`, {
        method: 'POST'
    });
}