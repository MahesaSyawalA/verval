import fs from "node:fs";
import path from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationDropdown } from "@/modules/notifikasi";

const ROOT_DIR = process.cwd();

function collectTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "__tests__"
      ) {
        continue;
      }
      files.push(...collectTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("Phase 16 - Audit Arsitektur Modular, Aksesibilitas & UI Polish", () => {
  it("memastikan @heroui/react hanya diimpor di dalam components/ui/*", () => {
    const dirsToScan = [
      path.join(ROOT_DIR, "app"),
      path.join(ROOT_DIR, "modules"),
      path.join(ROOT_DIR, "components", "layout"),
      path.join(ROOT_DIR, "components", "charts"),
    ];

    const violations: string[] = [];
    for (const dir of dirsToScan) {
      for (const file of collectTsFiles(dir)) {
        const content = fs.readFileSync(file, "utf8");
        if (content.includes("@heroui/react")) {
          violations.push(path.relative(ROOT_DIR, file));
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("memastikan klien Prisma (@/lib/db) hanya diimpor di dalam *.repository.ts", () => {
    const dirsToScan = [
      path.join(ROOT_DIR, "app"),
      path.join(ROOT_DIR, "components"),
      path.join(ROOT_DIR, "modules"),
    ];

    const violations: string[] = [];
    for (const dir of dirsToScan) {
      for (const file of collectTsFiles(dir)) {
        if (file.endsWith(".repository.ts")) continue;
        const content = fs.readFileSync(file, "utf8");
        if (content.includes("@/lib/db")) {
          violations.push(path.relative(ROOT_DIR, file));
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("memastikan komponen client ('use client') tidak pernah mengimpor modules/*/server/*", () => {
    const dirsToScan = [
      path.join(ROOT_DIR, "app"),
      path.join(ROOT_DIR, "components"),
      path.join(ROOT_DIR, "modules"),
    ];

    const violations: string[] = [];
    for (const dir of dirsToScan) {
      for (const file of collectTsFiles(dir)) {
        const content = fs.readFileSync(file, "utf8");
        if (
          content.includes('"use client"') &&
          /modules\/[^/]+\/server/.test(content)
        ) {
          violations.push(path.relative(ROOT_DIR, file));
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("merender NotificationDropdown dengan atribut aksesibilitas dan tombol Isi Presensi pada pengingat 1 jam", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, enabled: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDropdown
          initialUnreadCount={2}
          initialItems={[
            {
              id: "notif-1",
              tipeNotifikasi: "RAPAT_PENGINGAT_1J",
              judulNotifikasi: "Rapat dimulai 1 jam lagi",
              pesan: "Evaluasi Kinerja Dosen · 13:00 · Ruang Sidang B",
              isRead: false,
              createdAt: "2026-10-21T12:00:00.000Z",
              userId: "user-1",
            },
            {
              id: "notif-2",
              tipeNotifikasi: "NOTULENSI_FINAL",
              judulNotifikasi: "Notulensi tersedia",
              pesan: "Rapat Koordinasi Kurikulum · baca di arsip",
              isRead: true,
              createdAt: "2026-10-21T10:00:00.000Z",
              userId: "user-1",
            },
          ]}
        />
      </QueryClientProvider>,
    );

    const bellBtn = screen.getByRole("button", { name: "Notifikasi" });
    expect(bellBtn.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByTestId("notifikasi-unread-dot")).toBeTruthy();

    fireEvent.click(bellBtn);

    expect(bellBtn.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("dialog", { name: "Panel Notifikasi" }),
    ).toBeTruthy();
    expect(screen.getByText("Rapat dimulai 1 jam lagi")).toBeTruthy();
    expect(screen.getByText("Isi Presensi")).toBeTruthy();
    expect(screen.getByText("Tandai dibaca")).toBeTruthy();
  });
});
