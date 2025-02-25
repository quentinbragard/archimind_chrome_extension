import { getTurnNumber } from './utils/getTurnNumber.js';
import { getUserId } from './utils/getUserId.js';
import { saveChatToBackend } from './utils/saveChatToBackend.js';
import { processChatGPTNewArticles } from './chatGPT/processChatGPTNewArticles.js';
import { getChatTitleFromSidebar } from './utils/getChatTitleFromSidebar.js';

import "./content-style.css";

let chatHistoryData = {
  savedChatName: null,
  providerChatId: null,
};
let lastProcessedTurn = 0;
const processedMessageIds = new Set();

let currentURL = window.location.href;
let observer = null;
let titleCheckInterval = null;
let userId = null;

// ============= ENTRY POINTS =============
init();

/** Main init: called once on script load */
async function init() {
  console.log("===========Init");
  userId = await getUserId();
  console.log("===========UserId:", userId);
  if (!userId) {
    console.error('Supabase user ID not set.');
    return;
  }
  console.log("Ready to inject Archimind Button");

  injectArchimindButton(); // Add Archimind UI elements
  injectStatsPanel();
  handleUrlChange();
  startMutationObserver();
  listenForUrlChanges();
}

function injectStatsPanel() {
  console.log("Injecting Stats Panel...");

  // Check if the panel already exists
  if (document.getElementById("Archimind-stats-panel")) return;

  // Create the stats panel div
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
              <span class="stat-icon">⚡</span> <span id="efficiency">-</span><span class="stat-unit">kw/h</span>
          </div>
      </div>
  `;

  // Add the panel to the body
  document.body.appendChild(statsPanel);

  // No need for event listeners since we're using hover tooltips instead of clickable stats

  console.log("✅ Stats panel injected successfully");
}

/** Injects the Archimind floating button and popup modal */
function injectArchimindButton() {
  console.log("===========Injecting Archimind Button");
  if (document.getElementById("Archimind-extension-button")) return;

  // Floating Button
  const button = document.createElement("button");
  button.id = "Archimind-extension-button";
  button.setAttribute("aria-label", "Open Archimind");
  button.innerHTML = `<span class="button-pulse"></span>`;
  document.body.appendChild(button);

  // Modal
  const modal = document.createElement("div");
  modal.id = "Archimind-modal";
  modal.classList.add("hidden");
  modal.innerHTML = `
    <div class="Archimind-modal-content">
      <div class="modal-header">
        <h2><span class="modal-icon">📊</span>Archimind Stats</h2>
        <button id="close-Archimind-modal" class="header-close-btn">×</button>
      </div>
      <div class="modal-body">
        <div class="stat-summary">
          <div class="stat-card">
            <span class="stat-number">120</span>
            <span class="stat-label">Prompts Today</span>
          </div>
        </div>
        <h3><span class="section-icon">📁</span>Files</h3>
        <ul id="Archimind-file-list" class="features-list">
          <li data-file="file1"><span class="item-icon">📄</span>Analysis Report</li>
          <li data-file="file2"><span class="item-icon">📄</span>Daily Summary</li>
        </ul>
        <div id="Archimind-prompt-list" class="hidden">
          <h3><span class="section-icon">💡</span>Prompts</h3>
          <ul>
            <li><span class="item-icon">💬</span>How to improve AI-generated text?</li>
            <li><span class="item-icon">💬</span>Best practices for prompting ChatGPT?</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Add animation delays to list items
  const listItems = modal.querySelectorAll('li');
  listItems.forEach((item, index) => {
    item.style.setProperty('--item-index', index);
  });

  // Button Click -> Show Modal with animation
  let isOpen = false;
  button.addEventListener("click", () => {
    isOpen = !isOpen;
    if (isOpen) {
      modal.classList.remove("hidden");
      // Reset animations
      const lists = modal.querySelectorAll('ul');
      lists.forEach(list => {
        const items = Array.from(list.children);
        items.forEach((item, index) => {
          const clone = item.cloneNode(true);
          clone.style.setProperty('--item-index', index);
          item.parentNode.replaceChild(clone, item);
        });
      });
    } else {
      modal.classList.add("hidden");
    }
  });

  // Close Button
  document.getElementById("close-Archimind-modal").addEventListener("click", (e) => {
    e.stopPropagation();
    isOpen = false;
    modal.classList.add("hidden");
  });

  // Handle file click event to show prompts
  document.querySelectorAll("#Archimind-file-list li").forEach((item) => {
    item.addEventListener("click", () => {
      const promptList = document.getElementById("Archimind-prompt-list");
      promptList.classList.remove("hidden");
      // Reset animations for prompt list items
      const items = promptList.querySelectorAll('li');
      items.forEach((item, index) => {
        const clone = item.cloneNode(true);
        clone.style.setProperty('--item-index', index);
        item.parentNode.replaceChild(clone, item);
      });
    });
  });

  // Close modal when clicking outside
  document.addEventListener('click', (event) => {
    if (isOpen && 
        !modal.contains(event.target) && 
        !button.contains(event.target)) {
      isOpen = false;
      modal.classList.add("hidden");
    }
  });
}

// ============ Existing Chat Saving & Processing Logic ============
function handleUrlChange() {
  const url = window.location.href;

  // If no /c/<chatId> => nothing to do (home page or brand new conversation not yet started)
  if (!/\/c\/[^/]+/.test(url)) {
    console.log('[ChatGPT Extension] No chat provider ID in URL.');
    chatHistoryData = { savedChatName: null, providerChatId: null };
    return;
  }

  // Extract the chatId
  const match = url.match(/\/c\/([^/?]+)/);
  if (!match || !match[1]) {
    chatHistoryData = fallbackNoHistory();
    return;
  }

  const chatId = match[1].trim();
  console.log('[ChatGPT Extension] Found chatId:', chatId);

  // Attempt immediate detection of a real title:
  const sidebarTitle = getChatTitleFromSidebar(chatId);

  // If sidebar is empty or "New Chat", treat as placeholder
  if (!sidebarTitle || sidebarTitle === 'New Chat') {
    const placeholder = `no_title_${Date.now()}`;
    console.log('Saving chat with placeholder title:', placeholder);

    startTitleCheckInterval(chatId);
    chatHistoryData = {
        savedChatName: placeholder,
        providerChatId: chatId,
      };
    saveChatToBackend({chatId, chatTitle:placeholder, providerName: 'chatGPT'});
  } else {
    // We found a real title
    console.log('Saving chat with title:', sidebarTitle);
    saveChatToBackend({chatId, chatTitle:sidebarTitle, providerName: 'chatGPT'});
    chatHistoryData = {
      savedChatName: sidebarTitle,
      providerChatId: chatId,
    };
  }
}

/**
 * Sets an interval to keep checking if the conversation's real title
 * has replaced "New Chat" (or is no longer missing).
 */
function startTitleCheckInterval(chatId) {
  // Clear any existing interval
  if (titleCheckInterval) {
    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }

  // Poll every 3 seconds
  titleCheckInterval = setInterval(() => {
    const possibleTitle = getChatTitleFromSidebar(chatId);

    // If still no title or it's "New Chat", wait 5 seconds and check again
    if (!possibleTitle || possibleTitle === 'New Chat') {
      return;
    }
    // Once we find a real title, update the record
    console.log('[ChatGPT Extension] Found updated title:', possibleTitle);

    saveChatToBackend({chatId, chatTitle:possibleTitle, providerName: 'chatGPT'});
    chatHistoryData.savedChatName = possibleTitle;

    clearInterval(titleCheckInterval);
    titleCheckInterval = null;
  }, 3000);
}

/** Creates a fallback "no_history" record if we can't parse the chatId. */
function fallbackNoHistory() {
  const chatId = `no_history_${Date.now()}`;
  const chatTitle = `no_title_${Date.now()}`;
  saveChatToBackend({chatId, chatTitle, providerName: 'chatGPT'});
  return { savedChatName: chatTitle, providerChatId: chatId };
}

// ============ MutationObserver for new messages ============
let isProcessing = false;

function processNewArticleIfNotRunning(article) {
  if (isProcessing) return; // Skip if processing is already underway

  isProcessing = true;
  processChatGPTNewArticles(article, chatHistoryData.providerChatId, lastProcessedTurn, chatHistoryData)
    .then((updatedTurn) => {
      lastProcessedTurn = updatedTurn;
    })
    .catch((err) => {
      console.error('[ChatGPT Extension] Error in processChatGPTNewArticles:', err);
    })
    .finally(() => {
      isProcessing = false;
    });
}

function startMutationObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver(() => {
    // Check if a valid chat provider ID is set; if not, skip processing messages.
    if (!chatHistoryData.providerChatId) {
      return;
    }

    const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');
    if (!articles || !articles.length) return;

    for (const article of articles) {
        const turnNumber = getTurnNumber(article);
        if (turnNumber == null) continue;
      
        const messageId = article.querySelector('div[data-message-id]')?.getAttribute('data-message-id');
        if (!messageId) continue;
      
        if (processedMessageIds.has(messageId)) {
          continue;
        }
        processedMessageIds.add(messageId);
      
        if (turnNumber > lastProcessedTurn) {
          processNewArticleIfNotRunning(article);
        }
      }
      
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// ============ Detect URL changes ============
function listenForUrlChanges() {
  setInterval(() => {
    if (window.location.href !== currentURL) {
      console.log('[ChatGPT Extension] URL changed:', window.location.href);
      currentURL = window.location.href;

      processedMessageIds.clear();
      lastProcessedTurn = 0;

      handleUrlChange();
    }
  }, 1000);
}