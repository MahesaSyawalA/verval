"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, resolveTheme, type Theme } from "@/lib/theme";

const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  listeners.forEach((listener) => listener());
}

function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Penyimpanan diblokir (mis. mode privat): tema tetap berlaku untuk sesi ini.
  }
  applyTheme(theme);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    readTheme,
    () => "light" as Theme,
  );

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}

/**
 * Dipasang di layout dashboard: menerapkan tema pilihan pengguna selama berada di
 * dashboard dan melepasnya saat keluar, sehingga login dan Menu Utama SSO tetap terang.
 */
export function ThemeScope() {
  useEffect(() => {
    applyTheme(
      resolveTheme(
        readStoredTheme(),
        window.matchMedia("(prefers-color-scheme: dark)").matches,
      ),
    );
    return () => applyTheme("light");
  }, []);

  return null;
}

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className={className}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      {showLabel && <span>{isDark ? "Mode Terang" : "Mode Gelap"}</span>}
    </button>
  );
}
