import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { supabaseSelect } from "@/lib/supabase";
import { LINK_TTL_DAYS } from "@/lib/inviteLink";
import { claimGrantedVip } from "@/lib/legacyClaim";

type Subscription = {
  id: string;
  plan: string;
  expires_at: string;
  invite_link_id: string | null;
};

type InviteLink = { link: string; created_at: string; used_at: string | null };

const LINK_TTL_MS = LINK_TTL_DAYS * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ kind: "logged_out" });
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
      // No subscription — but an admin may have granted VIP by @username via the
      // bot. Now that we know the id, turn that grant into a real subscription.
      const granted = await claimGrantedVip(session);
      if (granted) {
        return NextResponse.json({
          kind: "ready",
          plan: granted.plan,
          expiresAt: granted.expiresAt,
          telegramLink: granted.telegramLink,
        });
      }
      return NextResponse.json({ kind: "none" });
    }

    if (!sub.invite_link_id) {
      return NextResponse.json({
        kind: "pending",
        plan: sub.plan,
        expiresAt: sub.expires_at,
      });
    }

    const links = await supabaseSelect<InviteLink>("invite_links", {
      id: `eq.${sub.invite_link_id}`,
      select: "link,created_at,used_at",
    });

    const rec = links[0];
    // A usable link is one already consumed (they're in the channel — reopening
    // it just returns them) or still within its single-use window. An unused,
    // expired link is treated as missing so the UI offers to regenerate.
    const usable =
      rec &&
      (rec.used_at !== null ||
        Date.now() - new Date(rec.created_at).getTime() < LINK_TTL_MS);

    if (!usable) {
      return NextResponse.json({
        kind: "pending",
        plan: sub.plan,
        expiresAt: sub.expires_at,
      });
    }

    return NextResponse.json({
      kind: "ready",
      plan: sub.plan,
      expiresAt: sub.expires_at,
      telegramLink: rec.link,
    });
  } catch (err) {
    console.error("subscription/status failed:", err);
    return NextResponse.json({ kind: "none" }, { status: 200 });
  }
}
