"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star, Quote, ZoomIn, X } from "lucide-react";

const testimonials = [
  {
    image: "/testimonials/1.jpeg",
    name: "--",
    text: "Uma coisa é certa: só não faz dinheiro contigo quem não quer...",
  },
  {
    image: "/testimonials/2.jpeg",
    name: "--",
    text: "És o special one da NBA!",
  },
  {
    image: "/testimonials/3.jpeg",
    name: "--",
    text: "Obrigado mais uma vez pela tua ajuda. No final das contas cá temos sempre lucro...",
  },
  {
    image: "/testimonials/4.jpeg",
    name: "--",
    text: "Porra Pedro, que rei... Só greens hoje mano meu deus",
  },
];

function Lightbox({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative max-w-2xl w-full max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all duration-200"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <Image
              src={src}
              alt={`Testemunho de ${name}`}
              width={800}
              height={1000}
              className="w-full h-auto object-contain max-h-[85vh]"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
          <p className="text-center text-zinc-500 text-xs mt-3">Clica fora para fechar</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

  const itemsPerPage = 4;
  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  const next = () => setCurrentIndex((prev) => (prev + 1) % totalPages);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);

  const currentTestimonials = testimonials.slice(
    currentIndex * itemsPerPage,
    currentIndex * itemsPerPage + itemsPerPage
  );

  return (
    <section ref={ref} className="relative py-14 sm:py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,197,94,0.04)_0%,_transparent_60%)]" />

      {lightbox && (
        <Lightbox src={lightbox.src} name={lightbox.name} onClose={() => setLightbox(null)} />
      )}

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-gold text-sm font-semibold tracking-widest uppercase mb-4">
            Testemunhos
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
            O que dizem os{" "}
            <span className="gradient-text">nossos membros</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Resultados reais de pessoas reais. Estas sao mensagens autenticas
            dos nossos membros VIP.{" "}
            <span className="text-zinc-500 text-sm">Clica nas imagens para ampliar.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/60 mb-12 max-w-sm mx-auto"
        >
          <video
            className="w-full h-[600px] object-cover"
            controls
            preload="metadata"
            playsInline
          >
            <source src="/video.mp4" type="video/mp4" />
          </video>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {currentTestimonials.map((t, i) => (
            <motion.div
              key={`${currentIndex}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative glass rounded-2xl p-6 h-full flex flex-col card-hover">
                <Quote className="w-8 h-8 text-gold/20 mb-4" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-6 flex-grow">
                  &ldquo;{t.text}&rdquo;
                </p>
                <button
                  onClick={() => setLightbox({ src: t.image, name: t.name })}
                  className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-zinc-800/50 group/img cursor-zoom-in"
                  aria-label={`Ver testemunho de ${t.name} em tamanho completo`}
                >
                  <Image
                    src={t.image}
                    alt={`Testemunho de ${t.name}`}
                    fill
                    className="object-cover object-top group-hover/img:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-black font-bold text-xs">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-zinc-500 text-xs">Membro VIP</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-all duration-300"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? "bg-gold w-6" : "bg-zinc-600 hover:bg-zinc-400"
                  }`}
                  aria-label={`Pagina ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-all duration-300"
              aria-label="Proximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
