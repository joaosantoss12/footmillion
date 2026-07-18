import { supabaseSelect, supabaseInsert, supabaseUpdate } from "@/lib/supabase";
import { createChannelInviteLink } from "@/lib/inviteLink";
import type { TelegramSession } from "@/lib/session";

type LegacyMember = {
  username: string;
  plan: string;
  expires_at: string;
  claimed_at: string | null;
};

/**
 * An admin can grant VIP by @username via the bot's /givevip when they don't
 * have the numeric id. That writes a legacy_members row. Now that the user has
 * logged in — so we finally know their id — turn an unclaimed, still-valid
 * grant into a real subscription with an invite link.
 *
 * Returns the provisioned subscription, or null if there's nothing to claim.
 * Call only when the user has no active subscription.
 */
export async function claimGrantedVip(
  session: TelegramSession
): Promise<{ plan: string; expiresAt: string; telegramLink: string } | null> {
  if (!session.username) return null;
  const username = session.username.toLowerCase();

  const rows = await supabaseSelect<LegacyMember>("legacy_members", {
    username: `eq.${username}`,
    claimed_at: "is.null",
    select: "username,plan,expires_at,claimed_at",
    limit: "1",
  });
  const grant = rows[0];
  if (!grant) return null;
  if (new Date(grant.expires_at).getTime() <= Date.now()) return null;

  const { id: linkId, link } = await createChannelInviteLink({
    planId: grant.plan,
    subscriptionExpiresAt: grant.expires_at,
    sessionId: `grant_${session.id}_${Date.now()}`,
    email: "",
  });

  await supabaseInsert("subscriptions", {
    telegram_user_id: session.id,
    telegram_username: session.username ?? null,
    telegram_name: session.first_name,
    plan: grant.plan,
    expires_at: grant.expires_at,
    invite_link_id: linkId,
    active: true,
  });

  // Mark claimed last: if anything above throws, the grant stays open and the
  // next login retries it instead of being silently lost.
  await supabaseUpdate(
    "legacy_members",
    { username: `eq.${username}` },
    { claimed_at: new Date().toISOString(), claimed_by_telegram_id: session.id }
  );

  return { plan: grant.plan, expiresAt: grant.expires_at, telegramLink: link };
}
