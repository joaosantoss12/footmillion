import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { supabaseSelect, supabaseUpdate } from "@/lib/supabase";
import { createChannelInviteLink, LINK_TTL_DAYS } from "@/lib/inviteLink";

type Subscription = { id: string; plan: string; expires_at: string; invite_link_id: string | null };
type InviteLink = { id: string; link: string; created_at: string; used_at: string | null };

const LINK_TTL_MS = LINK_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Fallback: mint a fresh single-use invite link for a logged-in member whose
 * active subscription has no link, or whose link has expired. Reuses a
 * still-valid, unused link when one exists so repeated clicks don't spam links.
 */
export async function POST(req: NextRequest) {
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ status: "logged_out" }, { status: 401 });
  }

  try {
    const subs = await supabaseSelect<Subscription>("subscriptions", {
      telegram_user_id: `eq.${session.id}`,
      active: "eq.true",
      select: "id,plan,expires_at,invite_link_id",
      order: "expires_at.desc",
      limit: "1",
    });
    const sub = subs[0];
    if (!sub) {
      return NextResponse.json({ status: "none" }, { status: 404 });
    }
    if (new Date(sub.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ status: "expired" }, { status: 409 });
    }

    // Reuse the current link if it's still fresh and hasn't been consumed.
    if (sub.invite_link_id) {
      const links = await supabaseSelect<InviteLink>("invite_links", {
        id: `eq.${sub.invite_link_id}`,
        select: "id,link,created_at,used_at",
      });
      const cur = links[0];
      if (
        cur &&
        !cur.used_at &&
        Date.now() - new Date(cur.created_at).getTime() < LINK_TTL_MS
      ) {
        return NextResponse.json({ status: "ready", telegramLink: cur.link });
      }
    }

    const { id, link } = await createChannelInviteLink({
      planId: sub.plan,
      subscriptionExpiresAt: sub.expires_at,
      sessionId: `refresh_${session.id}_${Date.now()}`,
      email: "",
    });
    await supabaseUpdate("subscriptions", { id: `eq.${sub.id}` }, { invite_link_id: id });

    return NextResponse.json({ status: "ready", telegramLink: link });
  } catch (err) {
    console.error("subscription/link generation failed:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}