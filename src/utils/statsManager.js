import { getAuthToken, refreshAuthToken } from './auth.js';

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
        // Get auth token
        let token = await getAuthToken();
        
        // Make API request
        const response = await fetch('http://127.0.0.1:8000/stats/user', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        
        // Handle unauthorized (token expired)
        if (response.status === 403) {
            token = await refreshAuthToken();
            return fetchUserStats(); // Retry with new token
        }
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
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

/**
 * Updates the stats panel with latest data
 */
export async function updateStatsPanel() {
    const statsPanel = document.getElementById('Archimind-stats-panel');
    if (!statsPanel) return;
    
    try {
        const stats = await fetchUserStats();
        
        // Update DOM elements
        const promptsEl = document.getElementById('total-prompts');
        const scoreEl = document.getElementById('average-score');
        const efficiencyEl = document.getElementById('efficiency');
        
        if (promptsEl && stats.total_prompts !== undefined) {
            animateCounterUpdate(promptsEl, parseInt(promptsEl.textContent), stats.total_prompts);
        }
        
        if (scoreEl && stats.average_score !== undefined && stats.average_score !== null) {
            animateCounterUpdate(scoreEl, parseFloat(scoreEl.textContent) || 0, stats.average_score);
        } else if (scoreEl) {
            scoreEl.textContent = '-';
        }
        
        if (efficiencyEl && stats.energy_usage !== undefined) {
            animateCounterUpdate(efficiencyEl, parseFloat(efficiencyEl.textContent) || 0, stats.energy_usage);
        }
    } catch (error) {
        console.error("❌ Error updating stats panel:", error);
    }
}

/**
 * Animates a counter update for better UX
 * @param {HTMLElement} element Element containing the counter
 * @param {number} startVal Starting value
 * @param {number} endVal Ending value
 */
function animateCounterUpdate(element, startVal, endVal) {
    // Skip animation for initial value or if difference is tiny
    if (isNaN(startVal) || Math.abs(endVal - startVal) < 0.01) {
        element.textContent = typeof endVal === 'number' && endVal % 1 !== 0 
            ? endVal.toFixed(1) 
            : endVal;
        return;
    }
    
    // Change text color briefly for visual feedback
    element.style.transition = 'color 0.5s ease';
    element.style.color = '#1C4DEB'; // Highlight color
    
    // For small numbers, use a simple animation
    const duration = 1000; // 1 second
    const frames = 20;
    const step = (endVal - startVal) / frames;
    
    let current = startVal;
    let frame = 0;
    
    const animate = () => {
        frame++;
        current += step;
        
        // Ensure we end exactly at the endVal
        if (frame === frames) {
            current = endVal;
        }
        
        // Update the text content
        element.textContent = typeof endVal === 'number' && endVal % 1 !== 0 
            ? current.toFixed(1) 
            : Math.round(current);
        
        // Continue animation or reset styles at completion
        if (frame < frames) {
            requestAnimationFrame(animate);
        } else {
            setTimeout(() => {
                element.style.color = ''; // Reset to original color
            }, 500);
        }
    };
    
    requestAnimationFrame(animate);
}

/**
 * Fetches user's prompt templates
 * @returns {Promise<Array>} Array of template objects
 */
export async function fetchPromptTemplates() {
    try {
        const token = await getAuthToken();
        
        const response = await fetch('http://127.0.0.1:8000/stats/templates', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.templates || [];
    } catch (error) {
        console.error("❌ Error fetching templates:", error);
        return [];
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