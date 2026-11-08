import { describe, expect, it } from "vitest";
import prisma from "@/lib/db";
import { getNotifikasiBadgeProps } from "../components/notification-dropdown";
import {
  createEventNotifikasi,
  listUserNotifikasi,
  markUserNotifikasiRead,
} from "../server/notifikasi.service";

describe("Phase 12 - Modul Notifikasi", () => {
  it("memetakan badge tipe notifikasi sesuai mockup Dropdown Notifikasi", () => {
    expect(getNotifikasiBadgeProps("RAPAT_PENGINGAT_1J")).toEqual({
      label: "1j",
      className: "bg-accent-100 text-warning-ink",
    });
    expect(getNotifikasiBadgeProps("RAPAT_PENGINGAT_H1")).toEqual({
      label: "H-1",
      className: "bg-accent-100 text-warning-ink",
    });
    expect(getNotifikasiBadgeProps("UNDANGAN_BARU")).toEqual({
      label: "U",
      className: "bg-primary-50 text-primary",
    });
    expect(getNotifikasiBadgeProps("NOTULENSI_FINAL")).toEqual({
      label: "N",
      className: "bg-primary-50 text-primary",
    });
    expect(getNotifikasiBadgeProps("TIKET_DITOLAK")).toEqual({
      label: "T",
      className: "bg-danger-soft text-danger-ink",
    });
  });

  it("memuat daftar notifikasi pengguna dan mendukung tandai dibaca serta pembuatan event notifikasi", async () => {
    const kaprodi = await prisma.users.findFirstOrThrow({
      where: { role: "Kaprodi" },
    });

    const initial = await listUserNotifikasi(kaprodi.id);
    expect(initial.items.length).toBeGreaterThanOrEqual(4);
    expect(initial.unreadCount).toBeGreaterThanOrEqual(2);

    const created = await createEventNotifikasi({
      userId: kaprodi.id,
      tipeNotifikasi: "TIKET_BARU",
      judulNotifikasi: "Notifikasi uji fase 12",
      pesan: "Pengujian pembuatan notifikasi event otomatis.",
    });

    expect(created.id).toBeTruthy();
    expect(created.isRead).toBe(false);

    const afterSingleMark = await markUserNotifikasiRead(kaprodi.id, {
      notifikasiId: created.id,
    });
    expect(afterSingleMark.updatedCount).toBe(1);

    // Cleanup test notification
    await prisma.notifikasi.delete({
      where: { id: created.id },
    });
  });
});
