"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

export default function VideoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [showUnmuteHint, setShowUnmuteHint] = useState(true);

  // Hide the unmute hint after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowUnmuteHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  function toggleMute() {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
    setShowUnmuteHint(false);
  }

  function togglePlay() {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  }

  return (
    <section
      id="video"
      ref={ref}
      className="relative py-14 sm:py-20 px-4 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,168,83,0.04)_0%,_transparent_70%)]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-gold text-sm font-semibold tracking-widest uppercase mb-4">
            Prova Real
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6">
            Vê o interior do{" "}
            <span className="gradient-text">grupo VIP</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Sem truques, sem promessas vazias. Vê com os teus próprios olhos o
            que os nossos membros recebem todos os dias.
          </p>
        </motion.div>

        {/* Video container */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative group"
        >
          {/* Glow border */}
          <div className="absolute -inset-1 bg-gradient-to-r from-gold/20 via-green-accent/20 to-gold/20 rounded-2xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Video wrapper */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900/80 border border-white/5">
            <div className="relative aspect-video min-h-[400px] sm:min-h-[520px] bg-gradient-to-br from-zinc-900 to-zinc-950">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              >
                <source src="/main-video.mp4" type="video/quicktime" />
                <source src="/main-video.mp4" type="video/mp4" />
                O teu browser não suporta vídeo HTML5.
              </video>

              {/* Play/Pause + Mute buttons */}
              <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-between px-4">
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-black/80 transition-all duration-200 cursor-pointer"
                  aria-label={playing ? "Pausar" : "Reproduzir"}
                >
                  {playing ? (
                    <><Pause className="w-4 h-4" /><span>Pausar</span></>
                  ) : (
                    <><Play className="w-4 h-4" /><span>Reproduzir</span></>
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-black/80 transition-all duration-200 cursor-pointer"
                  aria-label={muted ? "Ativar som" : "Desativar som"}
                >
                  {muted ? (
                    <><VolumeX className="w-4 h-4 text-zinc-400" /><span className="text-zinc-400">Som desativado</span></>
                  ) : (
                    <><Volume2 className="w-4 h-4 text-gold" /><span className="text-gold">Som ativo</span></>
                  )}
                </button>
              </div>

              {/* Unmute hint pulse */}
              {showUnmuteHint && muted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-14 right-4 z-10 px-3 py-1.5 rounded-full bg-gold text-black text-xs font-bold pointer-events-none"
                >
                  👆 Clica para ouvir
                </motion.div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center gap-4 px-6 py-4 bg-zinc-900/60 border-t border-white/5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-zinc-400">
                Gravação real do grupo VIP Footmillion
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
