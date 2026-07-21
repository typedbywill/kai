import { initTheme } from "./utils/theme";
import { createApp } from "./components/App";
import { initCopyCodeHandler } from "./services/markdown";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriEnv } from "./utils/env";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme before rendering
  initTheme();

  // Initialize global copy-code handler
  initCopyCodeHandler();

  // Mount the app
  const appContainer = document.getElementById("app");
  if (appContainer) {
    appContainer.appendChild(createApp());
  }

  // Auto-hide on focus loss (Tauri only)
  window.addEventListener("blur", () => {
    if (isTauriEnv()) {
      void (async () => {
        try {
          const win = getCurrentWindow();
          await win.hide();
        } catch (err) {
          console.warn("Could not hide window on blur:", err);
        }
      })();
    }
  });
});
