import { toggleModal, refreshModalData } from './modalManager.js';

// Track button state
let buttonElement = null;

/**
 * Injects the main floating button into the DOM
 */
export function injectMainButton() {
  console.log("🔘 Injecting Archimind main button");

  // Check if button already exists
  if (document.getElementById("Archimind-extension-button")) {
    console.log("⚠️ Button already exists, skipping injection");
    return;
  }

  // Create the button element
  const button = document.createElement("button");
  button.id = "Archimind-extension-button";
  button.setAttribute("aria-label", "Open Archimind");
  button.innerHTML = `<span class="button-pulse"></span>`;
  
  // Add click event listener
  button.addEventListener("click", handleButtonClick);
  
  // Add the button to the body
  document.body.appendChild(button);
  
  // Store reference
  buttonElement = button;
  
  console.log("✅ Main button injected successfully");
}

/**
 * Handles the main button click
 * @param {Event} event - The click event
 */
function handleButtonClick(event) {
  // Prevent event propagation
  event.stopPropagation();
  
  // Toggle the modal visibility
  toggleModal();
  
  // Refresh modal data when opening
  refreshModalData();
}

/**
 * Updates the button appearance
 * @param {Object} options - Button options
 * @param {boolean} options.pulse - Whether to show the pulse animation
 * @param {string} options.notification - Text to show in a notification badge
 * @param {boolean} options.important - Whether this is an important notification
 */
export function updateButton(options = {}) {
  if (!buttonElement) return;
  
  // Handle pulse animation
  const pulseElement = buttonElement.querySelector('.button-pulse');
  if (pulseElement) {
    if (options.pulse) {
      pulseElement.style.display = '';
    } else {
      pulseElement.style.display = 'none';
    }
  }
  
  // Handle notification badge
  let badgeElement = buttonElement.querySelector('.notification-badge');
  
  if (options.notification) {
    // Create badge if it doesn't exist
    if (!badgeElement) {
      badgeElement = document.createElement('span');
      badgeElement.className = 'notification-badge';
      buttonElement.appendChild(badgeElement);
    }
    
    // Update badge text
    badgeElement.textContent = options.notification;
    badgeElement.style.display = '';
    
    // Add important class if needed
    if (options.important) {
      badgeElement.classList.add('important');
    } else {
      badgeElement.classList.remove('important');
    }
  } else if (badgeElement) {
    // Hide badge if no notification
    badgeElement.style.display = 'none';
  }
}

/**
 * Shows the main button
 */
export function showButton() {
  if (buttonElement) {
    buttonElement.style.display = '';
  }
}

/**
 * Hides the main button
 */
export function hideButton() {
  if (buttonElement) {
    buttonElement.style.display = 'none';
  }
}

/**
 * Removes the button from the DOM
 */
export function removeButton() {
  if (buttonElement) {
    buttonElement.removeEventListener('click', handleButtonClick);
    buttonElement.remove();
    buttonElement = null;
  }
}