import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { evaluateUangCompleteness } from "@/lib/utils";
import type { CreateAgendaRapatInput } from "../schemas/rapat.schema";
import type {
  RapatFilterParams,
  RapatItem,
  RapatUserOption,
  StatusRapatType,
} from "../types";

const rapatInclude = {
  notulis: true,
  peserta_rapat: {
    include: {
      dosen: true,
    },
    orderBy: {
      id: "asc",
    },
  },
  notulensi: {
    include: {
      pembuat: true,
    },
  },
  dokumentasi: true,
} satisfies Prisma.rapatInclude;

type RapatRecordWithRelations = Prisma.rapatGetPayload<{
  include: typeof rapatInclude;
}>;

function formatTimeField(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseHHMMToUTCDate(timeStr: string): Date {
  const [hStr = "0", mStr = "0"] = timeStr.split(":");
  return new Date(Date.UTC(1970, 0, 1, Number(hStr), Number(mStr), 0));
}

export function mapRapatRecord(record: RapatRecordWithRelations): RapatItem {
  const waktuMulai = formatTimeField(record.waktu_mulai);
  const waktuSelesai = formatTimeField(record.waktu_selesai);
  const startMins =
    record.waktu_mulai.getUTCHours() * 60 + record.waktu_mulai.getUTCMinutes();
  const endMins =
    record.waktu_selesai.getUTCHours() * 60 +
    record.waktu_selesai.getUTCMinutes();

  const peserta = record.peserta_rapat.map((p) => ({
    id: p.id,
    dosenId: p.dosen_id,
    dosenNama: p.dosen.nama_lengkap,
    dosenNip: p.dosen.nip,
    dosenRole: p.dosen.role,
    statusKehadiran: p.status_kehadiran,
    waktuPresensi: p.waktu_presensi ? p.waktu_presensi.toISOString() : null,
    metodePresensi: p.metode_presensi,
    keteranganAbsen: p.keterangan_absen,
  }));

  const hadirCount = peserta.filter((p) => p.statusKehadiran === "Hadir").length;
  const izinCount = peserta.filter((p) => p.statusKehadiran === "Izin").length;
  const sakitCount = peserta.filter((p) => p.statusKehadiran === "Sakit").length;
  const belumHadirCount = peserta.filter(
    (p) => p.statusKehadiran === "Belum_Hadir",
  ).length;

  const hasUndangan =
    record.metode_undangan === "Generate_Otomatis" ||
    Boolean(record.file_undangan);
  const hasAbsensi =
    peserta.length > 0 && hadirCount + izinCount + sakitCount > 0;
  const hasFinalNotulensi = record.notulensi?.status_notulensi === "Final";
  const hasDokumentasi = record.dokumentasi.length > 0;

  const uangStatus = evaluateUangCompleteness({
    hasUndangan,
    hasAbsensi,
    hasFinalNotulensi,
    hasDokumentasi,
  });

  return {
    id: record.id,
    judulRapat: record.judul_rapat,
    tanggal: record.tanggal.toISOString(),
    waktuMulai,
    waktuSelesai,
    durasiMenit: Math.max(0, endMins - startMins),
    format: record.format,
    lokasi: record.lokasi,
    deskripsiAgenda: record.deskripsi_agenda,
    kodePresensi: record.kode_presensi,
    isReminderActive: record.is_reminder_active,
    metodeUndangan: record.metode_undangan,
    fileUndangan: record.file_undangan,
    statusRapat: record.status_rapat,
    notulisId: record.notulis_id,
    notulisNama: record.notulis.nama_lengkap,
    peserta,
    notulensi: record.notulensi
      ? {
          id: record.notulensi.id,
          agendaPembahasan: record.notulensi.agenda_pembahasan,
          halDibahas: record.notulensi.hal_dibahas,
          keputusan: record.notulensi.keputusan,
          tindakLanjut: record.notulensi.tindak_lanjut,
          fileLampiran: record.notulensi.file_lampiran,
          statusNotulensi: record.notulensi.status_notulensi,
          dibuatOlehId: record.notulensi.dibuat_oleh,
          dibuatOlehNama: record.notulensi.pembuat.nama_lengkap,
        }
      : null,
    dokumentasi: record.dokumentasi.map((d) => ({
      id: d.id,
      fileGambar: d.file_gambar,
      caption: d.caption,
    })),
    uangStatus,
    totalPeserta: peserta.length,
    hadirCount,
    izinCount,
    sakitCount,
    belumHadirCount,
  };
}

export async function findAllRapat(
  filter?: RapatFilterParams,
): Promise<RapatItem[]> {
  const where: Prisma.rapatWhereInput = {};
  if (filter?.status) {
    where.status_rapat = filter.status;
  }
  if (filter?.search?.trim()) {
    const q = filter.search.trim();
    where.OR = [
      { judul_rapat: { contains: q } },
      { lokasi: { contains: q } },
      { notulis: { nama_lengkap: { contains: q } } },
    ];
  }

  const rows = await prisma.rapat.findMany({
    where,
    include: rapatInclude,
    orderBy: [{ tanggal: "desc" }, { waktu_mulai: "asc" }],
  });

  const mapped: RapatItem[] = rows.map(mapRapatRecord);

  if (filter?.completeness === "COMPLETE") {
    return mapped.filter((item) => item.uangStatus.isComplete);
  }
  if (filter?.completeness === "INCOMPLETE") {
    return mapped.filter((item) => !item.uangStatus.isComplete);
  }

  return mapped;
}

export async function findRapatById(id: string): Promise<RapatItem | null> {
  const row = await prisma.rapat.findUnique({
    where: { id },
    include: rapatInclude,
  });
  return row ? mapRapatRecord(row) : null;
}

export async function findRapatUserOptions(): Promise<RapatUserOption[]> {
  const users = await prisma.users.findMany({
    where: {
      role: { in: ["Kaprodi", "Dosen"] },
    },
    orderBy: { nama_lengkap: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    nip: u.nip,
    namaLengkap: u.nama_lengkap,
    email: u.email,
    role: u.role,
  }));
}

export async function insertRapatRecord(
  input: CreateAgendaRapatInput,
  kodePresensi: string,
  generatedFileUndangan: string | null,
): Promise<RapatItem> {
  const uniquePesertaIds = Array.from(
    new Set([...input.pesertaIds, input.notulisId]),
  );

  const created = await prisma.rapat.create({
    data: {
      judul_rapat: input.judulRapat,
      tanggal: new Date(input.tanggal),
      waktu_mulai: parseHHMMToUTCDate(input.waktuMulai),
      waktu_selesai: parseHHMMToUTCDate(input.waktuSelesai),
      format: input.format,
      lokasi: input.lokasi,
      deskripsi_agenda: input.deskripsiAgenda,
      notulis_id: input.notulisId,
      kode_presensi: kodePresensi,
      is_reminder_active: input.isReminderActive,
      metode_undangan: input.metodeUndangan,
      file_undangan: generatedFileUndangan,
      status_rapat: "Dijadwalkan",
      peserta_rapat: {
        create: uniquePesertaIds.map((dosenId) => ({
          dosen_id: dosenId,
          status_kehadiran: "Belum_Hadir",
        })),
      },
    },
    include: rapatInclude,
  });

  return mapRapatRecord(created);
}

export async function updateRapatStatusRecord(
  id: string,
  statusRapat: StatusRapatType,
): Promise<RapatItem> {
  const updated = await prisma.rapat.update({
    where: { id },
    data: { status_rapat: statusRapat },
    include: rapatInclude,
  });
  return mapRapatRecord(updated);
}
