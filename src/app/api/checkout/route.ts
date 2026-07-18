import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

const PLANS: Record<string, { name: string; amount: number; telegramLink: string }> = {
  monthly: {
    name: "Footmillion VIP — 1 Mês",
    amount: 1999,
    telegramLink: "https://t.me/+mgN-Uonc-g4yNjE0",
  },
  quarterly: {
    name: "Footmillion VIP — 3 Meses",
    amount: 4999,
    telegramLink: "https://t.me/+BXD7gmFf9OZjNDc0",
  },
  yearly: {
    name: "Footmillion VIP — 1 Ano",
    amount: 19999,
    telegramLink: "https://t.me/+yvMIUb8B01wzMTM8",
  },
};

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });

    const body = await req.json();
    const planId = typeof body?.planId === "string" ? body.planId : null;

    if (!planId || !PLANS[planId]) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    const plan = PLANS[planId];

    // Telegram login is mandatory — nobody buys without it. This is the real
    // gate; the UI also blocks the button, but the purchase itself is refused
    // here so an unauthenticated request can never create a session.
    const tgSession = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!tgSession) {
      return NextResponse.json(
        { error: "Tens de iniciar sessão com o Telegram antes de comprar." },
        { status: 401 }
      );
    }

    const metadata: Record<string, string> = {
      planId,
      planName: plan.name,
      telegramLink: plan.telegramLink,
      telegram_user_id: String(tgSession.id),
      telegram_name: tgSession.first_name,
    };
    if (tgSession.username) metadata.telegram_username = tgSession.username;

    // Always return to the homepage, which shows their invite link once ready.
    const successUrl = `${process.env.NEXT_PUBLIC_URL}/?paid=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "mb_way", "multibanco", "klarna"],
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: plan.amount,
            product_data: { name: plan.name },
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: successUrl,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Erro ao criar sessão de pagamento" },
      { status: 500 }
    );
  }
}
