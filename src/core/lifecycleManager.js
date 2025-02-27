import { cleanup } from './init.js';
import { stopMessageObserver } from '../chat/turnObserver.js';
import { stopUrlChangeListener } from './urlManager.js';

/**
 * Sets up handlers for page lifecycle events
 */
export function setupLifecycleHandlers() {
  // Handle page unload
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Handle visibility change (tab switch, minimize)
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  console.log('🔄 Lifecycle handlers registered');
}

/**
 * Handles cleanup before the page unloads
 */
function handleBeforeUnload() {
  console.log('👋 Page unloading, cleaning up...');
  
  // Clean up observers
  stopMessageObserver();
  stopUrlChangeListener();
  
  // Clean up all other resources
  cleanup();
}

/**
 * Handles visibility change events
 */
function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    console.log('⏸️ Page hidden, pausing non-essential operations');
    // We could pause polling or other resource-intensive operations here
    // but keep critical observers running
  } else if (document.visibilityState === 'visible') {
    console.log('▶️ Page visible again, resuming operations');
    // Resume operations if needed
  }
}

/**
 * Remove all lifecycle handlers (useful for testing or manual cleanup)
 */
export function removeLifecycleHandlers() {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  console.log('🧹 Lifecycle handlers removed');
}