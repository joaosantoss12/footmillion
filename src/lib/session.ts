import { createHmac, timingSafeEqual } from "crypto";

export type TelegramSession = {
  id: number;
  username?: string;
  first_name: string;
};

export const SESSION_COOKIE = "tg_session";

function sign(value: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET!)
    .update(value)
    .digest("base64url");
}

export function signSession(data: TelegramSession): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySession(cookieValue: string | undefined): TelegramSession | null {
  if (!cookieValue) return null;
  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
