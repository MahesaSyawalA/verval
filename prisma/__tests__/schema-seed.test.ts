import {
  FormatRapat,
  MetodePresensi,
  MetodeUndangan,
  PrioritasTiket,
  Role,
  StatusIsianBukti,
  StatusKehadiran,
  StatusNotulensi,
  StatusRapat,
  StatusTiket,
  TipeDataBukti,
} from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

describe("Database Schema & Seed Verification (Phase 01)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("exposes all ERD enums accurately", () => {
    expect(Object.values(Role)).toEqual(["Kaprodi", "Dosen", "Admin"]);
    expect(Object.values(StatusTiket)).toEqual([
      "Ditugaskan",
      "Dikerjakan",
      "Menunggu_Verifikasi",
      "Tercapai",
      "Ditolak",
    ]);
    expect(Object.values(StatusRapat)).toEqual([
      "Dijadwalkan",
      "Berlangsung",
      "Selesai",
    ]);
    expect(Object.values(MetodePresensi)).toEqual(["Kode", "Scan_QR", "Manual"]);
    expect(Object.values(FormatRapat)).toEqual(["Luring", "Daring", "Hybrid"]);
    expect(Object.values(MetodeUndangan)).toEqual([
      "Generate_Otomatis",
      "Upload_Manual",
    ]);
    expect(Object.values(StatusKehadiran)).toEqual([
      "Belum_Hadir",
      "Hadir",
      "Izin",
      "Sakit",
    ]);
    expect(Object.values(StatusNotulensi)).toEqual(["Draf", "Final"]);
    expect(Object.values(TipeDataBukti)).toEqual([
      "Teks",
      "Angka",
      "Tanggal",
      "Tautan",
      "File",
    ]);
    expect(Object.values(StatusIsianBukti)).toEqual(["Wajib", "Opsional"]);
    expect(Object.values(PrioritasTiket)).toEqual(["Normal", "Tinggi"]);
  });

  it("has seeded demo users for Kaprodi, Dosen, and Admin", async () => {
    const users = await db.users.findMany();
    expect(users.length).toBeGreaterThanOrEqual(3);

    const roles = new Set(users.map((u) => u.role));
    expect(roles.has("Kaprodi")).toBe(true);
    expect(roles.has("Dosen")).toBe(true);
    expect(roles.has("Admin")).toBe(true);
  });

  it("has seeded master_target, tiket_penugasan in all statuses, and rapat in all statuses", async () => {
    const targets = await db.master_target.findMany({
      include: { format_bukti: true },
    });
    expect(targets.length).toBe(5);
    expect(targets.every((t) => t.format_bukti.length > 0)).toBe(true);

    const tickets = await db.tiket_penugasan.findMany();
    const ticketStatuses = new Set(tickets.map((t) => t.status));
    expect(ticketStatuses).toEqual(
      new Set([
        "Ditugaskan",
        "Dikerjakan",
        "Menunggu_Verifikasi",
        "Tercapai",
        "Ditolak",
      ]),
    );

    const meetings = await db.rapat.findMany({
      include: {
        peserta_rapat: true,
        notulensi: true,
        dokumentasi: true,
      },
    });
    const meetingStatuses = new Set(meetings.map((m) => m.status_rapat));
    expect(meetingStatuses).toEqual(
      new Set(["Dijadwalkan", "Berlangsung", "Selesai"]),
    );
  });
});
