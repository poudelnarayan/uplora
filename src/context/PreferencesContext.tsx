"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * UI preferences that persist across sessions (localStorage).
 *
 * `compact` toggles a denser layout — smaller paddings, tighter grids,
 * more posts per row. Pages that care subscribe to the value via
 * `usePreferences()` and adjust class names accordingly. We also set
 * `data-compact` on <html> so global CSS rules can target the state
 * without prop-drilling.
 */
type PreferencesContextValue = {
  compact: boolean;
  setCompact: (v: boolean) => void;
  toggleCompact: () => void;
  mounted: boolean;
};

const STORAGE_KEY = "uplora-compact-view";
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [compact, setCompactState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on first render.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const initial = raw === "true";
      setCompactState(initial);
      document.documentElement.toggleAttribute("data-compact", initial);
    } catch {
      // ignore (private mode / quota)
    } finally {
      setMounted(true);
    }
  }, []);

  // Persist + reflect on <html data-compact> so CSS / Tailwind can target it.
  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, compact ? "true" : "false");
    } catch {
      // ignore
    }
    document.documentElement.toggleAttribute("data-compact", compact);
  }, [compact, mounted]);

  const setCompact = (v: boolean) => setCompactState(v);
  const toggleCompact = () => setCompactState((p) => !p);

  return (
    <PreferencesContext.Provider value={{ compact, setCompact, toggleCompact, mounted }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
}
