// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/http";

const requireServerSession = vi.fn();
vi.mock("@/lib/session", () => ({
  requireServerSession: (...a: unknown[]) => requireServerSession(...a),
}));

// Meniru handleUpload: memanggil onBeforeGenerateToken dan mengembalikan hasilnya.
vi.mock("@vercel/blob/client", () => ({
  handleUpload: async ({
    body,
    onBeforeGenerateToken,
  }: {
    body: { payload: { pathname: string } };
    onBeforeGenerateToken: (pathname: string) => Promise<unknown>;
  }) => ({
    type: "blob.generate-client-token",
    constraints: await onBeforeGenerateToken(body.payload.pathname),
  }),
}));

import { POST } from "@/app/api/storage/blob-upload/route";

function request(pathname: string): NextRequest {
  return new NextRequest("http://localhost/api/storage/blob-upload", {
    method: "POST",
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: { pathname },
    }),
  });
}

beforeEach(() => {
  requireServerSession.mockReset();
});

describe("POST /api/storage/blob-upload", () => {
  it("menerbitkan token dengan batas ukuran dan tipe untuk unggahan sah", async () => {
    requireServerSession.mockResolvedValue({ id: "d1", role: "Dosen" });

    const res = await POST(request("dokumentasi/1700-foto.png"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.constraints).toMatchObject({
      maximumSizeInBytes: 10 * 1024 * 1024,
      addRandomSuffix: true,
      allowedContentTypes: ["image/png", "image/jpeg", "image/webp"],
    });
  });

  it("menolak pengguna yang belum login dengan 401", async () => {
    requireServerSession.mockRejectedValue(
      new AppError("UNAUTHORIZED", "Sesi berakhir.", 401),
    );

    const res = await POST(request("bukti/1-a.pdf"));
    expect(res.status).toBe(401);
  });

  it("menolak Dosen mengunggah surat undangan dengan 403", async () => {
    requireServerSession.mockResolvedValue({ id: "d1", role: "Dosen" });

    const res = await POST(request("undangan/1-a.pdf"));
    expect(res.status).toBe(403);
  });

  it("menolak jalur rusak dan tipe berkas terlarang dengan 400", async () => {
    requireServerSession.mockResolvedValue({ id: "k1", role: "Kaprodi" });

    expect((await POST(request("../.env"))).status).toBe(400);
    expect((await POST(request("bukti/1-virus.exe"))).status).toBe(400);
  });
});
