"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  Zap,
  ChevronDown,
} from "lucide-react";

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    // Moving particles (original)
    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string;
    }[] = [];

    // Static twinkling stars
    const stars: {
      x: number; y: number; size: number;
      baseOpacity: number; opacity: number;
      twinkleSpeed: number; twinkleOffset: number;
      glow?: boolean; color?: string;
      vx?: number; vy?: number;
    }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#d4a853", "#f0d78c", "#22c55e", "#ffffff"];

    // Moving particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Static twinkling stars — 400 stars covering the whole hero
    const starColors = ["#ffffff", "#ffffff", "#ffffff", "#ffe8a0", "#d4f0ff"];
    for (let i = 0; i < 400; i++) {
      const base = Math.random() * 0.7 + 0.2;
      const isBright = Math.random() < 0.15; // 15% are large glowing stars
      const isDrifting = Math.random() < 0.35;  // 35% drift
      const speed = Math.random() < 0.2
        ? Math.random() * 0.5 + 0.3   // 20% fast
        : Math.random() < 0.5
          ? Math.random() * 0.15 + 0.05  // 40% medium
          : Math.random() * 0.04 + 0.005; // 40% very slow
      const angle = Math.random() * Math.PI * 2;
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: isBright ? Math.random() * 2.5 + 1.5 : Math.random() * 1.2 + 0.4,
        baseOpacity: isBright ? base * 1.2 : base,
        opacity: base,
        twinkleSpeed: Math.random() * 0.02 + 0.004,
        twinkleOffset: Math.random() * Math.PI * 2,
        glow: isBright,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        vx: isDrifting ? Math.cos(angle) * speed : 0,
        vy: isDrifting ? Math.sin(angle) * speed : 0,
      });
    }

    let frame = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Draw twinkling stars first (background layer)
      stars.forEach((s) => {
        // Drift movement
        if (s.vx || s.vy) {
          s.x += s.vx!;
          s.y += s.vy!;
          if (s.x < 0) s.x = canvas.width;
          if (s.x > canvas.width) s.x = 0;
          if (s.y < 0) s.y = canvas.height;
          if (s.y > canvas.height) s.y = 0;
        }

        s.opacity =
          s.baseOpacity +
          Math.sin(frame * s.twinkleSpeed + s.twinkleOffset) * (s.baseOpacity * 0.7);
        const alpha = Math.max(0, Math.min(1, s.opacity));

        if (s.glow) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = s.color ?? "#ffffff";
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color ?? "#ffffff";
        ctx.globalAlpha = alpha;
        ctx.fill();

        if (s.glow) {
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
        }
      });

      // Draw moving particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });

      // Draw connections
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = "#d4a853";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

const stats = [
  { value: "87%", label: "Win Rate", icon: TrendingUp },
  { value: "2400+", label: "Membros VIP", icon: Shield },
  { value: "24/7", label: "Suporte", icon: Zap },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,168,83,0.08)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(34,197,94,0.05)_0%,_transparent_50%)]" />

      {/* Particle field */}
      <ParticleField />

      {/* Animated ring */}
      <motion.div
        className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full border border-gold/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ zIndex: 1 }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border border-green-accent/5"
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        style={{ zIndex: 1 }}
      />

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-zinc-300 tracking-wide uppercase">
            Vagas Limitadas — Grupo VIP Exclusivo
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6"
        >
          <span className="block text-white">Transforma as tuas</span>
          <span className="block gradient-text mt-2">apostas em lucro</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Junta-te a{" "}
          <span className="text-white font-semibold">milhares de membros</span>{" "}
          que já lucram diariamente com os nossos palpites premium. Análises
          profissionais, resultados comprovados.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <a
            href="#pricing"
            className="group relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold to-gold-light text-black font-bold text-lg rounded-full overflow-hidden transition-all duration-300 hover:scale-105 glow-pulse"
          >
            <span className="relative z-10">Quero Entrar no VIP</span>
            <Zap className="relative z-10 w-5 h-5" />
            <div className="absolute inset-0 bg-gradient-to-r from-gold-light to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a
            href="#video"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-zinc-300 hover:text-white hover:border-white/30 transition-all duration-300"
          >
            <span>Ver Interior do Grupo</span>
            <span className="text-xl">▶</span>
          </a>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-wrap justify-center gap-8 sm:gap-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-gold" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-6 h-6 text-zinc-600" />
      </motion.div>
    </section>
  );
}
