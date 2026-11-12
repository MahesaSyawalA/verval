import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY, resolveTheme } from "@/lib/theme";

describe("resolveTheme", () => {
  it("pilihan tersimpan menang atas pengaturan sistem", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("tanpa pilihan, mengikuti sistem; nilai asing diabaikan", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("light");
    expect(resolveTheme("sistem-aneh", true)).toBe("dark");
    expect(resolveTheme("", false)).toBe("light");
  });
});

describe("THEME_INIT_SCRIPT", () => {
  const stubSystem = (prefersDark: boolean) =>
    vi.stubGlobal("matchMedia", () => ({ matches: prefersDark }));
  const run = () => new Function(THEME_INIT_SCRIPT)();

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("memasang gelap bila tersimpan gelap", () => {
    stubSystem(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    run();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("memasang gelap bila tidak ada pilihan dan sistem gelap", () => {
    stubSystem(true);
    run();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("pilihan terang menang atas sistem gelap", () => {
    stubSystem(true);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    run();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("tidak melempar error bila matchMedia gagal", () => {
    vi.stubGlobal("matchMedia", () => {
      throw new Error("tidak tersedia");
    });
    expect(run).not.toThrow();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
});
