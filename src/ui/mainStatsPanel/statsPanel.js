// src/ui/statsPanel.js
import { Component } from '../../core/Component.js';
import { services } from '../../services/ServiceLocator.js';
import { animateCounterUpdate } from '../../utils/domUtils.js';

export class StatsPanel extends Component {
  constructor() {
    super(
      'Archimind-stats-panel',
      () => `
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
      `,
      {}
    );
  }
  
  async updateStats() {
    try {
      const stats = await services.api.getUserStats();
      
      if (this.element) {
        this.updateStatValue('total-prompts', stats.total_prompts);
        this.updateStatValue('average-score', stats.average_score);
        this.updateStatValue('efficiency', stats.energy_usage);
      }
    } catch (error) {
      console.error("❌ Error updating stats:", error);
    }
  }
  
  updateStatValue(elementId, newValue) {
    const element = this.element.querySelector(`#${elementId}`);
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
  
  startUpdates(interval = 30000) {
    // Initial update
    this.updateStats();
    
    // Schedule regular updates
    this.updateInterval = setInterval(() => this.updateStats(), interval);
    
    return this.updateInterval;
  }
  
  stopUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  show() {
    if (this.element) {
      this.element.style.display = '';
    }
  }
  
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }
  
  remove() {
    this.stopUpdates();
    super.remove();
  }
}

// Create singleton instance
const statsPanel = new StatsPanel();

// Backward compatibility functions
export function injectStatsPanel() {
  statsPanel.render(document.body);
  console.log("📊 Injecting Stats Panel...");
}

export function updateStatsPanel(stats) {
  if (stats) {
    statsPanel.updateStatValue('total-prompts', stats.total_prompts);
    statsPanel.updateStatValue('average-score', stats.average_score);
    statsPanel.updateStatValue('efficiency', stats.energy_usage);
  } else {
    statsPanel.updateStats();
  }
}

export function startStatsUpdates(interval = 30000) {
  return statsPanel.startUpdates(interval);
}

export function stopStatsUpdates() {
  statsPanel.stopUpdates();
}

export function hideStatsPanel() {
  statsPanel.hide();
}

export function showStatsPanel() {
  statsPanel.show();
}

export function removeStatsPanel() {
  statsPanel.remove();
}