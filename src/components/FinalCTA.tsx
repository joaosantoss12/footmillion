"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap } from "lucide-react";

export default function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-14 sm:py-20 px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,168,83,0.08)_0%,_transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        <div className="glass rounded-3xl p-12 sm:p-16 relative overflow-hidden">
          {/* Glow edges */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6">
            Pronto para{" "}
            <span className="gradient-text">começar a lucrar</span>?
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-lg mx-auto">
            Junta-te aos milhares de membros que já transformaram as suas apostas
            desportivas em lucro consistente.
          </p>
          <a
            href="#pricing"
            className="group relative inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-gold to-gold-light text-black font-bold text-lg rounded-full overflow-hidden transition-all duration-300 hover:scale-105 glow-pulse"
          >
            <span className="relative z-10">Quero Entrar Agora</span>
            <Zap className="relative z-10 w-5 h-5" />
            <div className="absolute inset-0 bg-gradient-to-r from-gold-light to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <p className="text-zinc-600 text-xs mt-6">
            Vagas limitadas · Pagamento único · Acesso imediato
          </p>
        </div>
      </motion.div>
    </section>
  );
}
