import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramIdToken } from "@/lib/telegramAuth";
import { signSession, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const idToken = body && typeof body.id_token === "string" ? body.id_token : null;
  if (!idToken) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const auth = await verifyTelegramIdToken(idToken, process.env.TELEGRAM_CLIENT_ID!);
  if (!auth) {
    return NextResponse.json({ error: "Autenticação inválida" }, { status: 401 });
  }

  const session = { id: auth.id, username: auth.username, first_name: auth.first_name };
  const res = NextResponse.json({ ok: true, user: session });
  res.cookies.set(SESSION_COOKIE, signSession(session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
