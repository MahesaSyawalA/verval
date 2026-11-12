// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.resolve(__dirname, "../../../app/globals.css"), "utf8");

function readVars(pattern: RegExp): Record<string, string> {
  const block = css.match(pattern)?.[1] ?? "";
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2].toUpperCase()]),
  );
}

const light = readVars(/:root\s*\{([\s\S]*?)\n\}/);
const darkOverrides = readVars(/html\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
const dark = { ...light, ...darkOverrides };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("token mode terang tidak berubah dari rancangan awal", () => {
  it.each([
    ["primary", "#0101B7"],
    ["primary-50", "#ECECFF"],
    ["primary-700", "#010193"],
    ["surface", "#F2F7FF"],
    ["card", "#FFFFFF"],
    ["ink", "#092C4C"],
    ["ink-muted", "#667A8F"],
    ["ink-subtle", "#8594A5"],
    ["border-soft", "#E3E8F2"],
    ["success-bg", "#DDF5E6"],
    ["danger-bg", "#FDE1E1"],
    ["danger-ink", "#B3261E"],
    ["accent", "#FFD166"],
    ["secondary", "#8DCCF1"],
    ["brand", "#0101B7"],
  ])("--%s = %s", (name, value) => {
    expect(light[name]).toBe(value);
  });
});

describe("kelengkapan token", () => {
  it("setiap token gelap punya padanan terang", () => {
    expect(Object.keys(darkOverrides).filter((k) => !(k in light))).toEqual([]);
  });

  it("setiap utilitas warna di @theme menunjuk variabel yang terdefinisi", () => {
    const refs = [...css.matchAll(/--color-[\w-]+:\s*var\(--([\w-]+)\)/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(40);
    expect(refs.filter((name) => !(name in light))).toEqual([]);
  });
});

describe("kontras mode gelap (WCAG)", () => {
  const pairs: Array<[string, string, string, number]> = [
    ["teks utama di kartu", "ink", "card", 7],
    ["teks utama di latar halaman", "ink", "surface", 7],
    ["teks redup di kartu", "ink-muted", "card", 4.5],
    ["teks redup di latar halaman", "ink-muted", "surface", 4.5],
    ["teks samar di kartu", "ink-subtle", "card", 4.5],
    ["tautan/ikon biru di kartu", "brand", "card", 4.5],
    ["tautan/ikon biru di latar halaman", "brand", "surface", 4.5],
    ["teks biru di chip primary-50", "brand", "primary-50", 4.5],
    ["teks biru di chip netral", "brand", "chip", 4.5],
    ["status sukses", "success-ink", "success-bg", 4.5],
    ["status peringatan", "warning-ink", "warning-bg", 4.5],
    ["status info", "info-ink", "info-bg", 4.5],
    ["status bahaya", "danger-ink", "danger-bg", 4.5],
    ["teks galat di kartu", "danger-ink", "card", 4.5],
    ["teks di atas kuning", "on-accent", "accent", 4.5],
    ["teks di atas biru muda", "on-secondary", "secondary", 4.5],
    ["garis grafik di kartu (komponen UI)", "chart-primary", "card", 3],
    ["tombol primary vs kartu (komponen UI)", "primary", "card", 3],
  ];

  it.each(pairs)("%s", (_label, fg, bg, min) => {
    expect(contrast(dark[fg], dark[bg])).toBeGreaterThanOrEqual(min);
  });

  it("teks putih di atas latar primary dan danger terbaca", () => {
    expect(contrast("#FFFFFF", dark.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#FFFFFF", dark.danger)).toBeGreaterThanOrEqual(4.5);
  });

  it("latar dan kartu gelap benar-benar gelap, teks utama terang", () => {
    expect(luminance(dark.surface)).toBeLessThan(0.05);
    expect(luminance(dark.card)).toBeLessThan(0.05);
    expect(luminance(dark.ink)).toBeGreaterThan(0.7);
  });
});
