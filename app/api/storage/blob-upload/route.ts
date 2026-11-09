import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { AppError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { allowedContentTypes, checkUploadPathname } from "@/lib/upload-rules";

/**
 * Membuat token unggah sekali pakai agar browser mengunggah langsung ke Vercel Blob.
 * Semua pemeriksaan (login, hak folder, tipe, ukuran) dilakukan di sini sebelum
 * token diterbitkan; tanpa itu siapa pun bisa mengunggah.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireServerSession();
    const body = (await request.json().catch(() => null)) as HandleUploadBody | null;

    if (!body) {
      throw new AppError("BAD_REQUEST", "Permintaan unggah tidak valid.", 400);
    }

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const check = checkUploadPathname(pathname, session.role);
        if (!check.ok) {
          throw new AppError(
            check.status === 403 ? "FORBIDDEN" : "BAD_REQUEST",
            check.message,
            check.status,
          );
        }

        return {
          allowedContentTypes: allowedContentTypes(check.folder),
          maximumSizeInBytes: MAX_UPLOAD_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
