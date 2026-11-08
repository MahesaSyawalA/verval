import prisma from "@/lib/db";

export async function fetchAllTargetsAndTicketsForDashboard() {
  const [targets, tickets, dosens] = await Promise.all([
    prisma.master_target.findMany({
      orderBy: { kode_target: "asc" },
    }),
    prisma.tiket_penugasan.findMany({
      include: {
        master_target: true,
        dosen: true,
        isian_bukti: true,
      },
      orderBy: { tanggal_dibuat: "desc" },
    }),
    prisma.users.findMany({
      where: {
        role: { in: ["Dosen", "Kaprodi"] },
      },
      orderBy: { nama_lengkap: "asc" },
    }),
  ]);

  return { targets, tickets, dosens };
}

export async function fetchDosenPersonalDashboardRecords(dosenId: string) {
  const [tickets, pesertaRapatList] = await Promise.all([
    prisma.tiket_penugasan.findMany({
      where: { dosen_id: dosenId },
      include: {
        master_target: true,
        dosen: true,
        isian_bukti: true,
      },
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
  ]);

  return { tickets, pesertaRapatList };
}
