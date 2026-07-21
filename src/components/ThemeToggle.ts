import { toggleTheme, isDarkMode } from "../utils/theme";

export function createThemeToggle(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className =
    "p-1.5 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-500/10 transition-colors focus:outline-none";
  btn.title = "Toggle Light / Dark Mode";
  btn.id = "theme-toggle-btn";

  const renderIcon = (): void => {
    const dark = isDarkMode();
    btn.innerHTML = dark
      ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`
      : `<svg class="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
  };

  btn.addEventListener("click", () => {
    toggleTheme();
    renderIcon();
  });

  renderIcon();
  return btn;
}
