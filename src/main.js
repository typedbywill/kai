import { initTheme } from "./utils/theme.js";
import { createChatPanel } from "./components/ChatPanel.js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriEnv } from "./services/settings.js";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const app = document.getElementById("app");
  if (app) {
    app.appendChild(createChatPanel());
  }

  window.addEventListener("blur", async () => {
    if (isTauriEnv()) {
      try {
        const win = getCurrentWindow();
        await win.hide();
      } catch (err) {
        console.warn("Could not hide window on blur:", err);
      }
    }
  });
});
