export function initTheme() {
  const saved = localStorage.getItem("kai_theme");
  if (saved === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  if (isDark) {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("kai_theme", "light");
  } else {
    document.documentElement.classList.add("dark");
    localStorage.setItem("kai_theme", "dark");
  }
  return !isDark;
}

export function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}
