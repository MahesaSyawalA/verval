import prisma from "@/lib/db";
import type { CreateNotifikasiInput } from "../schemas/notifikasi.schema";

export async function findNotifikasiByUserId(userId: string, limit = 20) {
  return prisma.notifikasi.findMany({
    where: { user_id: userId },
    orderBy: [{ is_read: "asc" }, { created_at: "desc" }],
    take: limit,
  });
}

export async function countUnreadNotifikasiByUserId(userId: string) {
  return prisma.notifikasi.count({
    where: {
      user_id: userId,
      is_read: false,
    },
  });
}

export async function markAllNotifikasiReadInDb(userId: string) {
  const result = await prisma.notifikasi.updateMany({
    where: {
      user_id: userId,
      is_read: false,
    },
    data: {
      is_read: true,
    },
  });
  return result.count;
}

export async function markSingleNotifikasiReadInDb(
  notifikasiId: string,
  userId: string,
) {
  const result = await prisma.notifikasi.updateMany({
    where: {
      id: notifikasiId,
      user_id: userId,
    },
    data: {
      is_read: true,
    },
  });
  return result.count;
}

export async function insertNotifikasiRecord(input: CreateNotifikasiInput) {
  return prisma.notifikasi.create({
    data: {
      user_id: input.userId,
      tipe_notifikasi: input.tipeNotifikasi,
      judul_notifikasi: input.judulNotifikasi,
      pesan: input.pesan,
      is_read: false,
    },
  });
}

export async function insertManyNotifikasiRecords(
  inputs: CreateNotifikasiInput[],
) {
  if (inputs.length === 0) return { count: 0 };
  return prisma.notifikasi.createMany({
    data: inputs.map((item) => ({
      user_id: item.userId,
      tipe_notifikasi: item.tipeNotifikasi,
      judul_notifikasi: item.judulNotifikasi,
      pesan: item.pesan,
      is_read: false,
    })),
  });
}
