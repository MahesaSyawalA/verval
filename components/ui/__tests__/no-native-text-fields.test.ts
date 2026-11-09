// @vitest-environment node
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../../..");
const SCAN_DIRS = ["app", "modules", "components/layout", "components/charts"];

// Tipe yang memang tetap native sampai komponen HeroUI padanannya dipakai.
const ALLOWED_INPUT_TYPES = new Set(["file", "checkbox", "radio", "hidden"]);

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" || entry.name === "node_modules"
        ? []
        : listSourceFiles(full);
    }
    return /\.(tsx)$/.test(entry.name) ? [full] : [];
  });
}

/** Potongan tag pembuka JSX (sampai `>` pertama di luar kurung kurawal). */
function openingTags(source: string, tag: string): string[] {
  const tags: string[] = [];
  const re = new RegExp(`<${tag}\\b`, "g");
  for (let m = re.exec(source); m; m = re.exec(source)) {
    let depth = 0;
    let i = m.index;
    for (; i < source.length; i++) {
      const ch = source[i];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      else if (ch === ">" && depth === 0) break;
    }
    tags.push(source.slice(m.index, i + 1));
  }
  return tags;
}

describe("field teks memakai komponen HeroUI lewat components/ui", () => {
  const files = SCAN_DIRS.flatMap((d) => listSourceFiles(path.join(ROOT, d)));

  it("tidak ada <textarea> native di luar components/ui", () => {
    const offenders = files.filter((f) =>
      openingTags(fs.readFileSync(f, "utf8"), "textarea").length > 0,
    );
    expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it("tidak ada <input> teks/pencarian native di luar components/ui", () => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const tag of openingTags(fs.readFileSync(file, "utf8"), "input")) {
        const type = /type="([a-z-]+)"/.exec(tag)?.[1] ?? "text";
        if (!ALLOWED_INPUT_TYPES.has(type)) {
          offenders.push(`${path.relative(ROOT, file)} (type=${type})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
