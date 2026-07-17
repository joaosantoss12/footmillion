import { jwtVerify, createRemoteJWKSet } from "jose";

export type TelegramIdTokenUser = {
  id: number;
  username?: string;
  first_name: string;
};

const JWKS = createRemoteJWKSet(
  new URL("https://oauth.telegram.org/.well-known/jwks.json")
);

/**
 * https://core.telegram.org/widgets/login — OIDC flow (telegram-login.js).
 * Verifies the id_token's signature against Telegram's JWKS, and that it
 * was issued for our bot (aud = client_id).
 */
export async function verifyTelegramIdToken(
  idToken: string,
  clientId: string
): Promise<TelegramIdTokenUser | null> {
  try {
    // Verify signature + issuer here. We check `aud` ourselves below because
    // Telegram may encode it as a number, which jose's string-based audience
    // option would reject.
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: "https://oauth.telegram.org",
    });

    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.some((a) => String(a) === String(clientId))) {
      console.error("Telegram id_token aud mismatch:", payload.aud, "expected", clientId);
      return null;
    }

    const id = Number(payload.sub ?? payload.id);
    if (!Number.isFinite(id)) return null;

    const username =
      typeof payload.preferred_username === "string"
        ? payload.preferred_username
        : undefined;
    const firstName =
      (typeof payload.given_name === "string" && payload.given_name) ||
      (typeof payload.name === "string" && payload.name) ||
      "Telegram";

    return { id, username, first_name: firstName };
  } catch (err) {
    console.error("Telegram id_token verification failed:", err);
    return null;
  }
}
