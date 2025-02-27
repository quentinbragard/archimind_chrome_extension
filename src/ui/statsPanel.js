import { animateCounterUpdate } from '../utils/domUtils.js';

/**
 * Injects the stats panel into the DOM
 */
export function injectStatsPanel() {
  console.log("📊 Injecting Stats Panel...");

  // Check if the panel already exists
  if (document.getElementById("Archimind-stats-panel")) {
    console.log("⚠️ Stats panel already exists, skipping injection");
    return;
  }

  // Create the stats panel element
  const statsPanel = document.createElement("div");
  statsPanel.id = "Archimind-stats-panel";
  statsPanel.innerHTML = `
      <div id="Archimind-stats-summary">
          <div class="stat-item" data-tooltip="Total number of prompts used in this session">
              <span class="stat-icon">💬</span> <span id="total-prompts">0</span>
          </div>
          <div class="stat-item" data-tooltip="Average quality score of your conversations">
              <span class="stat-icon">⭐</span> <span id="average-score">-</span><span class="stat-unit">/20</span>
          </div>
          <div class="stat-item" data-tooltip="Energy efficiency of your AI usage">
              <span class="stat-icon">⚡</span> <span id="efficiency">-</span><span class="stat-unit">kWh</span>
          </div>
      </div>
  `;

  // Add the panel to the body
  document.body.appendChild(statsPanel);

  console.log("✅ Stats panel injected successfully");
}

/**
 * Updates the stats panel with new data
 * @param {Object} stats - The stats object with updated values
 */
export function updateStatsPanel(stats) {
  const statsPanel = document.getElementById('Archimind-stats-panel');
  if (!statsPanel) return;

  // Update each stat with animation
  updateStatValue('total-prompts', stats.total_prompts);
  updateStatValue('average-score', stats.average_score);
  updateStatValue('efficiency', stats.energy_usage);
}

/**
 * Updates a single stat value with animation
 * @param {string} elementId - The ID of the element to update
 * @param {number|string} newValue - The new value
 */
function updateStatValue(elementId, newValue) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Skip if the value is undefined or null
  if (newValue === undefined || newValue === null) {
    element.textContent = '-';
    return;
  }

  // Parse current value
  const currentValue = element.textContent === '-' ? 0 : 
                      isNaN(parseFloat(element.textContent)) ? 0 : 
                      parseFloat(element.textContent);

  // Animate the counter update
  animateCounterUpdate(element, currentValue, newValue);
}

/**
 * Hides the stats panel
 */
export function hideStatsPanel() {
  const statsPanel = document.getElementById('Archimind-stats-panel');
  if (statsPanel) {
    statsPanel.style.display = 'none';
  }
}

/**
 * Shows the stats panel
 */
export function showStatsPanel() {
  const statsPanel = document.getElementById('Archimind-stats-panel');
  if (statsPanel) {
    statsPanel.style.display = '';
  }
}

/**
 * Removes the stats panel from the DOM
 */
export function removeStatsPanel() {
  const statsPanel = document.getElementById('Archimind-stats-panel');
  if (statsPanel) {
    statsPanel.remove();
  }
}