// tools/generateManifest.js
const fs = require('fs');
const path = require('path');

// Base manifest configuration
const baseManifest = {
  manifest_version: 3,
  name: "Archimind Chrome Extension",
  version: "1.0.1", // Increment as needed
  description: "Intercepts ChatGPT messages and saves them to Supabase.",
  permissions: [
    "storage",
    "scripting",
    "identity"
  ],
  oauth2: {
    client_id: "32108269805-41r18uv12i7ckqqo9ice7dr7jbe50qgp.apps.googleusercontent.com",
    scopes: ["openid", "email", "profile"]
  },
  background: {
    service_worker: "background.js"
  },
  content_scripts: [
    {
      matches: ["https://chatgpt.com/*"],
      js: ["dist/bundle.js"],
      css: ["src/content-style.css"],
      run_at: "document_end"
    }
  ],
  action: {
    default_popup: "src/popup.html",
    default_icon: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  web_accessible_resources: [
    {
      resources: [
        "welcome.html",
        "utils",
        "chatGPT",
        "styles/shared.css"
      ],
      matches: ["<all_urls>"]
    }
  ]
};

// Environment-specific configurations
const environments = {
  development: {
    name: "Archimind Chrome Extension (Dev)",
    description: "Development version of the Archimind extension"
  },
  staging: {
    name: "Archimind Chrome Extension (Staging)",
    description: "Staging version of the Archimind extension"
  },
  production: {
    // Production uses the base configuration
  }
};

/**
 * Generate manifest file for a specific environment
 * @param {string} env - Environment name (development, staging, production)
 */
function generateManifest(env = 'production') {
  // Get environment config or use empty object if not found
  const envConfig = environments[env] || {};
  
  // Merge base manifest with environment-specific config
  const manifest = {
    ...baseManifest,
    ...envConfig
  };
  
  // Add build timestamp for debugging
  manifest._buildTime = new Date().toISOString();
  
  // Write manifest file
  fs.writeFileSync(
    path.join(__dirname, '..', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`✅ Generated manifest.json for ${env} environment`);
}

// Get environment from command line arguments
const env = process.argv[2] || 'production';

// Generate manifest
generateManifest(env);