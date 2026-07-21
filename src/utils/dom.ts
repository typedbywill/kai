/**
 * Type-safe DOM element creation helper.
 * Reduces boilerplate for creating elements with classes and attributes.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Partial<Record<string, string>> & { className?: string },
  children?: Array<HTMLElement | string>,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attrs) {
    const { className, ...rest } = attrs;
    if (className) {
      element.className = className;
    }
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        element.setAttribute(key, value);
      }
    }
  }

  if (children) {
    for (const child of children) {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    }
  }

  return element;
}

/**
 * Sets innerHTML safely and returns the element for chaining.
 */
export function html<T extends HTMLElement>(
  element: T,
  content: string,
): T {
  element.innerHTML = content;
  return element;
}

/**
 * Query a required element — throws if not found (avoids null checks in component code).
 */
export function qs<T extends HTMLElement>(
  parent: HTMLElement | Document,
  selector: string,
): T {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}

/**
 * Query an optional element — returns null if not found.
 */
export function qsMaybe<T extends HTMLElement>(
  parent: HTMLElement | Document,
  selector: string,
): T | null {
  return parent.querySelector<T>(selector);
}
