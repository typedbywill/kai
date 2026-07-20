import { initTheme } from "./utils/theme.js";
import { createChatPanel } from "./components/ChatPanel.js";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  const app = document.getElementById("app");
  if (app) {
    app.appendChild(createChatPanel());
  }
});
