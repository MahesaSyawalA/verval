import { NextResponse, type NextRequest } from "next/server";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { apiError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { saveStorageFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    await requireServerSession();
    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");

    if (!file || !(file instanceof File)) {
      return apiError("BAD_REQUEST", "Berkas wajib dipilih untuk diunggah.", 400);
    }

    if (file.size <= 0) {
      return apiError("BAD_REQUEST", "Berkas yang diunggah kosong.", 400);
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return apiError(
        "BAD_REQUEST",
        "Ukuran berkas melebihi batas maksimal 10 MB.",
        400,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const savedPath = await saveStorageFile(
      "bukti",
      file.name,
      Buffer.from(arrayBuffer),
    );

    return NextResponse.json(
      {
        data: {
          path: savedPath,
          fileName: file.name,
          size: file.size,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
