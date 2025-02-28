// src/ui/mainButton.js
import { Component } from '../../core/Component.js';
import { toggleModal, refreshModalData } from '../mainModal/modalManager.js';

export class MainButton extends Component {
  constructor() {
    super(
      'Archimind-extension-button',
      (data) => `
        <button id="Archimind-extension-button" aria-label="Open Archimind">
          <span class="button-pulse" style="display: ${data.pulse ? 'block' : 'none'}"></span>
          ${data.notification ? 
            `<span class="notification-badge ${data.important ? 'important' : ''}">${data.notification}</span>` : 
            ''}
        </button>
      `,
      {
        'click': (e) => {
          e.stopPropagation();
          toggleModal();
          refreshModalData();
        }
      }
    );
    
    this.state = {
      pulse: false,
      notification: null,
      important: false
    };
  }
  
  render(container) {
    super.render(container, this.state);
    return this.element;
  }
  
  update(options = {}) {
    this.state = {
      ...this.state,
      ...options
    };
    
    if (this.element) {
      // Update pulse animation
      const pulseElement = this.element.querySelector('.button-pulse');
      if (pulseElement) {
        pulseElement.style.display = this.state.pulse ? 'block' : 'none';
      }
      
      // Update notification badge
      let badgeElement = this.element.querySelector('.notification-badge');
      
      if (this.state.notification) {
        if (!badgeElement) {
          badgeElement = document.createElement('span');
          badgeElement.className = 'notification-badge';
          this.element.appendChild(badgeElement);
        }
        
        badgeElement.textContent = this.state.notification;
        badgeElement.style.display = '';
        
        if (this.state.important) {
          badgeElement.classList.add('important');
        } else {
          badgeElement.classList.remove('important');
        }
      } else if (badgeElement) {
        badgeElement.style.display = 'none';
      }
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
}

// Create singleton instance
const mainButton = new MainButton();

// Backward compatibility functions
export function injectMainButton() {
  mainButton.render(document.body);
  console.log("🔘 Injecting Archimind main button");
}

export function updateButton(options = {}) {
  mainButton.update(options);
}

export function showButton() {
  mainButton.show();
}

export function hideButton() {
  mainButton.hide();
}

export function removeButton() {
  mainButton.remove();
}