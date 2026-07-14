import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const TELEGRAM_API = "https://api.telegram.org";
const RESEND_API = "https://api.resend.com/emails";

// Convite válido 7 dias — tempo de sobra para o cliente abrir o email.
const INVITE_TTL_DAYS = 7;

async function createSingleUseInvite(planName: string): Promise<string> {
  const expireDate =
    Math.floor(Date.now() / 1000) + INVITE_TTL_DAYS * 24 * 60 * 60;

  const res = await fetch(
    `${TELEGRAM_API}/bot${process.env.TELEGRAM_BOT_TOKEN}/createChatInviteLink`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_GROUP_ID,
        member_limit: 1,
        expire_date: expireDate,
        name: planName.slice(0, 32),
      }),
    }
  );

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram createChatInviteLink failed: ${data.description}`);
  }
  return data.result.invite_link as string;
}

async function sendVipEmail(to: string, planName: string, inviteLink: string) {
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to,
      subject: "O teu acesso ao FOOTMILLION VIP 🔥",
      html: `
<div style="background:#050505;padding:40px 20px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#0d0d0d;border:1px solid #1f1f1f;border-radius:16px;padding:40px 32px;text-align:center">
    <h1 style="color:#fff;font-size:26px;margin:0 0 8px">Pagamento confirmado!</h1>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 28px">${planName}</p>
    <p style="color:#d4d4d8;font-size:16px;line-height:1.6;margin:0 0 28px">
      O teu acesso ao grupo VIP está pronto. Clica no botão abaixo para entrares no Telegram.
    </p>
    <a href="${inviteLink}"
       style="display:inline-block;background:#d4af37;color:#000;font-weight:bold;font-size:16px;text-decoration:none;padding:16px 32px;border-radius:12px">
      Entrar no Grupo VIP
    </a>
    <p style="color:#71717a;font-size:12px;line-height:1.6;margin:28px 0 0">
      Este link é pessoal, só pode ser usado <strong>uma vez</strong> e expira em ${INVITE_TTL_DAYS} dias.
      Não o partilhes com ninguém.
    </p>
    <p style="color:#52525b;font-size:12px;margin:20px 0 0">
      Se o botão não funcionar, copia este link:<br />
      <span style="color:#71717a">${inviteLink}</span>
    </p>
  </div>
</div>`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
  }
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

  // O Stripe repete o webhook até receber 2xx; a flag impede um segundo convite/email.
  if (session.metadata?.vipEmailSent === "true") {
    return NextResponse.json({ received: true, skipped: "already sent" });
  }

  const email = session.customer_details?.email;
  const planName = session.metadata?.planName ?? "Footmillion VIP";

  if (!email) {
    console.error(`No email on session ${session.id}`);
    return NextResponse.json({ received: true, skipped: "no email" });
  }

  try {
    const inviteLink = await createSingleUseInvite(planName);
    await sendVipEmail(email, planName, inviteLink);

    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...session.metadata, vipEmailSent: "true", inviteLink },
    });

    console.log(`VIP email sent to ${email} (${planName})`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Failed to deliver VIP link:", err);
    // 500 => o Stripe volta a tentar mais tarde.
    return NextResponse.json({ error: "Delivery failed" }, { status: 500 });
  }
}
