"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useStore } from "zustand";
import { createPosStore, type PosState, type PosStore } from "./pos";

const PosStoreContext = createContext<PosStore | null>(null);

/**
 * Mount once at the root of the POS page (or any subtree that needs POS state).
 * Creates a fresh store per component tree — safe for concurrent Next.js SSR.
 */
export function PosStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<PosStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createPosStore();
  }
  return (
    <PosStoreContext.Provider value={storeRef.current}>
      {children}
    </PosStoreContext.Provider>
  );
}

/** Subscribe to a slice of POS state. Accepts an optional selector. */
export function usePosStore(): PosState;
export function usePosStore<T>(selector: (state: PosState) => T): T;
export function usePosStore<T>(
  selector?: (state: PosState) => T,
): T | PosState {
  const store = useContext(PosStoreContext);
  if (!store)
    throw new Error("usePosStore must be used within <PosStoreProvider>");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useStore(store, selector ?? ((s) => s as unknown as T));
}

/**
 * Returns the raw store instance.
 * Use inside effects/callbacks where you need .getState() without triggering
 * a re-render subscription.
 */
export function usePosStoreApi(): PosStore {
  const store = useContext(PosStoreContext);
  if (!store)
    throw new Error("usePosStoreApi must be used within <PosStoreProvider>");
  return store;
}
