import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const DEMO_PASSWORD =
  process.env.DEMO_USER_PASSWORD || "RplCibiru2026!";

function timeOfDay(hours: number, minutes: number): Date {
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

export async function runSeed(client: PrismaClient = prisma) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Clean existing records in reverse dependency order
  await client.notifikasi.deleteMany();
  await client.dokumentasi.deleteMany();
  await client.notulensi.deleteMany();
  await client.peserta_rapat.deleteMany();
  await client.rapat.deleteMany();
  await client.riwayat_tiket.deleteMany();
  await client.isian_bukti.deleteMany();
  await client.tiket_penugasan.deleteMany();
  await client.format_bukti.deleteMany();
  await client.master_target.deleteMany();
  await client.users.deleteMany();

  // 1. Seed Users (Kaprodi, Dosen, Admin)
  const kaprodi = await client.users.create({
    data: {
      nip: "198204152008121002",
      nama_lengkap: "Dr. Iqbal Al-Farisi, M.Kom.",
      email: "iqbal@upi.edu",
      role: "Kaprodi",
      password: passwordHash,
    },
  });

  const indira = await client.users.create({
    data: {
      nip: "199008212018032001",
      nama_lengkap: "Indira Nareswari Syawanodya, M.T.",
      email: "indira@upi.edu",
      role: "Dosen",
      password: passwordHash,
    },
  });

  const dian = await client.users.create({
    data: {
      nip: "198803122015042001",
      nama_lengkap: "Dian Anggraini, M.T.",
      email: "dian.anggraini@upi.edu",
      role: "Dosen",
      password: passwordHash,
    },
  });

  const raditya = await client.users.create({
    data: {
      nip: "198907192016031002",
      nama_lengkap: "Raditya Muhammad, S.T., M.T.",
      email: "raditya@upi.edu",
      role: "Dosen",
      password: passwordHash,
    },
  });

  const yulia = await client.users.create({
    data: {
      nip: "198711042014042001",
      nama_lengkap: "Yulia Retnowati, S.Pd., M.T.",
      email: "yulia.retnowati@upi.edu",
      role: "Dosen",
      password: passwordHash,
    },
  });

  const budi = await client.users.create({
    data: {
      nip: "199102142019031003",
      nama_lengkap: "Budi Santoso, M.Kom.",
      email: "budi.santoso@upi.edu",
      role: "Dosen",
      password: passwordHash,
    },
  });

  const dewi = await client.users.create({
    data: {
      nip: "199205282020122004",
      nama_lengkap: "Dewi Lestari, M.T.",
      email: "dewi.lestari@upi.edu",
      role: "Dosen",
      password: passwordHash,
    },
  });

  const asyifa = await client.users.create({
    data: {
      nip: "199309152021032002",
      nama_lengkap: "Asyifa Imanda Septiani, M.Kom.",
      email: "asyifa@upi.edu",
      role: "Dosen",
      password: passwordHash,
    },
  });

  const siti = await client.users.create({
    data: {
      nip: "199401222022032001",
      nama_lengkap: "Siti Rahma, M.T.",
      email: "siti.rahma@upi.edu",
      role: "Dosen",
      password: passwordHash,
    },
  });

  const admin = await client.users.create({
    data: {
      nip: "199501102020121003",
      nama_lengkap: "Admin Prodi RPL",
      email: "admin.rpl@upi.edu",
      role: "Admin",
      password: passwordHash,
    },
  });

  // 2. Seed Master Target & Format Bukti (T-01 .. T-05)
  const targetT01 = await client.master_target.create({
    data: {
      kode_target: "T-01",
      nama_target: "Publikasi artikel di jurnal terakreditasi",
      kuantitas_total: 5,
      satuan: "Artikel",
      tahun: 2026,
      format_bukti: {
        create: [
          { nama_field: "Judul", tipe_data: "Teks", status_isian: "Wajib" },
          { nama_field: "Jurnal", tipe_data: "Teks", status_isian: "Wajib" },
          { nama_field: "Tautan", tipe_data: "Tautan", status_isian: "Wajib" },
        ],
      },
    },
    include: { format_bukti: true },
  });

  const targetT02 = await client.master_target.create({
    data: {
      kode_target: "T-02",
      nama_target: "Pengabdian kepada masyarakat",
      kuantitas_total: 2,
      satuan: "Kegiatan",
      tahun: 2026,
      format_bukti: {
        create: [
          { nama_field: "Lokasi", tipe_data: "Teks", status_isian: "Wajib" },
          { nama_field: "Tanggal", tipe_data: "Tanggal", status_isian: "Wajib" },
          { nama_field: "Surat tugas", tipe_data: "File", status_isian: "Wajib" },
        ],
      },
    },
    include: { format_bukti: true },
  });

  const targetT03 = await client.master_target.create({
    data: {
      kode_target: "T-03",
      nama_target: "Kehadiran rapat koordinasi (terhubung Modul 2)",
      kuantitas_total: 12,
      satuan: "Rapat",
      tahun: 2026,
      format_bukti: {
        create: [
          { nama_field: "Rapat", tipe_data: "Teks", status_isian: "Wajib" },
          { nama_field: "Absensi", tipe_data: "File", status_isian: "Opsional" },
        ],
      },
    },
    include: { format_bukti: true },
  });

  const targetT04 = await client.master_target.create({
    data: {
      kode_target: "T-04",
      nama_target: "Pembimbingan tugas akhir mahasiswa",
      kuantitas_total: 20,
      satuan: "Mahasiswa",
      tahun: 2026,
      format_bukti: {
        create: [
          { nama_field: "Nama", tipe_data: "Teks", status_isian: "Wajib" },
          { nama_field: "NIM", tipe_data: "Teks", status_isian: "Wajib" },
          { nama_field: "Laporan", tipe_data: "File", status_isian: "Wajib" },
        ],
      },
    },
    include: { format_bukti: true },
  });

  const targetT05 = await client.master_target.create({
    data: {
      kode_target: "T-05",
      nama_target: "Pelatihan dan sertifikasi dosen",
      kuantitas_total: 2,
      satuan: "Sertifikat",
      tahun: 2026,
      format_bukti: {
        create: [
          { nama_field: "Nama", tipe_data: "Teks", status_isian: "Wajib" },
          { nama_field: "Tanggal", tipe_data: "Tanggal", status_isian: "Wajib" },
          { nama_field: "File", tipe_data: "File", status_isian: "Wajib" },
        ],
      },
    },
    include: { format_bukti: true },
  });

  // 3. Seed Tiket Penugasan across all statuses (Ditugaskan, Dikerjakan, Menunggu_Verifikasi, Tercapai, Ditolak)
  const tiket014 = await client.tiket_penugasan.create({
    data: {
      kode_tiket: "#TGT-014",
      target_id: targetT01.id,
      dosen_id: indira.id,
      kuantitas_ditugaskan: 5,
      tenggat_waktu: new Date("2026-11-30"),
      prioritas: "Tinggi",
      is_reminder_active: true,
      status: "Menunggu_Verifikasi",
      isian_bukti: {
        create: [
          {
            format_bukti_id: targetT01.format_bukti[0].id,
            urutan_submisi: 1,
            nilai_isian: "Automated Software Verification on Microservices",
          },
          {
            format_bukti_id: targetT01.format_bukti[1].id,
            urutan_submisi: 1,
            nilai_isian: "Jurnal Rekayasa Perangkat Lunak Indonesia (SINTA 2)",
          },
          {
            format_bukti_id: targetT01.format_bukti[2].id,
            urutan_submisi: 1,
            nilai_isian: "https://doi.org/10.17509/jrpli.v4i2.2026",
          },
        ],
      },
      riwayat_tiket: {
        create: [
          { status_riwayat: "Ditugaskan", aktor_id: kaprodi.id },
          { status_riwayat: "Dikerjakan", aktor_id: indira.id },
          { status_riwayat: "Menunggu Verifikasi", aktor_id: indira.id },
        ],
      },
    },
  });

  const tiket009 = await client.tiket_penugasan.create({
    data: {
      kode_tiket: "#TGT-009",
      target_id: targetT03.id,
      dosen_id: dian.id,
      kuantitas_ditugaskan: 1,
      tenggat_waktu: new Date("2026-10-15"),
      prioritas: "Normal",
      is_reminder_active: true,
      status: "Tercapai",
      catatan_kaprodi: "Kehadiran rapat koordinasi telah diverifikasi lengkap.",
      isian_bukti: {
        create: [
          {
            format_bukti_id: targetT03.format_bukti[0].id,
            urutan_submisi: 1,
            nilai_isian: "Rapat Koordinasi Kurikulum 21 Okt 2026",
          },
        ],
      },
      riwayat_tiket: {
        create: [
          { status_riwayat: "Ditugaskan", aktor_id: kaprodi.id },
          { status_riwayat: "Dikerjakan", aktor_id: dian.id },
          { status_riwayat: "Menunggu Verifikasi", aktor_id: dian.id },
          { status_riwayat: "Tercapai", aktor_id: kaprodi.id },
        ],
      },
    },
  });

  const tiket021 = await client.tiket_penugasan.create({
    data: {
      kode_tiket: "#TGT-021",
      target_id: targetT02.id,
      dosen_id: raditya.id,
      kuantitas_ditugaskan: 2,
      tenggat_waktu: new Date("2026-12-20"),
      prioritas: "Normal",
      is_reminder_active: true,
      status: "Dikerjakan",
      riwayat_tiket: {
        create: [
          { status_riwayat: "Ditugaskan", aktor_id: kaprodi.id },
          { status_riwayat: "Dikerjakan", aktor_id: raditya.id },
        ],
      },
    },
  });

  const tiket017 = await client.tiket_penugasan.create({
    data: {
      kode_tiket: "#TGT-017",
      target_id: targetT04.id,
      dosen_id: asyifa.id,
      kuantitas_ditugaskan: 20,
      tenggat_waktu: new Date("2026-12-31"),
      prioritas: "Normal",
      is_reminder_active: true,
      status: "Ditugaskan",
      riwayat_tiket: {
        create: [{ status_riwayat: "Ditugaskan", aktor_id: kaprodi.id }],
      },
    },
  });

  const tiket005 = await client.tiket_penugasan.create({
    data: {
      kode_tiket: "#TGT-005",
      target_id: targetT05.id,
      dosen_id: indira.id,
      kuantitas_ditugaskan: 2,
      tenggat_waktu: new Date("2026-11-05"),
      prioritas: "Tinggi",
      is_reminder_active: true,
      status: "Ditolak",
      catatan_kaprodi:
        "Lampiran sertifikat belum mencantumkan nomor registrasi resmi penyelenggara. Mohon unggah ulang berkas PDF asli.",
      isian_bukti: {
        create: [
          {
            format_bukti_id: targetT05.format_bukti[0].id,
            urutan_submisi: 1,
            nilai_isian: "Sertifikasi Cloud Architecture Associate",
          },
          {
            format_bukti_id: targetT05.format_bukti[1].id,
            urutan_submisi: 1,
            nilai_isian: "2026-10-12",
          },
          {
            format_bukti_id: targetT05.format_bukti[2].id,
            urutan_submisi: 1,
            nilai_isian: "bukti/sertifikat-indira-draft.pdf",
          },
        ],
      },
      riwayat_tiket: {
        create: [
          { status_riwayat: "Ditugaskan", aktor_id: kaprodi.id },
          { status_riwayat: "Dikerjakan", aktor_id: indira.id },
          { status_riwayat: "Menunggu Verifikasi", aktor_id: indira.id },
          { status_riwayat: "Ditolak", aktor_id: kaprodi.id },
        ],
      },
    },
  });

  // Additional tickets for Indira so her personal dashboard has every status
  await client.tiket_penugasan.create({
    data: {
      kode_tiket: "#TGT-018",
      target_id: targetT02.id,
      dosen_id: indira.id,
      kuantitas_ditugaskan: 2,
      tenggat_waktu: new Date("2026-10-26"),
      prioritas: "Tinggi",
      is_reminder_active: true,
      status: "Dikerjakan",
      riwayat_tiket: {
        create: [
          { status_riwayat: "Ditugaskan", aktor_id: kaprodi.id },
          { status_riwayat: "Dikerjakan", aktor_id: indira.id },
        ],
      },
    },
  });

  await client.tiket_penugasan.create({
    data: {
      kode_tiket: "#TGT-012",
      target_id: targetT03.id,
      dosen_id: indira.id,
      kuantitas_ditugaskan: 12,
      tenggat_waktu: new Date("2026-12-31"),
      prioritas: "Normal",
      is_reminder_active: true,
      status: "Tercapai",
      riwayat_tiket: {
        create: [
          { status_riwayat: "Ditugaskan", aktor_id: kaprodi.id },
          { status_riwayat: "Dikerjakan", aktor_id: indira.id },
          { status_riwayat: "Menunggu Verifikasi", aktor_id: indira.id },
          { status_riwayat: "Tercapai", aktor_id: kaprodi.id },
        ],
      },
    },
  });

  // 4. Seed Rapat, Peserta Rapat, Notulensi, Dokumentasi (Modul 2)
  const allLecturers = [
    kaprodi,
    indira,
    dian,
    raditya,
    yulia,
    budi,
    dewi,
    asyifa,
    siti,
  ];

  // Rapat 1: Selesai & UANG Lengkap
  const rapatKurikulum = await client.rapat.create({
    data: {
      judul_rapat: "Rapat Koordinasi Kurikulum",
      notulis_id: siti.id,
      tanggal: new Date("2026-10-21"),
      waktu_mulai: timeOfDay(9, 0),
      waktu_selesai: timeOfDay(9, 45),
      format: "Luring",
      lokasi: "Ruang Sidang A",
      deskripsi_agenda:
        "Koordinasi pemetaan CPL dan RPS mata kuliah semester ganjil Prodi RPL.",
      kode_presensi: "RPL101",
      is_reminder_active: true,
      metode_undangan: "Generate_Otomatis",
      file_undangan: "undangan/undangan-rapat-koordinasi-kurikulum.pdf",
      status_rapat: "Selesai",
      peserta_rapat: {
        create: allLecturers.slice(0, 8).map((u) => ({
          dosen_id: u.id,
          status_kehadiran: "Hadir",
          waktu_presensi: new Date("2026-10-21T09:05:00Z"),
          metode_presensi: "Kode",
        })),
      },
      notulensi: {
        create: {
          agenda_pembahasan:
            "1. Evaluasi CPL kurikulum 2026\n2. Penyelarasan RPS mata kuliah inti RPL",
          hal_dibahas:
            "Seluruh koordinator rumpun mata kuliah memaparkan pembaruan bahan ajar dan asesmen berbasis proyek.",
          keputusan:
            "RPS semester ganjil disahkan dan wajib diunggah ke portal akademik sebelum pekan perkuliahan kedua.",
          tindak_lanjut:
            "Tim pengembang kurikulum melakukan verifikasi dokumen RPS per mata kuliah.",
          file_lampiran: "lampiran/materi-kurikulum-rpl-2026.pdf",
          status_notulensi: "Final",
          dibuat_oleh: siti.id,
        },
      },
      dokumentasi: {
        create: [
          {
            file_gambar: "dokumentasi/rapat-kurikulum-1.jpg",
            caption: "Suasana diskusi penyelarasan RPS di Ruang Sidang A",
          },
          {
            file_gambar: "dokumentasi/rapat-kurikulum-2.jpg",
            caption: "Sesi pemaparan CPL oleh Kaprodi RPL",
          },
        ],
      },
    },
  });

  // Rapat 2: Berlangsung (Indira sebagai Notulis, Draf notulensi sesuai mockup Editor Notulensi)
  const rapatEvaluasi = await client.rapat.create({
    data: {
      judul_rapat: "Evaluasi Kinerja Dosen Semester Ganjil",
      notulis_id: indira.id,
      tanggal: new Date("2026-10-21"),
      waktu_mulai: timeOfDay(13, 0),
      waktu_selesai: timeOfDay(14, 30),
      format: "Luring",
      lokasi: "Ruang Sidang B",
      deskripsi_agenda:
        "Evaluasi capaian publikasi, pengabdian, dan bimbingan tugas akhir semester ganjil.",
      kode_presensi: "RPL202",
      is_reminder_active: true,
      metode_undangan: "Generate_Otomatis",
      file_undangan: "undangan/undangan-evaluasi-kinerja-ganjil.pdf",
      status_rapat: "Berlangsung",
      peserta_rapat: {
        create: allLecturers.map((u, idx) => ({
          dosen_id: u.id,
          status_kehadiran: idx < 8 ? "Hadir" : "Belum_Hadir",
          waktu_presensi:
            idx < 8 ? new Date("2026-10-21T13:04:00Z") : null,
          metode_presensi: idx < 8 ? "Kode" : null,
        })),
      },
      notulensi: {
        create: {
          agenda_pembahasan:
            "1. Evaluasi capaian kinerja dosen semester ganjil\n2. Kendala pengumpulan bukti kegiatan\n3. Rencana tindak lanjut",
          hal_dibahas:
            "Capaian publikasi baru 4 dari 5 artikel. Beberapa dosen belum mengunggah surat tugas pengabdian dan perlu waktu tambahan.",
          keputusan:
            "Batas unggah bukti kegiatan diperpanjang sampai 30 Nov 2026.",
          tindak_lanjut:
            "Kaprodi mengirim pengingat ke dosen yang belum mengunggah bukti.",
          status_notulensi: "Draf",
          dibuat_oleh: indira.id,
        },
      },
    },
  });

  // Rapat 3: Dijadwalkan
  await client.rapat.create({
    data: {
      judul_rapat: "Pembahasan Penugasan Pengabdian",
      notulis_id: indira.id,
      tanggal: new Date("2026-10-21"),
      waktu_mulai: timeOfDay(15, 30),
      waktu_selesai: timeOfDay(16, 30),
      format: "Daring",
      lokasi: "Zoom Meeting Prodi RPL",
      deskripsi_agenda:
        "Pembagian skema pengabdian kepada masyarakat desa binaan Kampus UPI Cibiru.",
      kode_presensi: "RPL303",
      is_reminder_active: true,
      metode_undangan: "Generate_Otomatis",
      file_undangan: "undangan/undangan-penugasan-pengabdian.pdf",
      status_rapat: "Dijadwalkan",
      peserta_rapat: {
        create: allLecturers.slice(0, 6).map((u) => ({
          dosen_id: u.id,
          status_kehadiran: "Belum_Hadir",
        })),
      },
    },
  });

  // Rapat 4: Selesai tetapi Dokumentasi Gambar (G) belum lengkap (sesuai mockup Arsip Rapat)
  await client.rapat.create({
    data: {
      judul_rapat: "Rapat Penjaminan Mutu",
      notulis_id: budi.id,
      tanggal: new Date("2026-10-14"),
      waktu_mulai: timeOfDay(10, 0),
      waktu_selesai: timeOfDay(11, 30),
      format: "Luring",
      lokasi: "Ruang Sidang A",
      deskripsi_agenda: "Tinjauan manajemen mutu dan persiapan AMI Prodi RPL.",
      kode_presensi: "RPL404",
      is_reminder_active: false,
      metode_undangan: "Upload_Manual",
      file_undangan: "undangan/undangan-penjaminan-mutu.docx",
      status_rapat: "Selesai",
      peserta_rapat: {
        create: allLecturers.map((u) => ({
          dosen_id: u.id,
          status_kehadiran: "Hadir",
          waktu_presensi: new Date("2026-10-14T10:02:00Z"),
          metode_presensi: "Scan_QR",
        })),
      },
      notulensi: {
        create: {
          agenda_pembahasan: "Persiapan dokumen Audit Mutu Internal (AMI).",
          hal_dibahas: "Pemeriksaan kelengkapan berita acara perkuliahan dan portofolio dosen.",
          keputusan: "Seluruh koordinator menyerahkan berkas AMI paling lambat 25 Oktober 2026.",
          tindak_lanjut: "Gugus kendali mutu prodi melakukan review berkas mingguan.",
          status_notulensi: "Final",
          dibuat_oleh: budi.id,
        },
      },
    },
  });

  // 5. Seed Notifikasi (sesuai mockup Dropdown Notifikasi.png)
  await client.notifikasi.createMany({
    data: [
      {
        user_id: kaprodi.id,
        tipe_notifikasi: "RAPAT_PENGINGAT_1J",
        judul_notifikasi: "Rapat dimulai 1 jam lagi",
        pesan: "Evaluasi Kinerja Dosen · 13:00 · Ruang Sidang B",
        is_read: false,
      },
      {
        user_id: kaprodi.id,
        tipe_notifikasi: "RAPAT_PENGINGAT_H1",
        judul_notifikasi: "Besok ada rapat",
        pesan: "Rapat Penjaminan Mutu · Kam 22 Okt, 08:30",
        is_read: false,
      },
      {
        user_id: kaprodi.id,
        tipe_notifikasi: "UNDANGAN_BARU",
        judul_notifikasi: "Undangan rapat baru",
        pesan: "Rapat Evaluasi Pengabdian · Rab 28 Okt, 10:00",
        is_read: true,
      },
      {
        user_id: kaprodi.id,
        tipe_notifikasi: "NOTULENSI_FINAL",
        judul_notifikasi: "Notulensi tersedia",
        pesan: "Rapat Koordinasi Kurikulum · baca di arsip",
        is_read: true,
      },
      {
        user_id: indira.id,
        tipe_notifikasi: "RAPAT_PENGINGAT_1J",
        judul_notifikasi: "Rapat dimulai 1 jam lagi",
        pesan: "Evaluasi Kinerja Dosen · 13:00 · Ruang Sidang B",
        is_read: false,
      },
      {
        user_id: indira.id,
        tipe_notifikasi: "TIKET_DITOLAK",
        judul_notifikasi: "Revisi bukti diperlukan",
        pesan: "Tiket #TGT-005 Pelatihan dan sertifikasi ditolak Kaprodi",
        is_read: false,
      },
    ],
  });

  return {
    usersCount: allLecturers.length + 1,
    targetsCount: 5,
    ticketsCount: 7,
    meetingsCount: 4,
    sampleIds: {
      kaprodiId: kaprodi.id,
      indiraId: indira.id,
      adminId: admin.id,
      tiket014Id: tiket014.id,
      tiket009Id: tiket009.id,
      tiket021Id: tiket021.id,
      tiket017Id: tiket017.id,
      tiket005Id: tiket005.id,
      rapatKurikulumId: rapatKurikulum.id,
      rapatEvaluasiId: rapatEvaluasi.id,
    },
  };
}

if (require.main === module) {
  runSeed()
    .then((summary) => {
      console.log("✅ Database seed selesai:", summary);
    })
    .catch((err) => {
      console.error("❌ Gagal menjalankan seed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
