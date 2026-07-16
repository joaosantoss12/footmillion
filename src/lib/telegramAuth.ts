import { createHash, createHmac, timingSafeEqual } from "crypto";

export type TelegramAuthPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

/**
 * https://core.telegram.org/widgets/login#checking-authorization
 * secret = SHA256(bot_token); hash = HMAC-SHA256(data_check_string, secret).
 */
export function verifyTelegramAuth(
  payload: Record<string, unknown>,
  botToken: string
): TelegramAuthPayload | null {
  const { hash, ...rest } = payload;
  if (typeof hash !== "string") return null;

  const dataCheckString = Object.keys(rest)
    .filter((key) => rest[key] !== undefined && rest[key] !== null)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("\n");

  const secret = createHash("sha256").update(botToken).digest();
  const computedHash = createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const authDate = Number(rest.auth_date);
  if (!Number.isFinite(authDate)) return null;
  if (Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) return null;

  const id = Number(rest.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    first_name: String(rest.first_name ?? ""),
    last_name: rest.last_name ? String(rest.last_name) : undefined,
    username: rest.username ? String(rest.username) : undefined,
    photo_url: rest.photo_url ? String(rest.photo_url) : undefined,
    auth_date: authDate,
    hash,
  };
}
