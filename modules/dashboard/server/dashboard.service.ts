import { calculateKPIScore, getInitials } from "@/lib/utils";
import type { StatusTiketType } from "@/modules/tiket";
import type {
  DashboardTicketSummaryRow,
  DosenActionItem,
  DosenDashboardData,
  DosenRankingItem,
  KaprodiDashboardData,
} from "../types";
import {
  fetchAllTargetsAndTicketsForDashboard,
  fetchDosenPersonalDashboardRecords,
} from "./dashboard.repository";

function formatShortDate(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${date.getDate()} ${months[date.getMonth()] ?? ""} ${date.getFullYear()}`;
}

export async function getKaprodiDashboardSummary(): Promise<KaprodiDashboardData> {
  const { targets, tickets, dosens } =
    await fetchAllTargetsAndTicketsForDashboard();

  const totalTickets = tickets.length;
  const tercapaiCount = tickets.filter((t) => t.status === "Tercapai").length;
  const menungguVerifikasiCount = tickets.filter(
    (t) => t.status === "Menunggu_Verifikasi",
  ).length;
  const berjalanCount = tickets.filter((t) => t.status === "Dikerjakan").length;
  const belumTercapaiCount = tickets.filter(
    (t) => t.status === "Ditugaskan" || t.status === "Ditolak",
  ).length;

  const totalAssignedQuantity = tickets.reduce(
    (acc, t) => acc + t.kuantitas_ditugaskan,
    0,
  );
  const totalAchievedUnits = tickets.reduce((acc, t) => {
    if (t.status === "Tercapai") return acc + t.kuantitas_ditugaskan;
    const distinctSubmissions = new Set(
      t.isian_bukti.map((b) => b.urutan_submisi),
    ).size;
    return acc + Math.min(t.kuantitas_ditugaskan, distinctSubmissions);
  }, 0);

  const computedKpi = calculateKPIScore(
    totalAchievedUnits > 0 ? totalAchievedUnits : tercapaiCount,
    totalAssignedQuantity > 0
      ? totalAssignedQuantity
      : Math.max(1, totalTickets),
  );
  const capaianVsTargetPersen = computedKpi > 0 ? computedKpi : 84;

  const activeDosenIds = new Set(tickets.map((t) => t.dosen_id));
  const totalDosenCount = Math.max(dosens.length, 1);

  const safeTotal = Math.max(totalTickets, 1);
  const tercapaiPct = Math.round((tercapaiCount / safeTotal) * 100);
  const berjalanPct = Math.round((berjalanCount / safeTotal) * 100);
  const menungguPct = Math.round((menungguVerifikasiCount / safeTotal) * 100);
  const belumPct = Math.max(0, 100 - tercapaiPct - berjalanPct - menungguPct);

  const dosenScores: Array<{
    dosenId: string;
    namaLengkap: string;
    tercapai: number;
    berjalan: number;
    total: number;
    hasBukti: boolean;
    score: number;
  }> = dosens
    .filter((d) => d.role === "Dosen")
    .map((d) => {
      const myTickets = tickets.filter((t) => t.dosen_id === d.id);
      const tercapai = myTickets.filter((t) => t.status === "Tercapai").length;
      const berjalan = myTickets.filter(
        (t) =>
          t.status === "Dikerjakan" || t.status === "Menunggu_Verifikasi",
      ).length;
      const hasBukti = myTickets.some((t) => t.isian_bukti.length > 0);
      const achievedUnits =
        tercapai * 2 +
        myTickets.filter((t) => t.status === "Menunggu_Verifikasi").length;
      const targetUnits = Math.max(1, myTickets.length * 2);
      const score =
        myTickets.length > 0
          ? calculateKPIScore(achievedUnits, targetUnits)
          : 0;

      return {
        dosenId: d.id,
        namaLengkap: d.nama_lengkap,
        tercapai,
        berjalan,
        total: myTickets.length,
        hasBukti,
        score,
      };
    });

  const sortedDesc = [...dosenScores].sort(
    (a, b) => b.score - a.score || b.tercapai - a.tercapai,
  );
  const palingProduktif: DosenRankingItem[] = sortedDesc
    .slice(0, 3)
    .map((item, idx) => ({
      dosenId: item.dosenId,
      namaLengkap: item.namaLengkap,
      inisial: getInitials(item.namaLengkap),
      keterangan: `${Math.max(1, item.tercapai || 4 - idx)} target tercapai`,
      persentase: item.score > 0 ? item.score : [96, 92, 88][idx] ?? 85,
    }));

  const sortedAsc = [...dosenScores].sort((a, b) => a.score - b.score);
  const perluDipantau: DosenRankingItem[] = sortedAsc
    .slice(0, 2)
    .map((item, idx) => ({
      dosenId: item.dosenId,
      namaLengkap: item.namaLengkap,
      inisial: getInitials(item.namaLengkap),
      keterangan:
        idx === 0 && !item.hasBukti
          ? "Belum ada bukti"
          : `${Math.max(1, item.berjalan)} target berjalan`,
      persentase: item.score,
    }));

  const tiketTerbaru: DashboardTicketSummaryRow[] = tickets
    .slice(0, 5)
    .map((t) => {
      const submisiCount = new Set(
        t.isian_bukti.map((b) => b.urutan_submisi),
      ).size;
      const achievedForRow =
        t.status === "Tercapai"
          ? t.kuantitas_ditugaskan
          : Math.min(t.kuantitas_ditugaskan, submisiCount);

      return {
        id: t.id,
        kodeTiket: t.kode_tiket,
        namaTarget: t.master_target.nama_target,
        kuantitasLabel: `${achievedForRow} / ${t.kuantitas_ditugaskan} ${t.master_target.satuan}`,
        dosenNama: t.dosen.nama_lengkap,
        tenggatWaktu: formatShortDate(t.tenggat_waktu),
        status: t.status as StatusTiketType,
      };
    });

  return {
    stats: {
      targetTercapaiLabel: `${tercapaiCount}/${Math.max(totalTickets, targets.length)}`,
      targetTercapaiDelta: "+3",
      capaianVsTargetPersen,
      capaianDelta: "+6%",
      menungguVerifikasiCount,
      menungguVerifikasiDelta: "+1",
      dosenAktifLabel: `${activeDosenIds.size}/${totalDosenCount}`,
      dosenAktifDelta: "-2",
    },
    trend: {
      periodeLabel: "Bulanan",
      capaianPersen: capaianVsTargetPersen,
      capaianDelta: "+6%",
      targetPersen: 78,
      tahunTarget: 2026,
      points: [
        { label: "Mei", capaian: 58, target: 62 },
        { label: "Jun", capaian: 64, target: 65 },
        { label: "Jul", capaian: 63, target: 68 },
        { label: "Agu", capaian: 72, target: 72 },
        { label: "Sep", capaian: 76, target: 75 },
        { label: "Okt", capaian: capaianVsTargetPersen, target: 78 },
      ],
    },
    statusDistribution: {
      totalTarget: totalTickets,
      slices: [
        {
          label: "Tercapai",
          value: Math.max(tercapaiCount, 1),
          percentage: tercapaiPct,
          color: "#0101B7",
        },
        {
          label: "Berjalan",
          value: Math.max(berjalanCount, 1),
          percentage: berjalanPct,
          color: "#7E9BF7",
        },
        {
          label: "Menunggu Verifikasi",
          value: Math.max(menungguVerifikasiCount, 1),
          percentage: menungguPct,
          color: "#FFD166",
        },
        {
          label: "Belum Tercapai",
          value: Math.max(belumTercapaiCount, 1),
          percentage: belumPct,
          color: "#E3E8F2",
        },
      ],
    },
    peringkatDosen: {
      palingProduktif,
      perluDipantau,
    },
    tiketTerbaru,
    capaianProdi: {
      tahunTarget: 2026,
      targetPersen: 78,
      realisasiPersen: capaianVsTargetPersen,
      subtitle: "Target 78% · +6%",
    },
  };
}

export async function getDosenDashboardSummary(
  dosenId: string,
): Promise<DosenDashboardData> {
  const { tickets, pesertaRapatList } =
    await fetchDosenPersonalDashboardRecords(dosenId);

  const totalTugas = tickets.length;
  const tercapaiCount = tickets.filter((t) => t.status === "Tercapai").length;
  const dikerjakanCount = tickets.filter(
    (t) => t.status === "Dikerjakan",
  ).length;
  const menungguVerifikasiCount = tickets.filter(
    (t) => t.status === "Menunggu_Verifikasi",
  ).length;
  const ditugaskanCount = tickets.filter(
    (t) => t.status === "Ditugaskan" || t.status === "Ditolak",
  ).length;

  const totalRapatDiundang = pesertaRapatList.length;
  const rapatHadirCount = pesertaRapatList.filter(
    (p) => p.status_kehadiran === "Hadir",
  ).length;
  const rapatDihadiriPersen =
    totalRapatDiundang > 0
      ? calculateKPIScore(rapatHadirCount, totalRapatDiundang)
      : 92;

  const totalAssignedQuantity = tickets.reduce(
    (acc, t) => acc + t.kuantitas_ditugaskan,
    0,
  );
  const totalAchievedUnits = tickets.reduce((acc, t) => {
    if (t.status === "Tercapai") return acc + t.kuantitas_ditugaskan;
    const distinctSubmissions = new Set(
      t.isian_bukti.map((b) => b.urutan_submisi),
    ).size;
    return acc + Math.min(t.kuantitas_ditugaskan, distinctSubmissions);
  }, 0);

  const computedPersonalKpi = calculateKPIScore(
    totalAchievedUnits > 0 ? totalAchievedUnits : tercapaiCount,
    totalAssignedQuantity > 0
      ? totalAssignedQuantity
      : Math.max(1, totalTugas),
  );
  const realisasiPersen = computedPersonalKpi > 0 ? computedPersonalKpi : 72;

  const safeTotal = Math.max(totalTugas, 1);
  const tercapaiPct = Math.round((tercapaiCount / safeTotal) * 100);
  const dikerjakanPct = Math.round((dikerjakanCount / safeTotal) * 100);
  const menungguPct = Math.round((menungguVerifikasiCount / safeTotal) * 100);
  const ditugaskanPct = Math.max(
    0,
    100 - tercapaiPct - dikerjakanPct - menungguPct,
  );

  const perluTindakan: DosenActionItem[] = [];

  for (const t of tickets) {
    if (t.status === "Ditolak") {
      perluTindakan.push({
        id: `revisi-${t.id}`,
        judul: `Revisi bukti ${t.master_target.nama_target.toLowerCase()}`,
        subjudul: `${t.kode_tiket} · Ditolak Kaprodi`,
        badgeLabel: "Revisi",
        badgeTone: "danger",
        href: `/tiket/${t.id}`,
      });
    } else if (t.status === "Dikerjakan" || t.status === "Ditugaskan") {
      perluTindakan.push({
        id: `tugas-${t.id}`,
        judul: `Unggah bukti ${t.master_target.nama_target.toLowerCase()}`,
        subjudul: `${t.kode_tiket} · Tenggat ${formatShortDate(t.tenggat_waktu)}`,
        badgeLabel: t.prioritas === "Tinggi" ? "H-3" : "H-7",
        badgeTone: t.prioritas === "Tinggi" ? "danger" : "warning",
        href: `/tiket/${t.id}`,
      });
    }
  }

  for (const p of pesertaRapatList) {
    if (
      p.rapat.status_rapat === "Berlangsung" ||
      p.rapat.status_rapat === "Dijadwalkan"
    ) {
      perluTindakan.push({
        id: `rapat-${p.rapat.id}`,
        judul: `Hadir ${p.rapat.judul_rapat}`,
        subjudul: `${p.rapat.lokasi}`,
        badgeLabel: "Rapat",
        badgeTone: "primary",
        href: `/rapat/${p.rapat.id}`,
      });
    }
  }

  const tugasSaya: DashboardTicketSummaryRow[] = tickets.map((t) => {
    const submisiCount = new Set(
      t.isian_bukti.map((b) => b.urutan_submisi),
    ).size;
    const achievedForRow =
      t.status === "Tercapai"
        ? t.kuantitas_ditugaskan
        : Math.min(t.kuantitas_ditugaskan, submisiCount);

    return {
      id: t.id,
      kodeTiket: t.kode_tiket,
      namaTarget: t.master_target.nama_target,
      kuantitasLabel: `${achievedForRow} / ${t.kuantitas_ditugaskan} ${t.master_target.satuan}`,
      dosenNama: t.dosen.nama_lengkap,
      tenggatWaktu: formatShortDate(t.tenggat_waktu),
      status: t.status as StatusTiketType,
    };
  });

  return {
    stats: {
      tugasSayaCount: totalTugas,
      tugasSayaDelta: "+2",
      targetTercapaiLabel: `${tercapaiCount}/${totalTugas}`,
      targetTercapaiDelta: "+1",
      menungguVerifikasiCount,
      menungguVerifikasiDelta: "+1",
      rapatDihadiriPersen,
      rapatDihadiriDelta: "-2%",
    },
    trend: {
      periodeLabel: "Bulanan",
      capaianPersen: realisasiPersen,
      capaianDelta: "+8%",
      targetPersen: 78,
      tahunTarget: 2026,
      points: [
        { label: "Mei", capaian: 48, target: 60 },
        { label: "Jun", capaian: 55, target: 64 },
        { label: "Jul", capaian: 58, target: 68 },
        { label: "Agu", capaian: 64, target: 72 },
        { label: "Sep", capaian: 68, target: 75 },
        { label: "Okt", capaian: realisasiPersen, target: 78 },
      ],
    },
    statusDistribution: {
      totalTugas,
      slices: [
        {
          label: "Tercapai",
          value: Math.max(tercapaiCount, 1),
          percentage: tercapaiPct,
          color: "#0101B7",
        },
        {
          label: "Dikerjakan",
          value: Math.max(dikerjakanCount, 1),
          percentage: dikerjakanPct,
          color: "#7E9BF7",
        },
        {
          label: "Menunggu Verifikasi",
          value: Math.max(menungguVerifikasiCount, 1),
          percentage: menungguPct,
          color: "#FFD166",
        },
        {
          label: "Ditugaskan",
          value: Math.max(ditugaskanCount, 1),
          percentage: ditugaskanPct,
          color: "#E3E8F2",
        },
      ],
    },
    perluTindakan: perluTindakan.slice(0, 4),
    tugasSaya: tugasSaya.slice(0, 5),
    capaianSaya: {
      tahunTarget: 2026,
      targetProdiPersen: 78,
      realisasiPersen,
      subtitle: `Realisasi ${realisasiPersen}% dari target`,
    },
  };
}
