# KAI: Desktop AI Helper Overlay

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**KAI** is a lightning-fast, hotkey-driven desktop AI helper overlay designed for KDE Plasma and Linux desktops. Built with **Tauri v2** and modern **HTML/CSS/JS**, it delivers an instantaneous, ultra-customizable AI assistant experience with a sleek dark glassmorphism design.

Toggle it instantly from anywhere using **`Meta + X`** (or `Super + X`).

---

## ⚡ Key Features

- **Instant Desktop Overlay:** Press `Meta + X` to toggle showing/hiding the assistant overlay anywhere on your desktop.
- **Glassmorphic Modern UI:** Translucent dark design system (`backdrop-filter: blur`), glowing focus states, custom scrollbars, and smooth micro-animations.
- **HTML / CSS / JS Tech Stack:** 100% customizable frontend built with Vite, standard CSS variables, and modern web APIs.
- **Real-Time OpenAI & Ollama Streaming:** Word-by-word streaming responses from local Ollama instances (`http://localhost:11434/v1`), OpenAI, OpenRouter, or LM Studio.
- **Markdown & Code Highlighting:** Instant Markdown parsing via `marked` and syntax highlighting via `highlight.js` with 1-click code copy buttons.
- **Ultra Lightweight:** Consumes only ~30-40MB RAM and launches in milliseconds.
- **Auto-Hide on Loss of Focus:** Automatically hides when you switch to another window or press `Escape`.

---

## 🚀 Quick Start (Development)

Ensure you have [Node.js](https://nodejs.org/) (>= 18) and [Rust](https://www.rust-lang.org/) installed:

```bash
# 1. Install NPM dependencies
npm install

# 2. Run in Development Mode
npm run tauri dev
```

---

## 📦 Building for Production

To create a standalone production binary:

```bash
npm run tauri build
```

The compiled binary will be placed at:
`src-tauri/target/release/kai`

---

## ⌨️ Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`Meta + X`** | Toggle Overlay Window (Global) |
| **`Esc`** | Hide Overlay Window |
| **`Enter`** | Send Prompt |
| **`Shift + Enter`** | Add newline to prompt |
| **`Ctrl + L`** | Clear Chat History |

---

## ⚙️ Configuration

Click the **Settings** icon (gear icon in the header) to configure:
- **Base URL:** Endpoint for your AI server (default: `http://localhost:11434/v1` for Ollama).
- **API Key:** Optional key for OpenAI / OpenRouter.
- **Model Name:** Model to query (e.g. `llama3.2`, `gpt-4o-mini`, `deepseek-r1`).
- **System Prompt:** Custom instructions for KAI.
- **Hide on Loss of Focus:** Auto-hide toggle.

---

## 📜 License

MIT License. Free for personal and commercial use.
