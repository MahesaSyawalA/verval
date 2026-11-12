import { NextResponse } from "next/server";
import { getServerSession, getSessionCookieOptions } from "@/lib/session";
import { revokeUserSessions } from "@/modules/sso/server/sso.service";

export async function POST() {
  // Keluar dari SSO juga mencabut refresh token agar modul lain tidak bisa memperbarui sesi.
  const session = await getServerSession();
  if (session) {
    await revokeUserSessions(session.id);
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set({
    ...getSessionCookieOptions(0),
    value: "",
  });
  return response;
}
