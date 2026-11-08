import { db } from "@/lib/db";
import { calculateKPIScore } from "@/lib/utils";
import type { CreateTiketInput } from "../schemas/tiket.schema";
import type {
  DosenOption,
  StatusTiketType,
  TicketFilterParams,
  TicketItem,
} from "../types";

const TICKET_INCLUDE = {
  master_target: {
    include: {
      format_bukti: true,
    },
  },
  dosen: true,
  isian_bukti: {
    include: {
      format_bukti: true,
    },
    orderBy: {
      urutan_submisi: "asc" as const,
    },
  },
  riwayat_tiket: {
    include: {
      aktor: true,
    },
    orderBy: {
      created_at: "asc" as const,
    },
  },
};

type RawTicketRecord = NonNullable<
  Awaited<ReturnType<typeof findTicketRecordById>>
>;

function mapTicketRecord(record: RawTicketRecord): TicketItem {
  const uniqueSubmissions = new Set(
    record.isian_bukti.map((b) => b.urutan_submisi),
  ).size;

  const progresSubmisiCount =
    record.status === "Tercapai"
      ? record.kuantitas_ditugaskan
      : Math.min(
          record.kuantitas_ditugaskan,
          uniqueSubmissions > 0
            ? Math.max(uniqueSubmissions, record.isian_bukti.length > 0 ? 1 : 0)
            : 0,
        );

  const progresPersen =
    record.status === "Tercapai"
      ? 100
      : calculateKPIScore(progresSubmisiCount, record.kuantitas_ditugaskan);

  return {
    id: record.id,
    kodeTiket: record.kode_tiket,
    targetId: record.target_id,
    kodeTarget: record.master_target.kode_target,
    namaTarget: record.master_target.nama_target,
    satuan: record.master_target.satuan,
    tahunTarget: record.master_target.tahun,
    kuantitasTargetTotal: record.master_target.kuantitas_total,
    kuantitasDitugaskan: record.kuantitas_ditugaskan,
    progresSubmisiCount,
    progresPersen,
    tenggatWaktu: record.tenggat_waktu.toISOString(),
    prioritas: record.prioritas,
    isReminderActive: record.is_reminder_active,
    status: record.status,
    catatanKaprodi: record.catatan_kaprodi,
    tanggalDibuat: record.tanggal_dibuat.toISOString(),
    dosenId: record.dosen_id,
    dosenNama: record.dosen.nama_lengkap,
    dosenNip: record.dosen.nip,
    dosenEmail: record.dosen.email,
    formatBukti: record.master_target.format_bukti.map((fb) => ({
      id: fb.id,
      namaField: fb.nama_field,
      tipeData: fb.tipe_data,
      statusIsian: fb.status_isian,
    })),
    isianBukti: record.isian_bukti.map((ib) => ({
      id: ib.id,
      formatBuktiId: ib.format_bukti_id,
      namaField: ib.format_bukti.nama_field,
      tipeData: ib.format_bukti.tipe_data,
      urutanSubmisi: ib.urutan_submisi,
      nilaiIsian: ib.nilai_isian,
    })),
    riwayatTiket: record.riwayat_tiket.map((rt) => ({
      id: rt.id,
      statusRiwayat: rt.status_riwayat,
      createdAt: rt.created_at.toISOString(),
      aktorId: rt.aktor_id,
      aktorNama: rt.aktor.nama_lengkap,
      aktorRole: rt.aktor.role,
    })),
  };
}

export async function findTicketRecordById(id: string) {
  return db.tiket_penugasan.findUnique({
    where: { id },
    include: TICKET_INCLUDE,
  });
}

export async function findAllTickets(
  filter?: TicketFilterParams,
): Promise<TicketItem[]> {
  const search = filter?.search?.trim();

  const records = await db.tiket_penugasan.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.dosenId ? { dosen_id: filter.dosenId } : {}),
      ...(search
        ? {
            OR: [
              { kode_tiket: { contains: search } },
              { master_target: { nama_target: { contains: search } } },
              { master_target: { kode_target: { contains: search } } },
              { dosen: { nama_lengkap: { contains: search } } },
            ],
          }
        : {}),
    },
    include: TICKET_INCLUDE,
    orderBy: { tanggal_dibuat: "desc" },
  });

  return records.map(mapTicketRecord);
}

export async function findTicketById(id: string): Promise<TicketItem | null> {
  const record = await findTicketRecordById(id);
  return record ? mapTicketRecord(record) : null;
}

export async function findDosenOptions(): Promise<DosenOption[]> {
  const users = await db.users.findMany({
    where: { role: "Dosen" },
    orderBy: { nama_lengkap: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    nip: u.nip,
    namaLengkap: u.nama_lengkap,
    email: u.email,
  }));
}

export async function countTotalTickets(): Promise<number> {
  return db.tiket_penugasan.count();
}

export async function insertTicketRecord(
  input: CreateTiketInput,
  kodeTiket: string,
  aktorId: string,
): Promise<TicketItem> {
  const created = await db.tiket_penugasan.create({
    data: {
      kode_tiket: kodeTiket,
      target_id: input.targetId,
      dosen_id: input.dosenId,
      kuantitas_ditugaskan: input.kuantitasDitugaskan,
      tenggat_waktu: new Date(input.tenggatWaktu),
      prioritas: input.prioritas,
      is_reminder_active: input.isReminderActive,
      status: "Ditugaskan",
      catatan_kaprodi: input.catatanKaprodi || null,
      riwayat_tiket: {
        create: [
          {
            status_riwayat: "Ditugaskan",
            aktor_id: aktorId,
          },
        ],
      },
    },
    include: TICKET_INCLUDE,
  });

  return mapTicketRecord(created);
}

export async function updateTicketStatusWithHistory(
  ticketId: string,
  nextStatus: StatusTiketType,
  aktorId: string,
  catatanKaprodi?: string | null,
  historyEntries?: string[],
): Promise<TicketItem> {
  const statusesToLog = historyEntries ?? [nextStatus.replace(/_/g, " ")];

  const updated = await db.$transaction(async (tx) => {
    for (const statusLabel of statusesToLog) {
      await tx.riwayat_tiket.create({
        data: {
          tiket_id: ticketId,
          status_riwayat: statusLabel,
          aktor_id: aktorId,
        },
      });
    }

    return tx.tiket_penugasan.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        ...(catatanKaprodi !== undefined
          ? { catatan_kaprodi: catatanKaprodi }
          : {}),
      },
      include: TICKET_INCLUDE,
    });
  });

  return mapTicketRecord(updated);
}

export async function saveTicketBuktiAndStatus(
  ticketId: string,
  submissions: Array<{
    formatBuktiId: string;
    urutanSubmisi: number;
    nilaiIsian: string;
  }>,
  nextStatus: StatusTiketType,
  aktorId: string,
  historyEntries: string[],
): Promise<TicketItem> {
  const updated = await db.$transaction(async (tx) => {
    await tx.isian_bukti.deleteMany({
      where: { tiket_id: ticketId },
    });

    await tx.isian_bukti.createMany({
      data: submissions.map((s) => ({
        tiket_id: ticketId,
        format_bukti_id: s.formatBuktiId,
        urutan_submisi: s.urutanSubmisi,
        nilai_isian: s.nilaiIsian,
      })),
    });

    for (const statusLabel of historyEntries) {
      await tx.riwayat_tiket.create({
        data: {
          tiket_id: ticketId,
          status_riwayat: statusLabel,
          aktor_id: aktorId,
        },
      });
    }

    return tx.tiket_penugasan.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
      },
      include: TICKET_INCLUDE,
    });
  });

  return mapTicketRecord(updated);
}

export async function appendAttendanceBuktiToTargetT03(
  dosenId: string,
  judulRapat: string,
): Promise<TicketItem | null> {
  const record = await db.tiket_penugasan.findFirst({
    where: {
      dosen_id: dosenId,
      master_target: {
        kode_target: "T-03",
      },
    },
    include: TICKET_INCLUDE,
    orderBy: { tanggal_dibuat: "desc" },
  });

  if (!record) return null;

  const formatField = record.master_target.format_bukti[0];
  if (!formatField) return mapTicketRecord(record);

  const alreadyLogged = record.isian_bukti.some(
    (b) => b.nilai_isian.toLowerCase() === judulRapat.toLowerCase(),
  );
  if (alreadyLogged) {
    return mapTicketRecord(record);
  }

  const maxUrutan = record.isian_bukti.reduce(
    (max, item) => Math.max(max, item.urutan_submisi),
    0,
  );
  const nextStatus: StatusTiketType =
    record.status === "Ditugaskan" ? "Dikerjakan" : record.status;

  const updated = await db.$transaction(async (tx) => {
    await tx.isian_bukti.create({
      data: {
        tiket_id: record.id,
        format_bukti_id: formatField.id,
        urutan_submisi: maxUrutan + 1,
        nilai_isian: judulRapat,
      },
    });

    await tx.riwayat_tiket.create({
      data: {
        tiket_id: record.id,
        status_riwayat: `Presensi Rapat: ${judulRapat}`,
        aktor_id: dosenId,
      },
    });

    return tx.tiket_penugasan.update({
      where: { id: record.id },
      data: {
        status: nextStatus,
      },
      include: TICKET_INCLUDE,
    });
  });

  return mapTicketRecord(updated);
}
