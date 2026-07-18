"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, CheckCircle2, LogOut } from "lucide-react";

type Status =
  | { kind: "loading" }
  | { kind: "logged_out" }
  | { kind: "none" }
  | { kind: "pending"; plan: string; expiresAt: string }
  | { kind: "ready"; plan: string; expiresAt: string; telegramLink: string };

type TelegramAuthData = {
  id_token?: string;
  user?: { preferred_username?: string; given_name?: string };
  error?: string;
};

type SessionUser = {
  username?: string;
  first_name: string;
  photo_url?: string;
};

declare global {
  interface Window {
    onTelegramAuth?: (data: TelegramAuthData) => void;
  }
}

const PLAN_LABELS: Record<string, string> = {
  monthly: "1 Mês",
  quarterly: "3 Meses",
  yearly: "1 Ano",
};

export default function TelegramGate() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [user, setUser] = useState<SessionUser | null>(null);
  const [generating, setGenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const [meRes, statusRes] = await Promise.all([
      fetch("/api/telegram/me"),
      fetch("/api/subscription/status"),
    ]);
    const me = await meRes.json();
    const sub = await statusRes.json();

    setUser(me.loggedIn ? me.user : null);
    setStatus(sub);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/telegram/logout", { method: "POST" });
    refresh();
    window.dispatchEvent(new Event("tg-auth"));
  }, [refresh]);

  // Fallback: mint a fresh single-use link when the subscription has none or
  // its link has expired. The server reuses a still-valid link if one exists.
  const generateLink = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/subscription/link", { method: "POST" });
      if (res.ok) {
        await refresh();
      } else {
        alert("Não foi possível gerar o link. Tenta novamente ou contacta o suporte.");
      }
    } catch {
      alert("Erro de ligação. Tenta novamente.");
    } finally {
      setGenerating(false);
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    // Sync when login/logout happens in another component on the page.
    window.addEventListener("tg-auth", refresh);
    return () => window.removeEventListener("tg-auth", refresh);
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

  // Registers the callback the telegram-login.js embed calls on auth.
  // Must be defined unconditionally (the library evals `onTelegramAuth(data)`
  // in global scope), otherwise we get "onTelegramAuth is not defined".
  useEffect(() => {
    window.onTelegramAuth = async (data: TelegramAuthData) => {
      console.log("onTelegramAuth data:", data);
      if (!data.id_token) {
        alert("Login sem id_token. data.error: " + (data.error ?? "(nenhum)"));
        return;
      }
      const res = await fetch("/api/telegram/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: data.id_token }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("login failed", res.status, body);
        alert("Login falhou (" + res.status + "): " + body);
        return;
      }
      refresh();
      window.dispatchEvent(new Event("tg-auth"));
    };
  }, [refresh]);

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
        <button
          onClick={generateLink}
          disabled={generating}
          className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all duration-300 disabled:opacity-60 disabled:cursor-wait"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          {generating ? "A gerar..." : "Gerar link de acesso"}
        </button>
        <p className="text-zinc-600 text-xs mt-3">
          Já pagaste e o link não aparece? Gera-o aqui (válido uma vez).
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
      {user ? (
        <div className="flex items-center justify-center gap-3">
          {user.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photo_url}
              alt={user.first_name}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover border border-white/10"
            />
          )}
          <div className="text-left">
            <p className="text-white font-semibold leading-tight">{user.first_name}</p>
            {user.username && (
              <p className="text-zinc-400 text-sm leading-tight">@{user.username}</p>
            )}
          </div>
          <button
            onClick={logout}
            className="ml-1 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Terminar sessão"
            title="Terminar sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-bold text-white mb-2">Entra com o Telegram</h3>
          <p className="text-zinc-400 text-sm mb-5">
            É <strong className="text-amber-300">obrigatório</strong> iniciar sessão com o
            Telegram para comprar. Depois do pagamento, o link de acesso ao grupo aparece
            aqui — sem precisares de abrir o Telegram.
          </p>
          <Script
            src="https://oauth.telegram.org/js/telegram-login.js?5"
            strategy="afterInteractive"
            data-client-id={process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID}
            data-onauth="onTelegramAuth(data)"
            data-request-access="write"
          />
          <div className="flex justify-center">
            <button className="tg-auth-button" data-style="shine">
              Entrar com Telegram
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
