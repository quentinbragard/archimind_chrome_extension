/**
 * Animates a counter update for a smoother user experience
 * @param {HTMLElement} element - Element containing the counter
 * @param {number} startVal - Starting value
 * @param {number} endVal - Ending value
 */
export function animateCounterUpdate(element, startVal, endVal) {
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
   * Adds ripple effect to an element on click
   * @param {HTMLElement} element - Element to add ripple to
   */
  export function addRippleEffect(element) {
    element.addEventListener('click', createRipple);
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
  }
  
  /**
   * Creates a ripple effect on an element
   * @param {Event} event - Click event
   */
  function createRipple(event) {
    const element = event.currentTarget;
    
    // Remove any existing ripples
    const ripples = element.getElementsByClassName('ripple');
    for (let i = 0; i < ripples.length; i++) {
      ripples[i].remove();
    }
    
    // Create ripple element
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    // Position and size the ripple
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    
    // Add ripple styles if they don't exist
    if (!document.getElementById('ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'ripple-styles';
      style.textContent = `
        .ripple {
          position: absolute;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: ripple-animation 0.6s linear;
          pointer-events: none;
        }
        
        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add the ripple to the element
    element.appendChild(ripple);
    
    // Remove the ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
  
  /**
   * Creates a tooltip for an element
   * @param {HTMLElement} element - Element to add tooltip to
   * @param {string} text - Tooltip text
   * @param {Object} options - Tooltip options
   * @param {string} options.position - Tooltip position (top, bottom, left, right)
   */
  export function createTooltip(element, text, options = {}) {
    const position = options.position || 'top';
    
    // Add tooltip data attribute
    element.setAttribute('data-tooltip', text);
    element.setAttribute('data-tooltip-position', position);
    
    // Add tooltip styles if they don't exist
    if (!document.getElementById('tooltip-styles')) {
      const style = document.createElement('style');
      style.id = 'tooltip-styles';
      style.textContent = `
        [data-tooltip] {
          position: relative;
        }
        
        [data-tooltip]:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 10003;
          pointer-events: none;
          opacity: 0;
          animation: tooltip-fade-in 0.2s ease forwards;
        }
        
        [data-tooltip-position="top"]:hover::after {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-5px);
        }
        
        [data-tooltip-position="bottom"]:hover::after {
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(5px);
        }
        
        [data-tooltip-position="left"]:hover::after {
          right: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(-5px);
        }
        
        [data-tooltip-position="right"]:hover::after {
          left: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(5px);
        }
        
        @keyframes tooltip-fade-in {
          to {
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Adds drag-and-drop functionality to an element
   * @param {HTMLElement} element - Element to make draggable
   * @param {Object} options - Draggable options
   * @param {HTMLElement} options.handle - Element to use as drag handle (defaults to entire element)
   * @param {Function} options.onDragStart - Callback when drag starts
   * @param {Function} options.onDragEnd - Callback when drag ends
   */
  export function makeDraggable(element, options = {}) {
    const handle = options.handle || element;
    
    let isDragging = false;
    let initialX, initialY;
    let elementX = 0, elementY = 0;
    
    // Make the element positioned if it isn't already
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
      element.style.position = 'absolute';
    }
    
    // Apply initial position
    element.style.top = element.style.top || '0px';
    element.style.left = element.style.left || '0px';
    
    // Add draggable cursor to handle
    handle.style.cursor = 'move';
    
    // Add event listeners
    handle.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
      // Only handle left mouse button
      if (e.button !== 0) return;
      
      e.preventDefault();
      
      // Get initial positions
      initialX = e.clientX;
      initialY = e.clientY;
      
      // Get current element position
      const rect = element.getBoundingClientRect();
      elementX = rect.left;
      elementY = rect.top;
      
      // Start tracking drag
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
      
      isDragging = true;
      
      // Call onDragStart callback if provided
      if (options.onDragStart) {
        options.onDragStart(element);
      }
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      // Calculate new position
      const dx = e.clientX - initialX;
      const dy = e.clientY - initialY;
      
      // Update element position
      element.style.left = `${elementX + dx}px`;
      element.style.top = `${elementY + dy}px`;
    }
    
    function stopDrag() {
      isDragging = false;
      
      // Remove event listeners
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
      
      // Call onDragEnd callback if provided
      if (options.onDragEnd) {
        options.onDragEnd(element);
      }
    }
    
    // Return a cleanup function
    return () => {
      handle.removeEventListener('mousedown', startDrag);
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    };
  }
  
  /**
   * Creates and adds a CSS style element
   * @param {string} id - Style element ID
   * @param {string} css - CSS content
   * @returns {HTMLStyleElement} The created style element
   */
  export function addStylesheet(id, css) {
    // Check if style already exists
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.textContent = css;
      return existingStyle;
    }
    
    // Create and add new style
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    
    return style;
  }
  
  /**
   * Format a timestamp into a readable string
   * @param {string|Date} timestamp - Timestamp to format
   * @param {Object} options - Formatting options
   * @param {boolean} options.relative - Use relative time (e.g., "5 min ago")
   * @returns {string} Formatted time string
   */
  export function formatTime(timestamp, options = {}) {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    if (options.relative) {
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
    }
    
    // Default to formatted date
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }