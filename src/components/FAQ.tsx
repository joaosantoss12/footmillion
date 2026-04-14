"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Como funciona o grupo VIP?",
    answer:
      "Após o pagamento, recebes acesso imediato ao nosso grupo privado onde publicamos palpites diários, análises detalhadas e dicas de gestão de banca. Tudo é partilhado em tempo real.",
  },
  {
    question: "O pagamento é mesmo único? Sem subscrição?",
    answer:
      "Sim! Pagamento único sem qualquer renovação automática. Pagas uma vez e tens acesso durante o período escolhido (1 mês, 3 meses ou vitalício).",
  },
  {
    question: "Qual é o win rate dos palpites?",
    answer:
      "O nosso win rate médio histórico é de aproximadamente 87%. Publicamos o nosso track record completo e verificável no grupo.",
  },
  {
    question: "Em que plataforma funciona o grupo?",
    answer:
      "O grupo funciona no Telegram. Após o pagamento, recebes um convite privado para entrar no grupo exclusivo VIP.",
  },
  {
    question: "E se não gostar?",
    answer:
      "Temos confiança nos nossos resultados, mas compreendemos a tua hesitação. Experimenta o plano de 1 mês e vê por ti mesmo a qualidade dos nossos palpites antes de investir mais.",
  },
  {
    question: "Posso entrar a qualquer momento?",
    answer:
      "Sim, mas as vagas são limitadas para manter a qualidade do serviço. Quando atingirmos o limite, fecharemos novas inscrições temporariamente.",
  },
];

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section ref={ref} className="relative py-14 sm:py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(212,168,83,0.04)_0%,_transparent_60%)]" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-gold text-sm font-semibold tracking-widest uppercase mb-4">
            Dúvidas Frequentes
          </span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
            Perguntas{" "}
            <span className="gradient-text">frequentes</span>
          </h2>
        </motion.div>

        {/* FAQ items */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-3"
        >
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="glass rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors duration-200"
              >
                <span className="text-white font-semibold text-sm sm:text-base pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="px-5 pb-5 mt-3 text-zinc-400 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
