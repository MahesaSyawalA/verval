import {
  createNotifikasiSchema,
  type CreateNotifikasiInput,
  type MarkNotifikasiReadInput,
} from "../schemas/notifikasi.schema";
import type { NotifikasiItem, NotifikasiListResponse } from "../types";
import { broadcastNotifikasi } from "./notifikasi.realtime";
import {
  countUnreadNotifikasiByUserId,
  findNotifikasiByUserId,
  insertManyNotifikasiRecords,
  insertNotifikasiRecord,
  markAllNotifikasiReadInDb,
  markSingleNotifikasiReadInDb,
} from "./notifikasi.repository";

function mapNotifikasiRow(row: {
  id: string;
  tipe_notifikasi: string;
  judul_notifikasi: string;
  pesan: string;
  is_read: boolean;
  created_at: Date;
  user_id: string;
}): NotifikasiItem {
  return {
    id: row.id,
    tipeNotifikasi: row.tipe_notifikasi,
    judulNotifikasi: row.judul_notifikasi,
    pesan: row.pesan,
    isRead: row.is_read,
    createdAt: row.created_at.toISOString(),
    userId: row.user_id,
  };
}

export async function listUserNotifikasi(
  userId: string,
): Promise<NotifikasiListResponse> {
  const [rows, unreadCount] = await Promise.all([
    findNotifikasiByUserId(userId),
    countUnreadNotifikasiByUserId(userId),
  ]);

  return {
    items: rows.map(mapNotifikasiRow),
    unreadCount,
  };
}

export async function markUserNotifikasiRead(
  userId: string,
  input?: MarkNotifikasiReadInput,
): Promise<{ updatedCount: number; unreadCount: number }> {
  let updatedCount = 0;

  if (input?.notifikasiId && !input.markAll) {
    updatedCount = await markSingleNotifikasiReadInDb(
      input.notifikasiId,
      userId,
    );
  } else {
    updatedCount = await markAllNotifikasiReadInDb(userId);
  }

  const unreadCount = await countUnreadNotifikasiByUserId(userId);
  return { updatedCount, unreadCount };
}

export async function createEventNotifikasi(
  input: CreateNotifikasiInput,
): Promise<NotifikasiItem> {
  const validated = createNotifikasiSchema.parse(input);
  const created = await insertNotifikasiRecord(validated);
  await broadcastNotifikasi([validated]);
  return mapNotifikasiRow(created);
}

export async function createBulkEventNotifikasi(
  inputs: CreateNotifikasiInput[],
): Promise<{ count: number }> {
  const validated = inputs.map((item) => createNotifikasiSchema.parse(item));
  const result = await insertManyNotifikasiRecords(validated);
  await broadcastNotifikasi(validated);
  return result;
}
