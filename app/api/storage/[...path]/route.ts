import { NextResponse, type NextRequest } from "next/server";
import { apiError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { readStorageFile } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    await requireServerSession();
    const { path: segments } = await context.params;
    const relativePath = segments.join("/");

    try {
      const content = await readStorageFile(relativePath);
      const ext = relativePath.split(".").pop()?.toLowerCase();
      const contentType =
        ext === "pdf"
          ? "application/pdf"
          : ext === "png"
            ? "image/png"
            : ext === "jpg" || ext === "jpeg"
              ? "image/jpeg"
              : "application/octet-stream";

      return new NextResponse(new Uint8Array(content), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return apiError("NOT_FOUND", "Berkas tidak ditemukan.", 404);
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
