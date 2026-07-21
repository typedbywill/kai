export interface DragDropOptions {
  onDrop: (files: File[]) => void;
  onDragOver?: () => void;
  onDragLeave?: () => void;
}

/**
 * Adds drag & drop file handling to an element.
 * Returns a destroy function to clean up event listeners.
 */
export function useDragDrop(
  element: HTMLElement,
  options: DragDropOptions,
): { destroy: () => void } {
  const handleDragOver = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    element.classList.add("drag-over");
    options.onDragOver?.();
  };

  const handleDragLeave = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove("drag-over");
    options.onDragLeave?.();
  };

  const handleDrop = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove("drag-over");

    if (e.dataTransfer?.files) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        options.onDrop(files);
      }
    }
  };

  element.addEventListener("dragover", handleDragOver);
  element.addEventListener("dragleave", handleDragLeave);
  element.addEventListener("drop", handleDrop);

  return {
    destroy: () => {
      element.removeEventListener("dragover", handleDragOver);
      element.removeEventListener("dragleave", handleDragLeave);
      element.removeEventListener("drop", handleDrop);
    },
  };
}
