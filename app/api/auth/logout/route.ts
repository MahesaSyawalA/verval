import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set({
    ...getSessionCookieOptions(0),
    value: "",
  });
  return response;
}
