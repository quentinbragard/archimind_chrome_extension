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
    try {
        const response = await apiRequest('/notifications/');
        return response || [];
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];  // Return empty array instead of throwing to avoid breaking the UI
    }
}

/**
 * Fetch only unread notifications for the current user
 * @returns {Promise<Array>} Unread notifications array
 */
export async function fetchUnreadNotifications() {
    try {
        const response = await apiRequest('/notifications/unread');
        return response || [];
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        return [];  // Return empty array instead of throwing
    }
}

/**
 * Get notification counts (total and unread)
 * @returns {Promise<Object>} Counts object with total and unread properties
 */
export async function getNotificationCounts() {
    try {
        const response = await apiRequest('/notifications/count');
        return response || { total: 0, unread: 0 };
    } catch (error) {
        console.error('Error fetching notification counts:', error);
        return { total: 0, unread: 0 };
    }
}

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Response data
 */
export async function markNotificationRead(notificationId) {
    if (!notificationId) {
        console.error('Missing notification ID');
        return { success: false, error: 'Missing notification ID' };
    }
    
    try {
        const response = await apiRequest(`/notifications/${notificationId}/read`, {
            method: 'POST'
        });
        return response;
    } catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
        throw error;
    }
}

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Response data
 */
export async function markAllNotificationsRead() {
    try {
        const response = await apiRequest('/notifications/read-all', {
            method: 'POST'
        });
        return response;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
}

// Stats and Template API functions...

/**
 * Get user statistics
 * @returns {Promise<Object>} User stats
 */
export async function fetchUserStats() {
    try {
        return await apiRequest('/stats/user');
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return null;
    }
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
    const response = await apiRequest('/prompt-templates/save-template', {
        method: 'POST',
        body: JSON.stringify({
            content: templateData.content,
            folder: templateData.folder || null
        })
    });
    
    return response.template || response;
}

/**
 * Track template usage
 * @param {string} templateId - Template ID
 * @returns {Promise<Object>} Response data
 */
export async function trackTemplateUsage(templateId) {
    return apiRequest(`/prompt-templates/use-template/${templateId}`, {
        method: 'POST'
    });
}


/**
 * Get user's prompt templates organized by folders
 * @returns {Promise<Object>} Response with templates and folder structure
 */
export async function fetchUserTemplates() {
    try {
        const response = await apiRequest('/prompt-templates/templates');
        return response || { templates: [], folders: [], templates_by_folder: {} };
    } catch (error) {
        console.error('Error fetching user templates:', error);
        return { templates: [], folders: [], templates_by_folder: {} };
    }
}

/**
 * Get official prompt templates
 * @returns {Promise<Object>} Response with official templates and folder structure
 */
export async function fetchOfficialTemplates() {
    try {
        const response = await apiRequest('/prompt-templates/official-templates');
        return response || { templates: [], folders: [] };
    } catch (error) {
        console.error('Error fetching official templates:', error);
        return { templates: [], folders: [] };
    }
}

/**
 * Create a new template
 * @param {Object} templateData - Template data
 * @param {string} templateData.name - Template name
 * @param {string} templateData.content - Template content
 * @param {string} templateData.folder - Template folder (optional)
 * @param {string} templateData.description - Template description (optional)
 * @param {number} templateData.based_on_official_id - ID of official template to base on (optional)
 * @returns {Promise<Object>} Response with created template
 */
export async function createTemplate(templateData) {
    return apiRequest('/prompt-templates/template', {
        method: 'POST',
        body: JSON.stringify(templateData)
    });
}

/**
 * Update an existing template
 * @param {string} templateId - Template ID
 * @param {Object} templateData - Template data to update
 * @returns {Promise<Object>} Response with updated template
 */
export async function updateTemplate(templateId, templateData) {
    return apiRequest(`/prompt-templates/template/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData)
    });
}

/**
 * Delete a template
 * @param {string} templateId - Template ID
 * @returns {Promise<Object>} Response
 */
export async function deleteTemplate(templateId) {
    return apiRequest(`/prompt-templates/template/${templateId}`, {
        method: 'DELETE'
    });
}