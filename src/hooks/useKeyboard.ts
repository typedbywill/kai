export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
}

/**
 * Registers keyboard shortcuts on an element or the document.
 * Returns a destroy function to clean up.
 */
export function useKeyboard(
  target: HTMLElement | Document,
  bindings: KeyBinding[],
): { destroy: () => void } {
  const handler = (e: Event): void => {
    const ke = e as KeyboardEvent;
    for (const binding of bindings) {
      if (
        ke.key === binding.key &&
        !!ke.ctrlKey === !!binding.ctrl &&
        !!ke.shiftKey === !!binding.shift &&
        !!ke.altKey === !!binding.alt &&
        !!ke.metaKey === !!binding.meta
      ) {
        e.preventDefault();
        binding.handler(ke);
        return;
      }
    }
  };

  target.addEventListener("keydown", handler);

  return {
    destroy: () => target.removeEventListener("keydown", handler),
  };
}
