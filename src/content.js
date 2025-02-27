import { initialize } from './core/init.js';
import { setupLifecycleHandlers } from './core/lifecycleManager.js';

// Main entry point - keep this file minimal to make the overall structure clear
(async function main() {
  console.log('🚀 Archimind Extension starting up...');
  
  // Initialize core functionality
  await initialize();
  
  // Set up cleanup handlers
  setupLifecycleHandlers();
  
  console.log('✅ Archimind Extension initialized successfully');
})();