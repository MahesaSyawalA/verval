import prisma from "@/lib/db";
import type {
  MetodePresensiType,
  PresensiSubmissionResult,
  RapatPresensiContext,
  StatusKehadiranType,
} from "../types";

export async function findRapatPresensiContext(
  rapatId: string,
): Promise<RapatPresensiContext | null> {
  const row = await prisma.rapat.findUnique({
    where: { id: rapatId },
    include: {
      peserta_rapat: {
        include: { dosen: true },
      },
    },
  });

  if (!row) return null;

  return {
    rapatId: row.id,
    judulRapat: row.judul_rapat,
    statusRapat: row.status_rapat,
    kodePresensi: row.kode_presensi,
    peserta: row.peserta_rapat.map((p) => ({
      id: p.id,
      dosenId: p.dosen_id,
      dosenNama: p.dosen.nama_lengkap,
      dosenNip: p.dosen.nip,
      dosenRole: p.dosen.role,
      statusKehadiran: p.status_kehadiran,
      waktuPresensi: p.waktu_presensi ? p.waktu_presensi.toISOString() : null,
      metodePresensi: p.metode_presensi,
      keteranganAbsen: p.keterangan_absen,
    })),
  };
}

export async function upsertPesertaPresensiRecord(params: {
  rapatId: string;
  judulRapat: string;
  dosenId: string;
  statusKehadiran: StatusKehadiranType;
  metodePresensi: MetodePresensiType;
  keteranganAbsen?: string;
}): Promise<PresensiSubmissionResult> {
  const now = new Date();

  const updated = await prisma.peserta_rapat.upsert({
    where: {
      dosen_id_rapat_id: {
        dosen_id: params.dosenId,
        rapat_id: params.rapatId,
      },
    },
    update: {
      status_kehadiran: params.statusKehadiran,
      metode_presensi: params.metodePresensi,
      waktu_presensi: now,
      keterangan_absen: params.keteranganAbsen ?? null,
    },
    create: {
      dosen_id: params.dosenId,
      rapat_id: params.rapatId,
      status_kehadiran: params.statusKehadiran,
      metode_presensi: params.metodePresensi,
      waktu_presensi: now,
      keterangan_absen: params.keteranganAbsen ?? null,
    },
    include: {
      dosen: true,
    },
  });

  return {
    rapatId: params.rapatId,
    judulRapat: params.judulRapat,
    dosenId: updated.dosen_id,
    dosenNama: updated.dosen.nama_lengkap,
    statusKehadiran: updated.status_kehadiran,
    metodePresensi: updated.metode_presensi ?? params.metodePresensi,
    waktuPresensi: (updated.waktu_presensi ?? now).toISOString(),
    keteranganAbsen: updated.keterangan_absen,
  };
}
