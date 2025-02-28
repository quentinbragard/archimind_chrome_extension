// src/utils/lazyLoader.js
export const lazyLoader = {
    // Map of loaded modules
    loadedModules: {},
    
    // Dynamically load a module when needed
    async load(moduleName) {
      if (this.loadedModules[moduleName]) {
        return this.loadedModules[moduleName];
      }
      
      let module;
      
      switch (moduleName) {
        case 'templates':
          module = await import('../features/templateManager.js');
          break;
        case 'notifications':
          module = await import('../features/notificationsManager.js');
          break;
        case 'stats':
          module = await import('../utils/statsManager.js');
          break;
        // Add more modules as needed
        default:
          throw new Error(`Unknown module: ${moduleName}`);
      }
      
      this.loadedModules[moduleName] = module;
      return module;
    }
  };