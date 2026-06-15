import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import VideoSection from "@/components/VideoSection";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
 
export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] overflow-x-hidden selection:bg-gold/30 selection:text-gold-light noise relative">
      <Hero />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
      <VideoSection />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <Stats />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
      <Pricing />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
      <Testimonials />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <FAQ />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
      <FinalCTA />
      <footer className="relative z-10 bg-[#050505] py-12 px-4 border-t border-white/5 text-center text-zinc-500 text-sm">
        <p className="gradient-text font-bold text-lg mb-2">Footmillion VIP</p>
        <p className="text-zinc-600">© 2026 Footmillion VIP. Todos os direitos reservados.</p>
        <p className="mt-4 text-xs opacity-60 max-w-xl mx-auto leading-relaxed">
          Apostas desportivas envolvem risco financeiro. Aposta de forma responsável e apenas com dinheiro que
          podes perder. Este serviço destina-se apenas a maiores de 18 anos.
          Resultados passados não garantem resultados futuros.
        </p>
      </footer>
    </main>
  );
}
