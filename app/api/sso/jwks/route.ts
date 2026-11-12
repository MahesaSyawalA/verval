import { NextResponse, connection } from "next/server";
import { getSigningKey } from "@/modules/sso/server/keys";

/** Kunci publik untuk memverifikasi access token (RS256). */
export async function GET() {
  // Tandai dinamis: tanpa ini Cache Components bisa membekukan hasilnya saat build.
  await connection();

  const { publicJwk } = await getSigningKey();
  return NextResponse.json(
    { keys: [publicJwk] },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
