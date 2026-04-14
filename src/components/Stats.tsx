"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Trophy,
  Users,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Palpites Diários",
    description:
      "Recebe palpites selecionados diariamente com análise detalhada de cada evento.",
  },
  {
    icon: BarChart3,
    title: "Análise Profissional",
    description:
      "Cada palpite é analisado com estatísticas avançadas e dados reais.",
  },
  {
    icon: TrendingUp,
    title: "Gestão de Banca",
    description:
      "Aprende a gerir a tua banca como os profissionais e maximiza os teus lucros.",
  },
  {
    icon: Users,
    title: "Comunidade Exclusiva",
    description:
      "Faz parte de uma comunidade motivada e focada em resultados.",
  },
  {
    icon: Clock,
    title: "Suporte 24/7",
    description:
      "Equipa de suporte sempre disponível para ajudar com qualquer dúvida.",
  },
  {
    icon: Trophy,
    title: "Track Record Comprovado",
    description:
      "Histórico verificável de resultados com win rate consistente acima de 85%.",
  },
];

const counters = [
  { value: "€150K+", label: "Lucro total gerado" },
  { value: "87%", label: "Win rate médio" },
  { value: "2.400+", label: "Membros satisfeitos" },
  { value: "3 anos", label: "No mercado" },
];

export default function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-14 sm:py-20 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,168,83,0.03)_0%,_transparent_60%)]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Counters strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {counters.map((counter, i) => (
            <motion.div
              key={counter.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center glass rounded-2xl py-8 px-4"
            >
              <div className="text-3xl sm:text-4xl font-black gradient-text mb-2">
                {counter.value}
              </div>
              <div className="text-zinc-500 text-sm uppercase tracking-wider">
                {counter.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-gold text-sm font-semibold tracking-widest uppercase mb-4">
            Porquê Nós
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
            O que torna o Footmillion{" "}
            <span className="gradient-text">diferente</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Não somos apenas mais um grupo de apostas. Somos uma comunidade
            profissional focada em resultados consistentes.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative glass rounded-2xl p-6 h-full card-hover">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
