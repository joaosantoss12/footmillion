"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react";

type Status =
  | { kind: "loading" }
  | { kind: "logged_out" }
  | { kind: "none" }
  | { kind: "pending"; plan: string; expiresAt: string }
  | { kind: "ready"; plan: string; expiresAt: string; telegramLink: string };

type TelegramAuthUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthUser) => void;
  }
}

const PLAN_LABELS: Record<string, string> = {
  monthly: "1 Mês",
  quarterly: "3 Meses",
  yearly: "1 Ano",
};

export default function TelegramGate() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [username, setUsername] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const [meRes, statusRes] = await Promise.all([
      fetch("/api/telegram/me"),
      fetch("/api/subscription/status"),
    ]);
    const me = await meRes.json();
    const sub = await statusRes.json();

    setUsername(me.loggedIn ? me.user.username ?? me.user.first_name : null);
    setStatus(sub);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll while we're waiting for the bot to generate the invite link.
  useEffect(() => {
    if (status.kind === "pending") {
      pollRef.current = setInterval(refresh, 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [status.kind, refresh]);

  // Mount the Telegram Login Widget only when there's something to gain from it.
  useEffect(() => {
    if (status.kind !== "logged_out" && status.kind !== "none") return;
    if (!widgetRef.current) return;

    window.onTelegramAuth = async (user: TelegramAuthUser) => {
      await fetch("/api/telegram/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      refresh();
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute(
      "data-telegram-login",
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? ""
    );
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");

    widgetRef.current.innerHTML = "";
    widgetRef.current.appendChild(script);
  }, [status.kind]);

  if (status.kind === "loading") return null;

  if (status.kind === "ready") {
    const expires = new Date(status.expiresAt).toLocaleDateString("pt-PT");
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto mb-12 rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/10 to-gold/5 p-8 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
        <h3 className="text-2xl font-black text-white mb-1">O teu acesso VIP está pronto!</h3>
        <p className="text-zinc-400 text-sm mb-6">
          {PLAN_LABELS[status.plan] ?? status.plan} · válido até {expires}
        </p>
        <a
          href={status.telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-gold-light text-black font-bold text-base hover:opacity-90 transition-all duration-300"
        >
          <ExternalLink className="w-5 h-5" />
          Entrar no Grupo VIP
        </a>
      </motion.div>
    );
  }

  if (status.kind === "pending") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-5">
          <Loader2 className="w-7 h-7 text-gold animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-white mb-1">A preparar o teu acesso...</h3>
        <p className="text-zinc-400 text-sm">
          O pagamento foi confirmado. O link de acesso ao grupo aparece aqui em instantes.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center"
    >
      {username ? (
        <p className="text-zinc-400 text-sm">
          Sessão iniciada como <span className="text-white font-semibold">@{username}</span>
        </p>
      ) : (
        <>
          <h3 className="text-lg font-bold text-white mb-2">Entra com o Telegram</h3>
          <p className="text-zinc-400 text-sm mb-5">
            Faz login antes de pagar e o link de acesso ao grupo aparece diretamente
            aqui, sem precisares de abrir o Telegram.
          </p>
          <div ref={widgetRef} className="flex justify-center" />
        </>
      )}
    </motion.div>
  );
}
