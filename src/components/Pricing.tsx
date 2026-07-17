"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Check, Crown, Zap, Star, ArrowRight, X, Mail, Link, AlertTriangle, Send, LogOut } from "lucide-react";
import TelegramGate from "./TelegramGate";

type TelegramUser = {
  username?: string;
  first_name: string;
  photo_url?: string;
};

const plans = [
  {
    id: "monthly",
    name: "1 Mês",
    price: "19.99",
    originalPrice: "39.99",
    period: "pagamento único",
    description: "Perfeito para experimentar",
    features: [
      "Acesso total ao grupo VIP",
      "Palpites diários premium",
      "Análises pré-jogo",
      "Suporte por mensagem",
      "Gestão de banca básica",
    ],
    icon: Zap,
    popular: false,
    gradient: "from-zinc-800 to-zinc-900",
    borderColor: "border-white/5",
    link: "https://t.me/+mgN-Uonc-g4yNjE0",
  },
  {
    id: "quarterly",
    name: "3 Meses",
    price: "49.99",
    originalPrice: "109.99",
    period: "pagamento único",
    description: "O mais popular",
    badge: "⚡ MAIS POPULAR",
    features: [
      "Tudo do plano 1 Mês",
      "Palpites live em tempo real",
      "Análises ao vivo",
      "Suporte prioritário 24/7",
      "Estratégias avançadas",
      "Grupo de discussão exclusivo",
    ],
    icon: Crown,
    popular: true,
    gradient: "from-gold/10 to-gold/5",
    borderColor: "border-gold/30",
    link: "https://t.me/+BXD7gmFf9OZjNDc0",
  },
  {
    id: "yearly",
    name: "1 Ano",
    price: "199.99",
    originalPrice: "249.99",
    period: "pagamento único",
    description: "O melhor investimento",
    badge: "👑 MELHOR VALOR",
    features: [
      "Tudo do plano 3 Meses",
      "Acesso durante 1 ano completo",
      "Mentoria personalizada",
      "Acesso antecipado a novidades",
      "Badge exclusiva de fundador",
      "Canal VIP dentro do VIP",
      "Bónus: curso de apostas",
    ],
    icon: Star,
    popular: false,
    gradient: "from-green-accent/5 to-green-accent/5",
    borderColor: "border-green-accent/20",
    link: "https://t.me/+yvMIUb8B01wzMTM8",
  },
];

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [telegramLoaded, setTelegramLoaded] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const telegramLoggedIn = telegramLoaded ? telegramUser !== null : null;

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "";

  const refreshTelegramLoggedIn = () => {
    fetch("/api/telegram/me")
      .then((res) => res.json())
      .then((data) => setTelegramUser(data.loggedIn ? data.user : null))
      .catch(() => setTelegramUser(null))
      .finally(() => setTelegramLoaded(true));
  };

  useEffect(() => {
    refreshTelegramLoggedIn();
    window.addEventListener("tg-auth", refreshTelegramLoggedIn);
    return () => window.removeEventListener("tg-auth", refreshTelegramLoggedIn);
  }, []);

  async function handleLogout() {
    await fetch("/api/telegram/logout", { method: "POST" });
    setTelegramUser(null);
    window.dispatchEvent(new Event("tg-auth"));
  }

  async function handleCheckout(planId: string) {
    setLoadingPlan(planId);
    setPendingPlanId(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Erro ao iniciar pagamento. Tenta novamente.");
        setLoadingPlan(null);
      }
    } catch {
      alert("Erro de ligação. Verifica a tua internet e tenta novamente.");
      setLoadingPlan(null);
    }
  }


  const pendingPlan = plans.find((p) => p.id === pendingPlanId) ?? null;

  return (
    <section
      id="pricing"
      ref={ref}
      className="relative py-14 sm:py-20 px-4 overflow-hidden"
    >
      {/* Confirmation modal */}
      <AnimatePresence>
        {pendingPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setPendingPlanId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPendingPlanId(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-5">
                <pendingPlan.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{pendingPlan.name}</h3>
              <p className="text-3xl font-black text-white mb-6">€{pendingPlan.price}</p>

              {telegramLoggedIn === false && (
                <div className="flex flex-col items-center gap-2 mb-5 pb-5 border-b border-white/10">
                  <p className="text-xs text-zinc-400">
                    Entra com o Telegram para receberes o link diretamente aqui após o pagamento
                  </p>
                  <button className="tg-auth-button" data-style="shine">
                    Entrar com Telegram
                  </button>
                </div>
              )}

              {telegramLoggedIn === true && telegramUser && (
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/10">
                  {telegramUser.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={telegramUser.photo_url}
                      alt={telegramUser.first_name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
                    />
                  )}
                  <p className="text-sm text-zinc-300 min-w-0 truncate">
                    Sessão iniciada como{" "}
                    <span className="text-white font-semibold">
                      @{telegramUser.username ?? telegramUser.first_name}
                    </span>
                  </p>
                  <button
                    onClick={handleLogout}
                    className="ml-auto w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                    aria-label="Terminar sessão"
                    title="Terminar sessão"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => handleCheckout(pendingPlan.id)}
                disabled={loadingPlan !== null}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-light text-black hover:opacity-90 transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-wait shadow-lg shadow-gold/20"
              >
                {loadingPlan === pendingPlan.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    A processar...
                  </>
                ) : (
                  <>
                    Confirmar e Pagar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-center text-zinc-600 text-xs mt-3">Clica fora para cancelar</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Telegram notice — profile when logged in, warning otherwise */}
      <AnimatePresence>
        {telegramLoggedIn === true && telegramUser && !noticeDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed top-4 right-4 z-50 max-w-sm rounded-xl border border-green-accent/20 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              {telegramUser.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={telegramUser.photo_url}
                  alt={telegramUser.first_name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-white/10 flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs text-green-accent mb-0.5">Sessão iniciada</p>
                <p className="text-white font-semibold leading-tight truncate">
                  {telegramUser.first_name}
                </p>
                {telegramUser.username && (
                  <p className="text-zinc-400 text-sm leading-tight truncate">
                    @{telegramUser.username}
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Terminar sessão"
                title="Terminar sessão"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
        {telegramLoggedIn === false && !noticeDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed top-4 right-4 z-50 max-w-sm rounded-xl border border-amber-500/20 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-2xl"
          >
            <button
              onClick={() => setNoticeDismissed(true)}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-start gap-3 pr-6 text-sm text-amber-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Não iniciaste sessão com o Telegram. Se pagares assim, envia{" "}
                <strong>/start</strong> a{" "}
                <strong>@{botUsername}</strong> no
                Telegram depois do pagamento para receberes o link do grupo.
              </span>
            </div>
            <div className="flex items-center justify-center mt-3 pl-7">
              <button className="tg-auth-button" data-style="square">
                Entrar com Telegram
              </button>
            </div>
            <a
              href={`https://t.me/${botUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 ml-7 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Abrir chat com o bot
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,168,83,0.06)_0%,_transparent_60%)]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-gold text-sm font-semibold tracking-widest uppercase mb-4">
            Planos & Preços
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
            Escolhe o teu{" "}
            <span className="gradient-text">plano VIP</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Pagamento único. Sem surpresas. Sem subscrições escondidas.
            Escolhe o período que mais te convém.
          </p>
        </motion.div>

        <TelegramGate />

        {/* Pricing cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch"
        >
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              className={`relative group ${plan.popular ? "md:-mt-4 md:mb-0" : ""}`}
            >
              {/* Popular glow */}
              {plan.popular && (
                <div className="absolute -inset-1 bg-gradient-to-b from-gold/30 via-gold/10 to-transparent rounded-3xl blur-sm" />
              )}

              <div
                className={`relative h-full rounded-2xl ${plan.popular ? "rounded-3xl" : ""} bg-gradient-to-b ${plan.gradient} border ${plan.borderColor} p-8 flex flex-col card-hover`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-gold to-gold-light text-black text-xs font-bold tracking-wide">
                    {plan.badge}
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${plan.popular
                    ? "bg-gold/20 text-gold"
                    : "bg-white/5 text-zinc-400"
                    }`}
                >
                  <plan.icon className="w-6 h-6" />
                </div>

                {/* Plan name */}
                <h3 className="text-xl font-bold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-zinc-500 text-sm mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      €{plan.price}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-zinc-600 line-through text-sm">
                      €{plan.originalPrice}
                    </span>
                    <span className="text-xs text-green-accent font-semibold">
                      {Math.round(
                        (1 -
                          parseFloat(plan.price) /
                          parseFloat(plan.originalPrice)) *
                        100
                      )}
                      % OFF
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1">{plan.period}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-gold" : "text-green-accent"
                          }`}
                      />
                      <span className="text-zinc-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => setPendingPlanId(plan.id)}
                  disabled={loadingPlan !== null}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-wait ${plan.popular
                    ? "bg-gradient-to-r from-gold to-gold-light text-black hover:opacity-90 shadow-lg shadow-gold/20"
                    : "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      A processar...
                    </>
                  ) : (
                    <>
                      Aderir Agora
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-zinc-500 text-sm"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            Pagamento seguro via Stripe
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Encriptação SSL
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Acesso imediato
          </div>
        </motion.div>

        {/* Post-payment info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-8 max-w-xl mx-auto rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-5 text-center space-y-2"
        >
        </motion.div>
      </div>
    </section>
  );
}
