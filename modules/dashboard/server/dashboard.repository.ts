import prisma from "@/lib/db";

const TICKET_INCLUDE = {
  master_target: true,
  dosen: true,
  isian_bukti: true,
  riwayat_tiket: {
    select: { status_riwayat: true, created_at: true },
    orderBy: { created_at: "asc" },
  },
} as const;

export async function fetchAllTargetsAndTicketsForDashboard() {
  const [targets, tickets, dosens] = await Promise.all([
    prisma.master_target.findMany({
      orderBy: { kode_target: "asc" },
    }),
    prisma.tiket_penugasan.findMany({
      include: TICKET_INCLUDE,
      orderBy: { tanggal_dibuat: "desc" },
    }),
    prisma.users.findMany({
      where: { role: "Dosen" },
      orderBy: { nama_lengkap: "asc" },
    }),
  ]);

  return { targets, tickets, dosens };
}

export async function fetchDosenPersonalDashboardRecords(dosenId: string) {
  const [tickets, pesertaRapatList, prodiTickets] = await Promise.all([
    prisma.tiket_penugasan.findMany({
      where: { dosen_id: dosenId },
      include: TICKET_INCLUDE,
      orderBy: { tenggat_waktu: "asc" },
    }),
    prisma.peserta_rapat.findMany({
      where: { dosen_id: dosenId },
      include: {
        rapat: true,
      },
      orderBy: {
        rapat: { tanggal: "desc" },
      },
    }),
    // Untuk target prodi pada gauge "Capaian Saya".
    prisma.tiket_penugasan.findMany({
      select: {
        kuantitas_ditugaskan: true,
        tenggat_waktu: true,
        tanggal_dibuat: true,
      },
    }),
  ]);

  return { tickets, pesertaRapatList, prodiTickets };
}
