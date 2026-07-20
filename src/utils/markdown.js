import { marked } from "marked";
import hljs from "highlight.js";

// Custom renderer for code blocks with copy header
const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }) {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  const highlighted = hljs.highlight(text, { language }).value;

  const codeId = "code-" + Math.random().toString(36).substring(2, 9);

  return `
    <div class="my-3 rounded-xl overflow-hidden border border-neutral-700/40 bg-neutral-900/90 text-neutral-100 text-xs shadow-md">
      <div class="flex items-center justify-between px-3.5 py-1.5 bg-neutral-800/80 border-b border-neutral-700/30 text-neutral-400 select-none">
        <span class="font-mono text-[11px] uppercase tracking-wider font-semibold">${language}</span>
        <button data-copy-code="${codeId}" class="copy-code-btn flex items-center gap-1 hover:text-white px-2 py-0.5 rounded transition-colors text-[11px] font-medium bg-neutral-700/40 hover:bg-neutral-700/80">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          Copy
        </button>
      </div>
      <pre class="p-3.5 overflow-x-auto m-0"><code id="${codeId}" class="hljs language-${language}">${highlighted}</code></pre>
    </div>
  `;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
});

export function renderMarkdown(content) {
  if (!content) return "";
  return marked.parse(content);
}

// Global click handler for copy code buttons
document.addEventListener("click", (e) => {
  const copyBtn = e.target.closest("[data-copy-code]");
  if (!copyBtn) return;

  const codeId = copyBtn.getAttribute("data-copy-code");
  const codeEl = document.getElementById(codeId);
  if (!codeEl) return;

  navigator.clipboard.writeText(codeEl.textContent || "").then(() => {
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      <span class="text-emerald-400">Copied!</span>
    `;
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
    }, 2000);
  });
});
