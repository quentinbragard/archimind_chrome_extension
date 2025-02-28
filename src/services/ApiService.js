// src/services/ApiService.js
import { getAuthToken, refreshAuthToken } from '../utils/auth.js';

export class ApiService {
  constructor(baseUrl = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl;
    this.tokenProvider = getAuthToken;
    this.refreshTokenProvider = refreshAuthToken;
  }
  
  async request(endpoint, options = {}) {
    try {
      // Get auth token
      let token = await this.tokenProvider();
      
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
      
      // Make request
      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);
      
      // Handle unauthorized (token expired)
      if (response.status === 403) {
        console.log('🔄 Token expired, refreshing...');
        token = await this.refreshTokenProvider();
        
        // Update authorization header with new token
        fetchOptions.headers.Authorization = `Bearer ${token}`;
        
        // Retry request with new token
        return this.request(endpoint, options);
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
  
  // User authentication
  async getUserStats() {
    return this.request('/stats/user');
  }
  
  // Templates
  async getUserTemplates() {
    return this.request('/prompt-templates/templates');
  }
  
  async getOfficialTemplates() {
    return this.request('/prompt-templates/official-templates');
  }
  
  async createTemplate(templateData) {
    return this.request('/prompt-templates/template', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  }
  
  async updateTemplate(templateId, templateData) {
    return this.request(`/prompt-templates/template/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData)
    });
  }
  
  async deleteTemplate(templateId) {
    return this.request(`/prompt-templates/template/${templateId}`, {
      method: 'DELETE'
    });
  }
  
  async trackTemplateUsage(templateId) {
    return this.request(`/prompt-templates/use-template/${templateId}`, {
      method: 'POST'
    });
  }
  
  // Messages
  async saveChatToBackend(chatData) {
    return this.request('/save/chat', {
      method: 'POST',
      body: JSON.stringify({
        provider_chat_id: chatData.chatId,
        title: chatData.chatTitle,
        provider_name: chatData.providerName
      })
    });
  }
  
  async saveMessageToBackend(messageData) {
    return this.request('/save/message', {
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
  
  // Notifications
  async fetchNotifications() {
    return this.request('/notifications/');
  }
  
  async fetchUnreadNotifications() {
    return this.request('/notifications/unread');
  }
  
  async getNotificationCounts() {
    return this.request('/notifications/count');
  }
  
  async markNotificationRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'POST'
    });
  }
  
  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'POST'
    });
  }
  
  // Prompt enhancement
  async enhancePrompt(promptData) {
    return this.request('/prompt-generator/enhance', {
      method: 'POST',
      body: JSON.stringify(promptData)
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();