"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { readLocalStorage, writeLocalStorage } from "@/lib/storage/safe-local-storage";

export type Locale = "en" | "zh";

export const LOCALE_STORAGE_KEY = "developer-os-locale";

const listeners = new Set<() => void>();

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh";
}

export function readLocalePreference(): Locale {
  const raw = readLocalStorage(LOCALE_STORAGE_KEY);
  return isLocale(raw) ? raw : "en";
}

function emitLocaleChange() {
  listeners.forEach((listener) => listener());
}

function subscribeLocale(listener: () => void) {
  listeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === LOCALE_STORAGE_KEY) {
      listener();
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getLocaleSnapshot() {
  return readLocalePreference();
}

function getServerLocaleSnapshot(): Locale {
  return "en";
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getServerLocaleSnapshot);

  const setLocale = useCallback((nextLocale: Locale) => {
    writeLocalStorage(LOCALE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale === "zh" ? "zh-CN" : "en";
    emitLocaleChange();
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(readLocalePreference() === "en" ? "zh" : "en");
  }, [setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, toggleLocale }), [locale, setLocale, toggleLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return context;
}

export function pickLocale<T>(value: Record<Locale, T>, locale: Locale): T {
  return value[locale] ?? value.en;
}