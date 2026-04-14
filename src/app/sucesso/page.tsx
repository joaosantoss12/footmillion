import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export default async function Sucesso({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let telegramLink: string | null = null;
  let planName: string | null = null;
  let paid = false;

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      paid = session.payment_status === "paid";
      telegramLink = session.metadata?.telegramLink ?? null;
      planName = session.metadata?.planName ?? null;
    } catch {
      // session inválida ou não encontrada
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {paid ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Pagamento <span className="gradient-text">Confirmado!</span>
            </h1>
            {planName && (
              <p className="text-zinc-500 text-sm font-semibold tracking-wide uppercase mb-2">
                {planName}
              </p>
            )}
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
              O teu acesso ao grupo VIP está pronto. Clica no botão abaixo para
              entrar.
            </p>
            {telegramLink && (
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-gold-light text-black font-bold text-base hover:opacity-90 transition-all duration-300 shadow-lg shadow-gold/20 mb-4"
              >
                <ExternalLink className="w-5 h-5" />
                Entrar no Grupo VIP
              </a>
            )}
            <p className="text-zinc-600 text-xs mt-4 mb-10">
              Guarda este link — é o teu acesso exclusivo e intransferível.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Algo correu <span className="text-red-400">mal</span>
            </h1>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
              Não foi possível confirmar o pagamento. Se foste cobrado, contacta
              o suporte imediatamente.
            </p>
          </>
        )}

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-300"
        >
          ← Voltar ao início
        </Link>
      </div>
    </main>
  );
}

