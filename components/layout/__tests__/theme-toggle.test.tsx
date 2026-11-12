import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ThemeScope, ThemeToggle } from "../theme-toggle";

const html = document.documentElement;
const stubSystem = (prefersDark: boolean) =>
  vi.stubGlobal("matchMedia", () => ({ matches: prefersDark }));

beforeEach(() => {
  localStorage.clear();
  html.removeAttribute("data-theme");
  stubSystem(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
  html.removeAttribute("data-theme");
});

describe("ThemeToggle", () => {
  it("beralih terang ke gelap dan kembali, dan menyimpan pilihan", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: "Ganti ke mode gelap" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);
    expect(html.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Ganti ke mode terang" }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Ganti ke mode terang" }));
    expect(html.hasAttribute("data-theme")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("menampilkan label teks hanya bila diminta", () => {
    const { rerender } = render(<ThemeToggle />);
    expect(screen.queryByText("Mode Gelap")).toBeNull();

    rerender(<ThemeToggle showLabel />);
    expect(screen.getByText("Mode Gelap")).toBeInTheDocument();
  });

  it("tetap berfungsi bila localStorage menolak menyimpan", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("diblokir");
    });
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Ganti ke mode gelap" }));
    expect(html.getAttribute("data-theme")).toBe("dark");
  });
});

describe("ThemeScope", () => {
  it("menerapkan pilihan tersimpan saat masuk dan melepasnya saat keluar dari dashboard", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const { unmount } = render(<ThemeScope />);
    expect(html.getAttribute("data-theme")).toBe("dark");

    unmount();
    expect(html.hasAttribute("data-theme")).toBe(false);
  });

  it("tanpa pilihan, mengikuti sistem gelap", () => {
    stubSystem(true);
    render(<ThemeScope />);
    expect(html.getAttribute("data-theme")).toBe("dark");
  });

  it("pilihan terang menang atas sistem gelap", () => {
    stubSystem(true);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    render(<ThemeScope />);
    expect(html.hasAttribute("data-theme")).toBe(false);
  });
});
