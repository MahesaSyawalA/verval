import type { UserRole } from "@/config/roles";
import { AppError } from "@/lib/http";
import { createEventNotifikasi } from "@/modules/notifikasi/server/notifikasi.service";
import type {
  CreateTiketInput,
  SubmitBuktiInput,
  VerifyTiketInput,
} from "../schemas/tiket.schema";
import type {
  DosenOption,
  StatusTiketType,
  TicketFilterParams,
  TicketItem,
} from "../types";
import {
  appendAttendanceBuktiToTargetT03,
  countTotalTickets,
  findAllTickets,
  findDosenOptions,
  findTicketById,
  insertTicketRecord,
  saveTicketBuktiAndStatus,
  updateTicketStatusWithHistory,
} from "./tiket.repository";

/**
 * Aturan bisnis 1 (Spec Bagian 8):
 * Ditugaskan -> Dikerjakan -> Menunggu_Verifikasi -> Tercapai | Ditolak
 * Ditolak -> Menunggu_Verifikasi (revisi bukti)
 */
export const VALID_TICKET_TRANSITIONS: Record<
  StatusTiketType,
  readonly StatusTiketType[]
> = {
  Ditugaskan: ["Dikerjakan"],
  Dikerjakan: ["Menunggu_Verifikasi"],
  Menunggu_Verifikasi: ["Tercapai", "Ditolak"],
  Ditolak: ["Menunggu_Verifikasi", "Dikerjakan"],
  Tercapai: [],
};

export function canTransitionTicketStatus(
  from: StatusTiketType,
  to: StatusTiketType,
): boolean {
  return VALID_TICKET_TRANSITIONS[from]?.includes(to) ?? false;
}

export function generateTicketCode(sequenceNumber: number): string {
  return `#TGT-${String(sequenceNumber).padStart(3, "0")}`;
}

export interface TiketRepositoryDeps {
  findAll: typeof findAllTickets;
  findById: typeof findTicketById;
  findDosens: typeof findDosenOptions;
  countTickets: typeof countTotalTickets;
  insert: typeof insertTicketRecord;
  updateStatus: typeof updateTicketStatusWithHistory;
  saveBukti: typeof saveTicketBuktiAndStatus;
  appendAttendanceT03?: typeof appendAttendanceBuktiToTargetT03;
  notifyEvent?: typeof createEventNotifikasi;
}

const defaultDeps: TiketRepositoryDeps = {
  findAll: findAllTickets,
  findById: findTicketById,
  findDosens: findDosenOptions,
  countTickets: countTotalTickets,
  insert: insertTicketRecord,
  updateStatus: updateTicketStatusWithHistory,
  saveBukti: saveTicketBuktiAndStatus,
  appendAttendanceT03: appendAttendanceBuktiToTargetT03,
  notifyEvent: createEventNotifikasi,
};

export async function listTicketsForUser(
  actor: { id: string; role: UserRole },
  filter?: TicketFilterParams,
  deps: TiketRepositoryDeps = defaultDeps,
): Promise<TicketItem[]> {
  const effectiveFilter: TicketFilterParams = {
    ...filter,
    ...(actor.role === "Dosen" ? { dosenId: actor.id } : {}),
  };

  return deps.findAll(effectiveFilter);
}

export async function listDosenOptions(
  deps: TiketRepositoryDeps = defaultDeps,
): Promise<DosenOption[]> {
  return deps.findDosens();
}

export async function getTicketDetailForUser(
  ticketId: string,
  actor: { id: string; role: UserRole },
  deps: TiketRepositoryDeps = defaultDeps,
): Promise<TicketItem> {
  const ticket = await deps.findById(ticketId);
  if (!ticket) {
    throw new AppError("NOT_FOUND", "Tiket penugasan tidak ditemukan.", 404);
  }

  if (actor.role === "Dosen" && ticket.dosenId !== actor.id) {
    throw new AppError(
      "FORBIDDEN",
      "Anda hanya dapat mengakses tiket penugasan milik Anda sendiri.",
      403,
    );
  }

  return ticket;
}

export async function createTicketAssignment(
  input: CreateTiketInput,
  aktorId: string,
  deps: TiketRepositoryDeps = defaultDeps,
): Promise<TicketItem> {
  const currentCount = await deps.countTickets();
  const kodeTiket = generateTicketCode(currentCount + 22);
  const created = await deps.insert(input, kodeTiket, aktorId);

  if (deps.notifyEvent) {
    try {
      await deps.notifyEvent({
        userId: created.dosenId,
        tipeNotifikasi: "TIKET_BARU",
        judulNotifikasi: "Penugasan target baru",
        pesan: `Tiket ${created.kodeTiket} ${created.namaTarget} telah ditugaskan kepada Anda.`,
      });
    } catch {
      // Non-fatal notification failure
    }
  }

  return created;
}

export async function transitionTicketStatus(
  ticketId: string,
  nextStatus: StatusTiketType,
  actor: { id: string; role: UserRole },
  catatanKaprodi?: string,
  deps: TiketRepositoryDeps = defaultDeps,
): Promise<TicketItem> {
  const ticket = await getTicketDetailForUser(ticketId, actor, deps);

  if (!canTransitionTicketStatus(ticket.status, nextStatus)) {
    throw new AppError(
      "CONFLICT",
      `Transisi status tiket dari "${ticket.status.replace(/_/g, " ")}" ke "${nextStatus.replace(/_/g, " ")}" tidak diizinkan.`,
      409,
    );
  }

  if (
    (nextStatus === "Tercapai" || nextStatus === "Ditolak") &&
    actor.role !== "Kaprodi" &&
    actor.role !== "Admin"
  ) {
    throw new AppError(
      "FORBIDDEN",
      "Hanya Kaprodi yang dapat memverifikasi tiket penugasan.",
      403,
    );
  }

  return deps.updateStatus(ticketId, nextStatus, actor.id, catatanKaprodi);
}

export async function submitTicketBukti(
  ticketId: string,
  input: SubmitBuktiInput,
  actor: { id: string; role: UserRole },
  deps: TiketRepositoryDeps = defaultDeps,
): Promise<TicketItem> {
  const ticket = await getTicketDetailForUser(ticketId, actor, deps);

  if (actor.role === "Dosen" && ticket.dosenId !== actor.id) {
    throw new AppError(
      "FORBIDDEN",
      "Anda hanya dapat mengunggah bukti untuk tiket milik Anda sendiri.",
      403,
    );
  }

  if (ticket.status === "Tercapai") {
    throw new AppError(
      "CONFLICT",
      "Tiket yang sudah berstatus Tercapai tidak dapat diubah lagi.",
      409,
    );
  }

  let nextStatus: StatusTiketType;
  const historyToRecord: string[] = [];

  if (input.action === "draft") {
    if (ticket.status === "Ditugaskan") {
      nextStatus = "Dikerjakan";
      historyToRecord.push("Dikerjakan");
    } else if (ticket.status === "Dikerjakan" || ticket.status === "Ditolak") {
      nextStatus = ticket.status;
    } else {
      throw new AppError(
        "CONFLICT",
        `Tidak dapat menyimpan draf saat tiket berstatus "${ticket.status.replace(/_/g, " ")}".`,
        409,
      );
    }
  } else {
    // action === "submit" -> Menunggu_Verifikasi
    if (ticket.status === "Ditugaskan") {
      nextStatus = "Menunggu_Verifikasi";
      historyToRecord.push("Dikerjakan", "Menunggu Verifikasi");
    } else if (ticket.status === "Dikerjakan" || ticket.status === "Ditolak") {
      nextStatus = "Menunggu_Verifikasi";
      historyToRecord.push("Menunggu Verifikasi");
    } else {
      throw new AppError(
        "CONFLICT",
        `Tiket berstatus "${ticket.status.replace(/_/g, " ")}" tidak dapat dikirim untuk verifikasi.`,
        409,
      );
    }
  }

  return deps.saveBukti(
    ticketId,
    input.submissions,
    nextStatus,
    actor.id,
    historyToRecord,
  );
}

export async function verifyTicketByKaprodi(
  ticketId: string,
  input: VerifyTiketInput,
  actor: { id: string; role: UserRole },
  deps: TiketRepositoryDeps = defaultDeps,
): Promise<TicketItem> {
  if (actor.role !== "Kaprodi" && actor.role !== "Admin") {
    throw new AppError(
      "FORBIDDEN",
      "Hanya Kaprodi yang berhak memverifikasi tiket penugasan.",
      403,
    );
  }

  const nextStatus: StatusTiketType =
    input.decision === "approve" ? "Tercapai" : "Ditolak";

  const updated = await transitionTicketStatus(
    ticketId,
    nextStatus,
    actor,
    input.catatanKaprodi,
    deps,
  );

  if (deps.notifyEvent) {
    try {
      await deps.notifyEvent({
        userId: updated.dosenId,
        tipeNotifikasi:
          nextStatus === "Tercapai" ? "TIKET_DISETUJUI" : "TIKET_DITOLAK",
        judulNotifikasi:
          nextStatus === "Tercapai"
            ? "Bukti kinerja disetujui"
            : "Revisi bukti diperlukan",
        pesan:
          nextStatus === "Tercapai"
            ? `Tiket ${updated.kodeTiket} ${updated.namaTarget} telah disetujui Kaprodi.`
            : `Tiket ${updated.kodeTiket} ${updated.namaTarget} ditolak Kaprodi.`,
      });
    } catch {
      // Non-fatal notification failure
    }
  }

  return updated;
}

export async function recordMeetingAttendanceForTargetT03(
  dosenId: string,
  judulRapat: string,
  deps: TiketRepositoryDeps = defaultDeps,
): Promise<TicketItem | null> {
  if (!deps.appendAttendanceT03) return null;
  return deps.appendAttendanceT03(dosenId, judulRapat);
}
