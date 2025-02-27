import { getUserId } from '../utils/auth.js';
import { startUrlChangeListener } from './urlManager.js';
import { initializeChatHistory } from '../chat/chatHistoryManager.js';
import { startMessageObserver } from '../chat/turnObserver.js';
import { injectStatsPanel } from '../ui/statsPanel.js';
import { injectMainButton } from '../ui/mainButton.js';
import { startStatsUpdates } from '../utils/statsManager.js';
import { PromptEnhancer } from '../features/promptEnhancer.js';

// Global state
let isInitialized = false;
let promptEnhancer = null;
let statsUpdateInterval = null;

/**
 * Initialize the extension
 * @returns {Promise<boolean>} Whether initialization was successful
 */
export async function initialize() {
  if (isInitialized) {
    console.log('⚠️ Archimind already initialized, skipping');
    return true;
  }

  try {
    console.log('🔍 Checking user authentication...');
    const userId = await getUserId();
    
    if (!userId) {
      console.error('❌ User authentication failed - no user ID found');
      return false;
    }
    
    console.log('👤 User authenticated:', userId);
    
    // Initialize UI components
    injectStatsPanel();
    injectMainButton();
    
    // Initialize chat functionality
    initializeChatHistory();
    startMessageObserver();
    
    // Initialize URL change detection
    startUrlChangeListener();
    
    // Start data polling
    statsUpdateInterval = startStatsUpdates(30000); // Update every 30 seconds
    
    // Initialize prompt enhancer
    promptEnhancer = new PromptEnhancer();
    promptEnhancer.init();
    
    // Set initialization flag
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    return false;
  }
}

/**
 * Clean up all resources
 */
export function cleanup() {
  if (!isInitialized) return;
  
  // Stop stats updates
  if (statsUpdateInterval) {
    clearInterval(statsUpdateInterval);
    statsUpdateInterval = null;
  }
  
  // Clean up prompt enhancer
  if (promptEnhancer) {
    promptEnhancer.destroy();
    promptEnhancer = null;
  }
  
  isInitialized = false;
}

/**
 * Get the current initialization state
 * @returns {boolean} Whether the extension is initialized
 */
export function getInitializationState() {
  return {
    isInitialized,
    hasPromptEnhancer: !!promptEnhancer,
    hasStatsUpdates: !!statsUpdateInterval
  };
}