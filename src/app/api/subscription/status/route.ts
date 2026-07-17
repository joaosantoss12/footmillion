import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { supabaseSelect } from "@/lib/supabase";

type Subscription = {
  id: string;
  plan: string;
  expires_at: string;
  invite_link_id: string | null;
};

type InviteLink = { link: string };

export async function GET(req: NextRequest) {
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ status: "logged_out" });
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
      return NextResponse.json({ status: "none" });
    }

    if (!sub.invite_link_id) {
      return NextResponse.json({
        status: "pending",
        plan: sub.plan,
        expiresAt: sub.expires_at,
      });
    }

    const links = await supabaseSelect<InviteLink>("invite_links", {
      id: `eq.${sub.invite_link_id}`,
      select: "link",
    });

    const link = links[0]?.link;
    if (!link) {
      return NextResponse.json({
        status: "pending",
        plan: sub.plan,
        expiresAt: sub.expires_at,
      });
    }

    return NextResponse.json({
      status: "ready",
      plan: sub.plan,
      expiresAt: sub.expires_at,
      telegramLink: link,
    });
  } catch (err) {
    console.error("subscription/status failed:", err);
    return NextResponse.json({ status: "none" }, { status: 200 });
  }
}
