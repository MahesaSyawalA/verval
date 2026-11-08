import { NextResponse, type NextRequest } from "next/server";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { apiError, handleRouteError } from "@/lib/http";
import { requireServerSession } from "@/lib/session";
import { saveStorageFile } from "@/lib/storage";
import {
  canUploadToFolder,
  isAllowedUpload,
  isUploadFolder,
} from "@/lib/storage-access";

export async function POST(request: NextRequest) {
  try {
    const session = await requireServerSession();
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

    const folderParam = formData?.get("folder");
    const subFolder = isUploadFolder(folderParam) ? folderParam : "bukti";

    if (!canUploadToFolder(subFolder, session.role)) {
      return apiError(
        "FORBIDDEN",
        "Anda tidak memiliki hak untuk mengunggah berkas ke kategori ini.",
        403,
      );
    }

    if (!isAllowedUpload(subFolder, file.name)) {
      return apiError(
        "BAD_REQUEST",
        "Tipe berkas tidak diizinkan untuk kategori ini.",
        400,
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const savedPath = await saveStorageFile(
      subFolder,
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
