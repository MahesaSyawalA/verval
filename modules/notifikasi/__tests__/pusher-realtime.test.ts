import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { notifikasiChannelName, NOTIFIKASI_EVENT } from "@/lib/pusher-channels";
import { getPusherServer } from "@/lib/pusher-server";
import { broadcastNotifikasi } from "../server/notifikasi.realtime";

describe("Pusher Channels Realtime Notification", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("menghasilkan channel name privat dan event name yang konsisten", () => {
    expect(notifikasiChannelName("usr-123")).toBe("private-notifikasi-usr-123");
    expect(NOTIFIKASI_EVENT).toBe("notifikasi.baru");
  });

  it("mengembalikan null jika kredensial Pusher belum diisi pada env", () => {
    delete process.env.PUSHER_APP_ID;
    delete process.env.NEXT_PUBLIC_PUSHER_KEY;
    delete process.env.PUSHER_SECRET;
    delete process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    const server = getPusherServer();
    expect(server).toBeNull();
  });

  it("broadcastNotifikasi berjalan graceful tanpa melempar error saat Pusher belum dikonfigurasi", async () => {
    delete process.env.PUSHER_APP_ID;
    delete process.env.NEXT_PUBLIC_PUSHER_KEY;
    delete process.env.PUSHER_SECRET;
    delete process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    await expect(
      broadcastNotifikasi([
        {
          userId: "usr-test",
          id: "notif-1",
          tipeNotifikasi: "TIKET_BARU",
          judulNotifikasi: "Tiket Baru",
          pesan: "Pesan tiket baru",
          createdAt: new Date(),
        },
      ])
    ).resolves.not.toThrow();
  });
});
