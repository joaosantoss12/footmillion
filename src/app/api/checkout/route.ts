import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PLANS: Record<string, { name: string; amount: number; telegramLink: string }> = {
  monthly: {
    name: "Footmillion VIP — 1 Mês",
    amount: 2999,
    telegramLink: "https://t.me/+mgN-Uonc-g4yNjE0",
  },
  quarterly: {
    name: "Footmillion VIP — 3 Meses",
    amount: 6999,
    telegramLink: "https://t.me/+BXD7gmFf9OZjNDc0",
  },
  yearly: {
    name: "Footmillion VIP — 1 Ano",
    amount: 14999,
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
      metadata: {
        planId,
        planName: plan.name,
        telegramLink: plan.telegramLink,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
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
