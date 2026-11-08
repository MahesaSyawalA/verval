import { describe, expect, it } from "vitest";
import prisma from "@/lib/db";
import { recordMeetingAttendanceForTargetT03 } from "@/modules/tiket/server/tiket.service";
import { createFollowUpTicketFromNotulensi } from "../server/notulensi.service";

describe("Phase 15 - Integrasi Rapat & Kinerja", () => {
  it("mengonversi keputusan & tindak lanjut notulensi menjadi tiket penugasan baru melalui tiket.service", async () => {
    const [kaprodi, indira, targetT01, rapatKurikulum] = await Promise.all([
      prisma.users.findFirstOrThrow({ where: { role: "Kaprodi" } }),
      prisma.users.findFirstOrThrow({
        where: { role: "Dosen", nama_lengkap: { contains: "Indira" } },
      }),
      prisma.master_target.findFirstOrThrow({ where: { kode_target: "T-01" } }),
      prisma.rapat.findFirstOrThrow({
        where: { judul_rapat: { contains: "Kurikulum" } },
      }),
    ]);

    const ticket = await createFollowUpTicketFromNotulensi(
      rapatKurikulum.id,
      {
        targetId: targetT01.id,
        dosenId: indira.id,
        kuantitasDitugaskan: 1,
        tenggatWaktu: "2026-12-15",
        prioritas: "Tinggi",
      },
      { id: kaprodi.id, role: "Kaprodi" },
    );

    expect(ticket.id).toBeTruthy();
    expect(ticket.dosenId).toBe(indira.id);
    expect(ticket.catatanKaprodi).toContain("Tindak lanjut");
    expect(ticket.catatanKaprodi).toContain("Rapat Koordinasi Kurikulum");

    // Cleanup created ticket & notification
    await prisma.notifikasi.deleteMany({
      where: {
        user_id: indira.id,
        pesan: { contains: ticket.kodeTiket },
      },
    });
    await prisma.tiket_penugasan.delete({
      where: { id: ticket.id },
    });
  });

  it("mencatat kehadiran rapat dosen otomatis ke dalam bukti dan riwayat kinerja tiket T-03", async () => {
    const dian = await prisma.users.findFirstOrThrow({
      where: { role: "Dosen", nama_lengkap: { contains: "Dian" } },
    });

    const judulRapatUji = "Rapat Evaluasi Integrasi Kinerja 2026";
    const updatedTicket = await recordMeetingAttendanceForTargetT03(
      dian.id,
      judulRapatUji,
    );

    expect(updatedTicket).not.toBeNull();
    expect(updatedTicket?.kodeTarget).toBe("T-03");
    expect(
      updatedTicket?.isianBukti.some((b) => b.nilaiIsian === judulRapatUji),
    ).toBe(true);
    expect(
      updatedTicket?.riwayatTiket.some((r) =>
        r.statusRiwayat.includes(judulRapatUji),
      ),
    ).toBe(true);

    // Cleanup test attendance entry
    if (updatedTicket) {
      await prisma.isian_bukti.deleteMany({
        where: {
          tiket_id: updatedTicket.id,
          nilai_isian: judulRapatUji,
        },
      });
      await prisma.riwayat_tiket.deleteMany({
        where: {
          tiket_id: updatedTicket.id,
          status_riwayat: { contains: judulRapatUji },
        },
      });
    }
  });
});
