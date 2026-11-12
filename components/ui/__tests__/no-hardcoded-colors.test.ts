// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const SCAN = ["components", "modules", "app/(dashboard)"];
// Login dan SSO sengaja tidak mengikuti mode gelap.
const EXCLUDED = [`modules${path.sep}auth`, `modules${path.sep}sso`, "__tests__"];

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (EXCLUDED.some((part) => full.includes(part))) return [];
    if (entry.isDirectory()) return sources(full);
    return entry.name.endsWith(".tsx") ? [full] : [];
  });
}

const files = SCAN.flatMap((d) => sources(path.join(ROOT, d)));

function offenders(pattern: RegExp): string[] {
  return files.flatMap((file) => {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    return lines.flatMap((line, i) =>
      pattern.test(line)
        ? [`${path.relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 90)}`]
        : [],
    );
  });
}

describe("komponen dashboard memakai token warna, bukan warna kaku", () => {
  it("tanpa bg-white (pakai bg-card agar ikut mode gelap)", () => {
    expect(offenders(/(?<![\w/[-])bg-white(?![\w/-])/)).toEqual([]);
  });

  it("tanpa warna heks di kelas atau atribut (pakai token atau variabel CSS)", () => {
    expect(offenders(/#[0-9A-Fa-f]{6}\b/)).toEqual([]);
  });

  it("teks biru memakai text-brand dan teks galat memakai text-danger-ink", () => {
    expect(offenders(/(?<![\w/[-])text-primary(?![\w-])/)).toEqual([]);
    expect(offenders(/(?<![\w/[-])text-danger(?![\w-])/)).toEqual([]);
  });

  it("tanpa ring atau gradien putih kaku", () => {
    expect(offenders(/(?<![\w/[-])(ring|border|from|to|via)-white(?![\w/-])/)).toEqual([]);
  });
});
