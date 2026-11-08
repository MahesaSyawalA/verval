import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/http";
import { createTiketSchema, type TicketItem } from "@/modules/tiket";
import {
  canTransitionTicketStatus,
  createTicketAssignment,
  transitionTicketStatus,
  type TiketRepositoryDeps,
} from "@/modules/tiket/server/tiket.service";

function createInMemoryTicketDeps(
  initial: TicketItem[] = [],
): TiketRepositoryDeps {
  const store = [...initial];

  return {
    findAll: async (filter) =>
      store.filter((t) => {
        if (filter?.status && t.status !== filter.status) return false;
        if (filter?.dosenId && t.dosenId !== filter.dosenId) return false;
        return true;
      }),
    findById: async (id) => store.find((t) => t.id === id) ?? null,
    findDosens: async () => [],
    countTickets: async () => store.length,
    insert: async (input, kodeTiket, aktorId) => {
      const created: TicketItem = {
        id: `ticket-${store.length + 1}`,
        kodeTiket,
        targetId: input.targetId,
        kodeTarget: "T-01",
        namaTarget: "Publikasi artikel jurnal",
        satuan: "Artikel",
        tahunTarget: 2026,
        kuantitasTargetTotal: 5,
        kuantitasDitugaskan: input.kuantitasDitugaskan,
        progresSubmisiCount: 0,
        progresPersen: 0,
        tenggatWaktu: input.tenggatWaktu,
        prioritas: input.prioritas,
        isReminderActive: input.isReminderActive,
        status: "Ditugaskan",
        catatanKaprodi: input.catatanKaprodi ?? null,
        tanggalDibuat: new Date().toISOString(),
        dosenId: input.dosenId,
        dosenNama: "Indira Syawanodya",
        dosenNip: "199008212018032001",
        dosenEmail: "indira@upi.edu",
        formatBukti: [],
        isianBukti: [],
        riwayatTiket: [
          {
            id: "rt-1",
            statusRiwayat: "Ditugaskan",
            createdAt: new Date().toISOString(),
            aktorId,
            aktorNama: "Dr. Iqbal Al-Farisi",
            aktorRole: "Kaprodi",
          },
        ],
      };
      store.push(created);
      return created;
    },
    updateStatus: async (ticketId, nextStatus, aktorId, catatanKaprodi) => {
      const idx = store.findIndex((t) => t.id === ticketId);
      const current = store[idx];
      const updated: TicketItem = {
        ...current,
        status: nextStatus,
        catatanKaprodi:
          catatanKaprodi !== undefined
            ? catatanKaprodi
            : current.catatanKaprodi,
        riwayatTiket: [
          ...current.riwayatTiket,
          {
            id: `rt-${current.riwayatTiket.length + 1}`,
            statusRiwayat: nextStatus.replace(/_/g, " "),
            createdAt: new Date().toISOString(),
            aktorId,
            aktorNama: "Aktor",
            aktorRole: "Kaprodi",
          },
        ],
      };
      store[idx] = updated;
      return updated;
    },
    saveBukti: async () => store[0],
  };
}

describe("Tiket Penugasan & Status State Machine (Phase 04)", () => {
  it("validates allowed transitions strictly (Ditugaskan -> Dikerjakan -> Menunggu_Verifikasi -> Tercapai/Ditolak)", () => {
    expect(canTransitionTicketStatus("Ditugaskan", "Dikerjakan")).toBe(true);
    expect(canTransitionTicketStatus("Ditugaskan", "Tercapai")).toBe(false);
    expect(canTransitionTicketStatus("Dikerjakan", "Menunggu_Verifikasi")).toBe(
      true,
    );
    expect(canTransitionTicketStatus("Menunggu_Verifikasi", "Tercapai")).toBe(
      true,
    );
    expect(canTransitionTicketStatus("Menunggu_Verifikasi", "Ditolak")).toBe(
      true,
    );
    expect(canTransitionTicketStatus("Ditolak", "Menunggu_Verifikasi")).toBe(
      true,
    );
    expect(canTransitionTicketStatus("Tercapai", "Dikerjakan")).toBe(false);
  });

  it("creates ticket with initial status Ditugaskan and writes initial riwayat_tiket", async () => {
    const deps = createInMemoryTicketDeps();
    const parsed = createTiketSchema.parse({
      targetId: "target-1",
      dosenId: "dosen-1",
      kuantitasDitugaskan: 3,
      tenggatWaktu: "2026-11-30",
      prioritas: "Normal",
      isReminderActive: true,
    });

    const ticket = await createTicketAssignment(parsed, "kaprodi-1", deps);
    expect(ticket.status).toBe("Ditugaskan");
    expect(ticket.riwayatTiket).toHaveLength(1);
    expect(ticket.riwayatTiket[0].statusRiwayat).toBe("Ditugaskan");
  });

  it("records riwayat_tiket on valid transitions and rejects invalid transitions with 409 CONFLICT", async () => {
    const deps = createInMemoryTicketDeps();
    const ticket = await createTicketAssignment(
      {
        targetId: "target-1",
        dosenId: "dosen-1",
        kuantitasDitugaskan: 3,
        tenggatWaktu: "2026-11-30",
        prioritas: "Normal",
        isReminderActive: true,
      },
      "kaprodi-1",
      deps,
    );

    const step1 = await transitionTicketStatus(
      ticket.id,
      "Dikerjakan",
      { id: "dosen-1", role: "Dosen" },
      undefined,
      deps,
    );
    expect(step1.status).toBe("Dikerjakan");
    expect(step1.riwayatTiket).toHaveLength(2);

    await expect(
      transitionTicketStatus(
        ticket.id,
        "Tercapai",
        { id: "kaprodi-1", role: "Kaprodi" },
        undefined,
        deps,
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });

    const step2 = await transitionTicketStatus(
      ticket.id,
      "Menunggu_Verifikasi",
      { id: "dosen-1", role: "Dosen" },
      undefined,
      deps,
    );
    expect(step2.status).toBe("Menunggu_Verifikasi");

    // Dosen cannot verify their own ticket (403 FORBIDDEN)
    await expect(
      transitionTicketStatus(
        ticket.id,
        "Tercapai",
        { id: "dosen-1", role: "Dosen" },
        undefined,
        deps,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });
});
