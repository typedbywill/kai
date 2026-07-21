import { describe, it, expect } from "vitest";
import { createStore } from "../../stores/createStore";

describe("createStore", () => {
  it("should initialize with the given state", () => {
    const store = createStore({ count: 0, name: "test" });
    expect(store.get()).toEqual({ count: 0, name: "test" });
  });

  it("should update state with set()", () => {
    const store = createStore({ count: 0, name: "test" });
    store.set({ count: 5 });
    expect(store.get().count).toBe(5);
    expect(store.get().name).toBe("test");
  });

  it("should notify subscribers on set()", () => {
    const store = createStore({ value: "" });
    const values: string[] = [];

    store.subscribe((state) => {
      values.push(state.value);
    });

    // First call is the initial state notification
    expect(values).toEqual([""]);

    store.set({ value: "hello" });
    expect(values).toEqual(["", "hello"]);
  });

  it("should return an unsubscribe function", () => {
    const store = createStore({ x: 0 });
    let callCount = 0;

    const unsub = store.subscribe(() => {
      callCount++;
    });

    // Initial notification
    expect(callCount).toBe(1);

    store.set({ x: 1 });
    expect(callCount).toBe(2);

    unsub();
    store.set({ x: 2 });
    expect(callCount).toBe(2); // No more notifications
  });

  it("should reset state", () => {
    const store = createStore({ a: 1, b: 2 });
    store.set({ a: 99 });
    expect(store.get().a).toBe(99);

    store.reset({ a: 1, b: 2 });
    expect(store.get()).toEqual({ a: 1, b: 2 });
  });

  it("should return a snapshot, not a reference", () => {
    const store = createStore({ items: "test" });
    const state1 = store.get();
    store.set({ items: "modified" });
    const state2 = store.get();

    // state1 should not be affected by the set
    expect(state1.items).toBe("test");
    expect(state2.items).toBe("modified");
  });
});
