// Create a shared Component class in src/core/Component.js
export class Component {
    constructor(elementId, template, events = {}) {
      this.element = null;
      this.elementId = elementId;
      this.template = template;
      this.events = events;
    }
  
    render(container, data = {}) {
      // Create element if it doesn't exist
      if (!this.element) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.template(data);
        this.element = tempDiv.firstElementChild;
        this.element.id = this.elementId;
        
        // Add event listeners
        Object.entries(this.events).forEach(([eventSelector, handlers]) => {
          const [eventName, selector] = eventSelector.split(':');
          this.element.addEventListener(eventName, (e) => {
            const target = selector ? e.target.closest(selector) : e.target;
            if (!selector || target) {
              handlers(e, target, this);
            }
          });
        });
        
        container.appendChild(this.element);
      } else {
        // Update existing element
        const newContent = this.template(data);
        this.element.innerHTML = newContent;
      }
      
      return this.element;
    }
    
    update(data = {}) {
      if (this.element) {
        this.element.innerHTML = this.template(data);
      }
    }
    
    remove() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  }