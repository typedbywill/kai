/**
 * Auto-resize a textarea to fit its content, with min and max height.
 */
export function useAutoResize(
  textarea: HTMLTextAreaElement,
  minHeight = 36,
  maxHeight = 112,
): { resize: () => void; destroy: () => void } {
  const resize = (): void => {
    textarea.style.height = `${minHeight}px`;
    textarea.style.height =
      Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight)) + "px";
  };

  textarea.addEventListener("input", resize);

  return {
    resize,
    destroy: () => textarea.removeEventListener("input", resize),
  };
}
