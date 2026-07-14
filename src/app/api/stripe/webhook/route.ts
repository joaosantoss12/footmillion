import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const RESEND_API = "https://api.resend.com/emails";

/**
 * O convite é criado pelo webhook do bot, que grava a linha em `invite_links`.
 * Aqui só lemos essa linha para construir o mesmo deep link do redirect, para
 * que a entrada no grupo passe sempre pelo bot (e fique registada).
 */
async function getInviteTokenForSession(
  sessionId: string
): Promise<string | null> {
  const url = new URL(`${process.env.SUPABASE_URL}/rest/v1/invite_links`);
  url.searchParams.set("stripe_session_id", `eq.${sessionId}`);
  url.searchParams.set("select", "id");

  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Supabase lookup failed: ${res.status} ${await res.text()}`);
  }

  const rows: { id: string }[] = await res.json();
  if (!rows.length) return null;

  // O bot espera o UUID sem hífenes (deep links do Telegram: máx. 64 chars).
  return rows[0].id.replace(/-/g, "");
}

async function sendVipEmail(to: string, planName: string, botLink: string) {
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
      O teu acesso ao grupo VIP está pronto. Clica no botão abaixo — o nosso bot
      no Telegram envia-te o convite para o canal.
    </p>
    <a href="${botLink}"
       style="display:inline-block;background:#d4af37;color:#000;font-weight:bold;font-size:16px;text-decoration:none;padding:16px 32px;border-radius:12px">
      Ativar o meu acesso VIP
    </a>
    <p style="color:#71717a;font-size:12px;line-height:1.6;margin:28px 0 0">
      Este link é pessoal e só pode ser usado <strong>uma vez</strong>. Não o partilhes com ninguém.
    </p>
    <p style="color:#52525b;font-size:12px;margin:20px 0 0">
      Se o botão não funcionar, copia este link:<br />
      <span style="color:#71717a">${botLink}</span>
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

  // O Stripe repete o webhook até receber 2xx; a flag impede um segundo email.
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
    const token = await getInviteTokenForSession(session.id);

    if (!token) {
      // O webhook do bot ainda não gravou a linha — 500 faz o Stripe repetir.
      console.warn(`Invite row not ready for ${session.id}, will retry`);
      return NextResponse.json({ error: "Invite not ready" }, { status: 500 });
    }

    const botLink = `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=sub_${token}`;
    await sendVipEmail(email, planName, botLink);

    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...session.metadata, vipEmailSent: "true" },
    });

    console.log(`VIP email sent to ${email} (${planName})`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Failed to deliver VIP link:", err);
    return NextResponse.json({ error: "Delivery failed" }, { status: 500 });
  }
}
