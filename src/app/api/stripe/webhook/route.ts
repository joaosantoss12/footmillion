import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseSelect, supabaseInsert, supabaseUpdate } from "@/lib/supabase";

// Mirrors config.py's PLANS in the bot repo.
const PLAN_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

type SubscriptionRow = { id: string; expires_at: string; invite_link_id: string | null };

/**
 * Writes the paid-for subscription so the site can show "access ready" on a
 * later visit. `invite_link_id` is left null here — the bot fills it in once
 * it generates the personal invite link for this telegram_user_id.
 */
async function upsertTelegramSubscription(
  telegramUserId: string,
  telegramUsername: string | undefined,
  telegramName: string,
  planId: string
) {
  const days = PLAN_DAYS[planId];
  if (!days) throw new Error(`Unknown planId for subscription upsert: ${planId}`);

  const existing = await supabaseSelect<SubscriptionRow>("subscriptions", {
    telegram_user_id: `eq.${telegramUserId}`,
    active: "eq.true",
    select: "id,expires_at,invite_link_id",
    order: "expires_at.desc",
    limit: "1",
  });

  const now = new Date();
  const current = existing[0];

  if (current) {
    const base = new Date(
      Math.max(new Date(current.expires_at).getTime(), now.getTime())
    );
    const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    await supabaseUpdate(
      "subscriptions",
      { id: `eq.${current.id}` },
      { plan: planId, expires_at: expiresAt.toISOString(), renewal_notified_at: null }
    );
    return;
  }

  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  await supabaseInsert("subscriptions", {
    telegram_user_id: Number(telegramUserId),
    telegram_username: telegramUsername ?? null,
    telegram_name: telegramName,
    plan: planId,
    expires_at: expiresAt.toISOString(),
    invite_link_id: null,
    active: true,
  });
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

  // O Stripe repete o webhook até receber 2xx; a flag impede um upsert em duplicado.
  if (session.metadata?.processed === "true") {
    return NextResponse.json({ received: true, skipped: "already processed" });
  }

  const telegramUserId = session.metadata?.telegram_user_id;
  const planId = session.metadata?.planId;

  // Sem login com Telegram: o bot já grava o invite_link a partir do seu
  // próprio webhook; a LP não tem mais nada a fazer nesta sessão.
  if (!telegramUserId || !planId) {
    return NextResponse.json({ received: true, skipped: "no telegram session" });
  }

  try {
    await upsertTelegramSubscription(
      telegramUserId,
      session.metadata?.telegram_username,
      session.metadata?.telegram_name ?? "",
      planId
    );

    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...session.metadata, processed: "true" },
    });

    console.log(`Subscription upserted for telegram_user_id ${telegramUserId} (${planId})`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Failed to record telegram-linked subscription:", err);
    return NextResponse.json({ error: "Subscription upsert failed" }, { status: 500 });
  }
}
