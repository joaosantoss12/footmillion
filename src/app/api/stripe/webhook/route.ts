import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseSelect, supabaseInsert, supabaseUpdate } from "@/lib/supabase";
import { createChannelInviteLink } from "@/lib/inviteLink";

// Mirrors config.py in the bot repo: the real subscription length is a number
// of calendar months.
const PLAN_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

type SubscriptionRow = { id: string; expires_at: string; invite_link_id: string | null };

/**
 * Add calendar months in UTC, keeping the same day-of-month and clamping when
 * the target month is shorter (31 Jan -> 28/29 Feb). Mirrors config.py's
 * plan_expiry so the site and the bot never disagree on an expiry date.
 */
function addCalendarMonths(start: Date, months: number): Date {
  const d = new Date(start);
  const day = d.getUTCDate();
  d.setUTCDate(1); // avoid roll-over while shifting the month
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/**
 * Extend a still-valid subscription, or start fresh. Mirrors the bot's
 * _handle_join: the new period stacks on whatever time is left, so renewing
 * early never loses days.
 */
function computeExpiry(current: SubscriptionRow | undefined, planId: string): Date {
  const now = new Date();
  const base = current
    ? new Date(Math.max(new Date(current.expires_at).getTime(), now.getTime()))
    : now;
  return addCalendarMonths(base, PLAN_MONTHS[planId] ?? 0);
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const telegramUserId = session.metadata?.telegram_user_id;
  const planId = session.metadata?.planId;

  // Sem login com Telegram: o webhook do bot trata do link a partir da sua
  // própria sessão; a LP não tem mais nada a fazer aqui.
  if (!telegramUserId || !planId || !PLAN_MONTHS[planId]) {
    return NextResponse.json({ received: true, skipped: "no telegram session" });
  }

  try {
    // Idempotência à prova de reenvio: se já existe um invite_link para esta
    // sessão, este evento já foi totalmente processado. (O Stripe reenvia o
    // evento original, cuja metadata não reflete flags que escrevêssemos depois,
    // por isso a marca de "processado" vive na base de dados, não na sessão.)
    const already = await supabaseSelect<{ id: string }>("invite_links", {
      stripe_session_id: `eq.${session.id}`,
      select: "id",
      limit: "1",
    });
    if (already.length) {
      return NextResponse.json({ received: true, skipped: "already processed" });
    }

    const existing = await supabaseSelect<SubscriptionRow>("subscriptions", {
      telegram_user_id: `eq.${telegramUserId}`,
      active: "eq.true",
      select: "id,expires_at,invite_link_id",
      order: "expires_at.desc",
      limit: "1",
    });
    const current = existing[0];
    const expiresAt = computeExpiry(current, planId);
    const email = session.customer_details?.email ?? "";

    // Generate + record the link first: its invite_links row is the idempotency
    // marker, so a later resend short-circuits above instead of re-stacking.
    const { id: inviteLinkId } = await createChannelInviteLink({
      planId,
      subscriptionExpiresAt: expiresAt.toISOString(),
      sessionId: session.id,
      email,
    });

    if (current) {
      await supabaseUpdate(
        "subscriptions",
        { id: `eq.${current.id}` },
        {
          plan: planId,
          expires_at: expiresAt.toISOString(),
          invite_link_id: inviteLinkId,
          renewal_notified_at: null,
        }
      );
    } else {
      await supabaseInsert("subscriptions", {
        telegram_user_id: Number(telegramUserId),
        telegram_username: session.metadata?.telegram_username ?? null,
        telegram_name: session.metadata?.telegram_name ?? "",
        plan: planId,
        expires_at: expiresAt.toISOString(),
        invite_link_id: inviteLinkId,
        active: true,
      });
    }

    console.log(
      `Subscription + link provisioned for telegram_user_id ${telegramUserId} (${planId})`
    );
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Failed to provision telegram-linked subscription:", err);
    return NextResponse.json({ error: "Provisioning failed" }, { status: 500 });
  }
}
