// src/utils/statsManager.js
import { services } from '../services/ServiceLocator.js';
import { updateStatsPanel } from '../ui/mainStatsPanel/statsPanel.js';

// Cache for stats to prevent unnecessary UI updates
let statsCache = {
  lastFetch: 0,
  totalPrompts: 0,
  averageScore: 0,
  energyUsage: 0
};

/**
 * Fetches user stats from the backend
 * @returns {Promise<object>} User stats object
 */
export async function fetchUserStats() {
  try {
    const data = await services.api.getUserStats();
    
    // Update cache
    statsCache = {
      lastFetch: Date.now(),
      ...data
    };
    
    return data;
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);
    // Return cached data if available, otherwise empty object
    return statsCache.lastFetch > 0 ? statsCache : {
      total_prompts: 0,
      average_score: 0,
      energy_usage: 0
    };
  }
}


// Schedule regular updates
let updateInterval = null;

/**
 * Starts the automatic stats update
 * @param {number} interval Interval in milliseconds (default 30s)
 */
export function startStatsUpdates(interval = 30000) {
  // Initial update
  updateStatsPanel();
  
  // Clear existing interval if any
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // Schedule regular updates
  updateInterval = setInterval(updateStatsPanel, interval);
  
  // Return the interval ID for potential cleanup
  return updateInterval;
}

/**
 * Stops the automatic stats update
 */
export function stopStatsUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}