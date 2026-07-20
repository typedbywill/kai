import { Marked } from 'marked';
import hljs from 'highlight.js';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { loadSettings, saveSettings } from './settings.js';
import { streamChatCompletion } from './api.js';

// Configure Marked with Highlight.js
const marked = new Marked({
  highlight: (code, lang) => {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
});

// Custom Renderer for code blocks to add copy button
const renderer = {
  code({ text, lang }) {
    const language = lang || 'plaintext';
    const highlighted = hljs.getLanguage(language)
      ? hljs.highlight(text, { language }).value
      : text;

    return `
      <div class="code-wrapper">
        <div class="code-header">
          <span>${language}</span>
          <button class="copy-code-btn" data-code="${encodeURIComponent(text)}">Copy</button>
        </div>
        <pre><code class="hljs language-${language}">${highlighted}</code></pre>
      </div>
    `;
  }
};
marked.use({ renderer });

// State Variables
let currentSettings = loadSettings();
let conversationHistory = []; // [{role: 'user'|'assistant', content: ''}]
let activeAbortController = null;

// DOM Elements
const chatContainer = document.getElementById('chat-messages');
const welcomeCard = document.getElementById('welcome-card');
const promptInput = document.getElementById('prompt-input');
const btnSend = document.getElementById('btn-send');
const btnClear = document.getElementById('btn-clear');
const btnSettings = document.getElementById('btn-settings');
const btnClose = document.getElementById('btn-close');
const modelIndicator = document.getElementById('model-indicator');

// Settings Drawer Elements
const settingsDrawer = document.getElementById('settings-drawer');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');
const cfgBaseUrl = document.getElementById('cfg-base-url');
const cfgApiKey = document.getElementById('cfg-api-key');
const cfgModel = document.getElementById('cfg-model');
const cfgSystem = document.getElementById('cfg-system');
const cfgAutoHide = document.getElementById('cfg-auto-hide');

// Initialize UI
function init() {
  updateSettingsUI();
  setupEventListeners();

  // Listen for Tauri blur event to hide window if autoHide is enabled
  try {
    listen('window-blur', () => {
      if (currentSettings.autoHide) {
        invoke('hide_window').catch(() => {});
      }
    });
  } catch (e) {
    // Web environment fallback
  }
}

function updateSettingsUI() {
  modelIndicator.textContent = `${currentSettings.model || 'llama3.2'}`;
  cfgBaseUrl.value = currentSettings.baseUrl;
  cfgApiKey.value = currentSettings.apiKey;
  cfgModel.value = currentSettings.model;
  cfgSystem.value = currentSettings.systemPrompt;
  cfgAutoHide.checked = currentSettings.autoHide;
}

function setupEventListeners() {
  // Input Auto-Resize
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
  });

  // Keyboard Navigation
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hideOverlay();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!settingsDrawer.classList.contains('hidden')) {
        settingsDrawer.classList.add('hidden');
      } else {
        hideOverlay();
      }
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      clearChat();
    }
  });

  // Buttons
  btnSend.addEventListener('click', sendMessage);
  btnClear.addEventListener('click', clearChat);
  btnClose.addEventListener('click', hideOverlay);

  // Settings Drawer
  btnSettings.addEventListener('click', () => {
    updateSettingsUI();
    settingsDrawer.classList.remove('hidden');
  });

  btnCloseSettings.addEventListener('click', () => {
    settingsDrawer.classList.add('hidden');
  });

  btnSaveSettings.addEventListener('click', () => {
    currentSettings = {
      baseUrl: cfgBaseUrl.value.trim(),
      apiKey: cfgApiKey.value.trim(),
      model: cfgModel.value.trim(),
      systemPrompt: cfgSystem.value.trim(),
      autoHide: cfgAutoHide.checked,
    };
    saveSettings(currentSettings);
    updateSettingsUI();
    settingsDrawer.classList.add('hidden');
  });

  // Delegated Copy Code Event Listener
  chatContainer.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('copy-code-btn')) {
      const code = decodeURIComponent(e.target.getAttribute('data-code'));
      navigator.clipboard.writeText(code).then(() => {
        const originalText = e.target.textContent;
        e.target.textContent = 'Copied!';
        e.target.style.color = '#10b981';
        setTimeout(() => {
          e.target.textContent = originalText;
          e.target.style.color = '';
        }, 1500);
      });
    }
  });
}

function hideOverlay() {
  try {
    invoke('hide_window');
  } catch (e) {
    console.log('Hide window invoked');
  }
}

function clearChat() {
  conversationHistory = [];
  chatContainer.innerHTML = '';
  chatContainer.appendChild(welcomeCard);
  welcomeCard.style.display = 'block';
}

function appendMessageRow(role, content = '') {
  if (welcomeCard.parentNode === chatContainer) {
    welcomeCard.style.display = 'none';
  }

  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const senderLabel = document.createElement('div');
  senderLabel.className = 'message-sender';
  senderLabel.textContent = role === 'user' ? 'You' : 'KAI';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (role === 'user') {
    bubble.textContent = content;
  } else {
    bubble.innerHTML = content ? marked.parse(content) : '<span class="loading-dots">Thinking...</span>';
  }

  row.appendChild(senderLabel);
  row.appendChild(bubble);
  chatContainer.appendChild(row);

  scrollToBottom();
  return bubble;
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage() {
  const userText = promptInput.value.trim();
  if (!userText) return;

  // Reset Input
  promptInput.value = '';
  promptInput.style.height = 'auto';

  // Add User Message to History & UI
  conversationHistory.push({ role: 'user', content: userText });
  appendMessageRow('user', userText);

  // Prepare Assistant Message Placeholder
  const assistantBubble = appendMessageRow('assistant', '');
  let assistantResponseText = '';

  // Build Payload including System Prompt
  const messagesPayload = [];
  if (currentSettings.systemPrompt) {
    messagesPayload.push({ role: 'system', content: currentSettings.systemPrompt });
  }
  messagesPayload.push(...conversationHistory);

  // Stream Completion
  if (activeAbortController) {
    activeAbortController.abort();
  }

  activeAbortController = streamChatCompletion(
    messagesPayload,
    currentSettings,
    (chunk) => {
      assistantResponseText += chunk;
      assistantBubble.innerHTML = marked.parse(assistantResponseText);
      scrollToBottom();
    },
    (error) => {
      assistantBubble.innerHTML = `<span style="color:#f87171;">⚠️ Error: ${error.message}</span>`;
      scrollToBottom();
    }
  );

  activeAbortController.signal.addEventListener('abort', () => {
    if (assistantResponseText) {
      conversationHistory.push({ role: 'assistant', content: assistantResponseText });
    }
  });
}

// Start App
init();
