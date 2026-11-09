import { getInitials } from "@/lib/utils";
import type { StatusTiketType } from "@/modules/tiket";
import type {
  DashboardTicketSummaryRow,
  DosenActionItem,
  DosenDashboardData,
  DosenRankingItem,
  KaprodiDashboardData,
} from "../types";
import {
  achievedUnits,
  activeDosenCountAt,
  attendancePercentAt,
  buildMonthlyTrend,
  countAt,
  deadlineBadge,
  endOfPreviousMonth,
  existingCountAt,
  formatSigned,
  kpiAt,
  shortDate,
  targetAt,
  type MetricTicket,
} from "./dashboard.metrics";
import {
  fetchAllTargetsAndTicketsForDashboard,
  fetchDosenPersonalDashboardRecords,
} from "./dashboard.repository";

type TicketRow = MetricTicket & {
  id: string;
  kode_tiket: string;
  prioritas: string;
  master_target: { nama_target: string; satuan: string };
  dosen: { nama_lengkap: string };
};

function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function toSummaryRow(t: TicketRow, now: Date): DashboardTicketSummaryRow {
  return {
    id: t.id,
    kodeTiket: t.kode_tiket,
    namaTarget: t.master_target.nama_target,
    kuantitasLabel: `${achievedUnits(t, now, now)} / ${t.kuantitas_ditugaskan} ${t.master_target.satuan}`,
    dosenNama: t.dosen.nama_lengkap,
    tenggatWaktu: shortDate(t.tenggat_waktu),
    status: t.status as StatusTiketType,
  };
}

export async function getKaprodiDashboardSummary(
  now: Date = new Date(),
): Promise<KaprodiDashboardData> {
  const { tickets: rawTickets, dosens } =
    await fetchAllTargetsAndTicketsForDashboard();
  const tickets = rawTickets as unknown as TicketRow[];
  const prevMonthEnd = endOfPreviousMonth(now);

  const totalTickets = tickets.length;
  const tercapaiCount = countAt(tickets, now, now, "Tercapai");
  const menungguVerifikasiCount = countAt(
    tickets,
    now,
    now,
    "Menunggu_Verifikasi",
  );
  const berjalanCount = countAt(tickets, now, now, "Dikerjakan");
  const belumTercapaiCount =
    countAt(tickets, now, now, "Ditugaskan") +
    countAt(tickets, now, now, "Ditolak");

  const capaianVsTargetPersen = kpiAt(tickets, now, now);
  const capaianDelta = formatSigned(
    capaianVsTargetPersen - kpiAt(tickets, prevMonthEnd, now),
    "%",
  );
  const targetPersen = targetAt(tickets, now);

  const activeDosenCount = activeDosenCountAt(tickets, now, now);
  const totalDosenCount = dosens.length;

  const tercapaiPct = percentOf(tercapaiCount, totalTickets);
  const berjalanPct = percentOf(berjalanCount, totalTickets);
  const menungguPct = percentOf(menungguVerifikasiCount, totalTickets);
  const belumPct =
    totalTickets > 0
      ? Math.max(0, 100 - tercapaiPct - berjalanPct - menungguPct)
      : 0;

  const dosenScores = dosens.map((d) => {
    const myTickets = tickets.filter((t) => t.dosen_id === d.id);
    return {
      dosenId: d.id,
      namaLengkap: d.nama_lengkap,
      tercapai: countAt(myTickets, now, now, "Tercapai"),
      berjalan:
        countAt(myTickets, now, now, "Dikerjakan") +
        countAt(myTickets, now, now, "Menunggu_Verifikasi"),
      total: myTickets.length,
      hasBukti: myTickets.some((t) => t.isian_bukti.length > 0),
      score: kpiAt(myTickets, now, now),
    };
  });

  const toRanking = (
    item: (typeof dosenScores)[number],
    keterangan: string,
  ): DosenRankingItem => ({
    dosenId: item.dosenId,
    namaLengkap: item.namaLengkap,
    inisial: getInitials(item.namaLengkap),
    keterangan,
    persentase: item.score,
  });

  const palingProduktif = [...dosenScores]
    .filter((item) => item.total > 0)
    .sort((a, b) => b.score - a.score || b.tercapai - a.tercapai)
    .slice(0, 3)
    .map((item) => toRanking(item, `${item.tercapai} target tercapai`));

  const perluDipantau = [...dosenScores]
    .sort((a, b) => a.score - b.score || a.tercapai - b.tercapai)
    .slice(0, 2)
    .map((item) =>
      toRanking(
        item,
        item.total === 0
          ? "Belum ada penugasan"
          : !item.hasBukti
            ? "Belum ada bukti"
            : `${item.berjalan} target berjalan`,
      ),
    );

  return {
    stats: {
      targetTercapaiLabel: `${tercapaiCount}/${totalTickets}`,
      targetTercapaiDelta: formatSigned(
        tercapaiCount - countAt(tickets, prevMonthEnd, now, "Tercapai"),
      ),
      capaianVsTargetPersen,
      capaianDelta,
      menungguVerifikasiCount,
      menungguVerifikasiDelta: formatSigned(
        menungguVerifikasiCount -
          countAt(tickets, prevMonthEnd, now, "Menunggu_Verifikasi"),
      ),
      dosenAktifLabel: `${activeDosenCount}/${totalDosenCount}`,
      dosenAktifDelta: formatSigned(
        activeDosenCount - activeDosenCountAt(tickets, prevMonthEnd, now),
      ),
    },
    trend: {
      periodeLabel: "Bulanan",
      capaianPersen: capaianVsTargetPersen,
      capaianDelta,
      targetPersen,
      tahunTarget: now.getFullYear(),
      points: buildMonthlyTrend(tickets, tickets, now),
    },
    statusDistribution: {
      totalTarget: totalTickets,
      slices: [
        {
          label: "Tercapai",
          value: tercapaiCount,
          percentage: tercapaiPct,
          color: "#0101B7",
        },
        {
          label: "Berjalan",
          value: berjalanCount,
          percentage: berjalanPct,
          color: "#7E9BF7",
        },
        {
          label: "Menunggu Verifikasi",
          value: menungguVerifikasiCount,
          percentage: menungguPct,
          color: "#FFD166",
        },
        {
          label: "Belum Tercapai",
          value: belumTercapaiCount,
          percentage: belumPct,
          color: "#E3E8F2",
        },
      ],
    },
    peringkatDosen: {
      palingProduktif,
      perluDipantau,
    },
    tiketTerbaru: tickets.slice(0, 5).map((t) => toSummaryRow(t, now)),
    capaianProdi: {
      tahunTarget: now.getFullYear(),
      targetPersen,
      realisasiPersen: capaianVsTargetPersen,
      subtitle: `Target ${targetPersen}% · ${capaianDelta}`,
    },
  };
}

export async function getDosenDashboardSummary(
  dosenId: string,
  now: Date = new Date(),
): Promise<DosenDashboardData> {
  const {
    tickets: rawTickets,
    pesertaRapatList,
    prodiTickets,
  } = await fetchDosenPersonalDashboardRecords(dosenId);
  const tickets = rawTickets as unknown as TicketRow[];
  const prevMonthEnd = endOfPreviousMonth(now);

  const totalTugas = existingCountAt(tickets, now, now);
  const tercapaiCount = countAt(tickets, now, now, "Tercapai");
  const dikerjakanCount = countAt(tickets, now, now, "Dikerjakan");
  const menungguVerifikasiCount = countAt(
    tickets,
    now,
    now,
    "Menunggu_Verifikasi",
  );
  const ditugaskanCount =
    countAt(tickets, now, now, "Ditugaskan") +
    countAt(tickets, now, now, "Ditolak");

  const kehadiran = pesertaRapatList.map((p) => ({
    tanggal: p.rapat.tanggal,
    hadir: p.status_kehadiran === "Hadir",
  }));
  const rapatDihadiriPersen = attendancePercentAt(kehadiran, now);
  const rapatDihadiriDelta = formatSigned(
    rapatDihadiriPersen - attendancePercentAt(kehadiran, prevMonthEnd),
    "%",
  );

  const realisasiPersen = kpiAt(tickets, now, now);
  const capaianDelta = formatSigned(
    realisasiPersen - kpiAt(tickets, prevMonthEnd, now),
    "%",
  );
  const targetSayaPersen = targetAt(tickets, now);
  const targetProdiPersen = targetAt(prodiTickets, now);

  const tercapaiPct = percentOf(tercapaiCount, totalTugas);
  const dikerjakanPct = percentOf(dikerjakanCount, totalTugas);
  const menungguPct = percentOf(menungguVerifikasiCount, totalTugas);
  const ditugaskanPct =
    totalTugas > 0
      ? Math.max(0, 100 - tercapaiPct - dikerjakanPct - menungguPct)
      : 0;

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
      const badge = deadlineBadge(t.tenggat_waktu, now);
      perluTindakan.push({
        id: `tugas-${t.id}`,
        judul: `Unggah bukti ${t.master_target.nama_target.toLowerCase()}`,
        subjudul: `${t.kode_tiket} · Tenggat ${shortDate(t.tenggat_waktu)}`,
        badgeLabel: badge.label,
        badgeTone: badge.tone,
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

  return {
    stats: {
      tugasSayaCount: totalTugas,
      tugasSayaDelta: formatSigned(
        totalTugas - existingCountAt(tickets, prevMonthEnd, now),
      ),
      targetTercapaiLabel: `${tercapaiCount}/${totalTugas}`,
      targetTercapaiDelta: formatSigned(
        tercapaiCount - countAt(tickets, prevMonthEnd, now, "Tercapai"),
      ),
      menungguVerifikasiCount,
      menungguVerifikasiDelta: formatSigned(
        menungguVerifikasiCount -
          countAt(tickets, prevMonthEnd, now, "Menunggu_Verifikasi"),
      ),
      rapatDihadiriPersen,
      rapatDihadiriDelta,
    },
    trend: {
      periodeLabel: "Bulanan",
      capaianPersen: realisasiPersen,
      capaianDelta,
      targetPersen: targetSayaPersen,
      tahunTarget: now.getFullYear(),
      points: buildMonthlyTrend(tickets, tickets, now),
    },
    statusDistribution: {
      totalTugas,
      slices: [
        {
          label: "Tercapai",
          value: tercapaiCount,
          percentage: tercapaiPct,
          color: "#0101B7",
        },
        {
          label: "Dikerjakan",
          value: dikerjakanCount,
          percentage: dikerjakanPct,
          color: "#7E9BF7",
        },
        {
          label: "Menunggu Verifikasi",
          value: menungguVerifikasiCount,
          percentage: menungguPct,
          color: "#FFD166",
        },
        {
          label: "Ditugaskan",
          value: ditugaskanCount,
          percentage: ditugaskanPct,
          color: "#E3E8F2",
        },
      ],
    },
    perluTindakan: perluTindakan.slice(0, 4),
    tugasSaya: tickets.slice(0, 5).map((t) => toSummaryRow(t, now)),
    capaianSaya: {
      tahunTarget: now.getFullYear(),
      targetProdiPersen,
      realisasiPersen,
      subtitle: `Realisasi ${realisasiPersen}% dari target`,
    },
  };
}
