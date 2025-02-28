// src/services/ServiceLocator.js
import { apiService } from './ApiService.js';

// Simple service locator pattern
export const services = {
  api: apiService,
  // Add more services as needed
};

// Helper function to get a service
export function getService(name) {
  if (!services[name]) {
    throw new Error(`Service '${name}' not registered`);
  }
  return services[name];
}