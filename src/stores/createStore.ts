export type Listener<T> = (state: T) => void;

export interface Store<T> {
  get(): T;
  set(partial: Partial<T>): void;
  subscribe(listener: Listener<T>): () => void;
  reset(initial: T): void;
}

/**
 * Minimal reactive store — pub/sub pattern with no external dependencies.
 * Each store is a singleton object holding state and notifying listeners on change.
 */
export function createStore<T extends object>(
  initialState: T,
): Store<T> {
  let state: T = { ...initialState };
  const listeners = new Set<Listener<T>>();

  function notify(): void {
    const snapshot = { ...state };
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  return {
    get() {
      return { ...state };
    },

    set(partial: Partial<T>) {
      state = { ...state, ...partial };
      notify();
    },

    subscribe(listener: Listener<T>): () => void {
      listeners.add(listener);
      // Immediately call with current state
      listener({ ...state });
      // Return unsubscribe function
      return () => {
        listeners.delete(listener);
      };
    },

    reset(initial: T) {
      state = { ...initial };
      notify();
    },
  };
}
