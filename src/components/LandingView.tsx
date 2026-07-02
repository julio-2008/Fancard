import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import {
  ArrowRight,
  Check,
  Clock,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Zap,
  Users,
  Award,
} from "lucide-react";
import { FancardPreview } from "./FancardPreview";
import { PackageId } from "../types";

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Floating Particles Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 3 + Math.random() * 5,
  delay: Math.random() * 4,
  duration: 3 + Math.random() * 4,
}));

const FloatingParticles: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
    {PARTICLES.map((p) => (
      <motion.div
        key={p.id}
        className="absolute rounded-full bg-[#ffcc00]"
        style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
        animate={{
          y: [0, -40, -80],
          x: [0, 12 * (p.id % 2 === 0 ? 1 : -1), 0],
          opacity: [0, 0.7, 0],
          scale: [0.5, 1.2, 0.3],
        }}
        transition={{
          duration: p.duration,
          delay: p.delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Animated Counter Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const AnimatedCounter: React.FC<{ to: number; suffix?: string; prefix?: string }> = ({
  to, suffix = "", prefix = "",
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 70, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionVal.set(to);
  }, [inView, motionVal, to]);

  useEffect(() => {
    return spring.on("change", (v) => setDisplay(Math.round(v)));
  }, [spring]);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
};

interface LandingViewProps {
  onStartFlow: (packageId?: PackageId) => void;
  packagesRef: React.RefObject<HTMLDivElement | null>;
  onOpenArquibancada: () => void;
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Packages Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const packageCards: Array<{
  id: PackageId;
  title: string;
  subtitle: string;
  oldPrice: string;
  price: string;
  unit: string;
  deadline: string;
  badge: string;
  featured?: boolean;
  note: string;
}> = [
  {
    id: "individual",
    title: "Cromo Solo",
    subtitle: "1 FanCard personalizada",
    oldPrice: "",
    price: "R$ 8,97",
    unit: "menor entrada",
    deadline: "atÃƒÂ© 1 hora",
    badge: "COMECE AQUI",
    note: "Perfeito para testar a experiÃƒÂªncia sem compromisso alto. Receba sua arte digital pronta para postar ou imprimir.",
  },
  {
    id: "trio",
    title: "Trio TÃƒÂ¡tico",
    subtitle: "3 FanCards Ã¢â‚¬â€ casal, irmÃƒÂ£os ou amigos",
    oldPrice: "R$ 26,91",
    price: "R$ 17,90",
    unit: "R$ 5,97 cada",
    deadline: "atÃƒÂ© 2 horas",
    badge: "MAIS PEDIDO",
    note: "TrÃƒÂªs figurinhas personalizadas para quando vocÃƒÂª jÃƒÂ¡ quer fazer uma rodada maior.",
  },
  {
    id: "familia",
    title: "EscalaÃƒÂ§ÃƒÂ£o Completa",
    subtitle: "5 FanCards Ã¢â‚¬â€ famÃƒÂ­lia, amigos ou grupo",
    oldPrice: "R$ 44,85",
    price: "R$ 22,95",
    unit: "R$ 4,59 cada",
    deadline: "atÃƒÂ© 2 horas",
    badge: "MELHOR VALOR POR ARTE",
    featured: true,
    note: "O pacote ideal para transformar todo mundo em figurinha e pagar menos por arte.",
  },
];

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Before / After pairs (real social proof) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const socialProofPairs = [
  {
    name: "J. Cesar",
    location: "Sobradinho, BA",
    before: "/assets/provas/antes_julio.png",
    after: "/assets/provas/depois_julio.png",
  },
  {
    name: "J. Marinho",
    location: "Sobradinho, BA",
    before: "/assets/provas/antes_marinho.png",
    after: "/assets/provas/depois_marinho.png",
  },
  {
    name: "Matheus Sousa",
    location: "Santos FC, SP",
    before: "/assets/provas/antes_matheus.png",
    after: "/assets/provas/depois_matheus.png",
  },
  {
    name: "Carlos Almeida",
    location: "Flamengo, RJ",
    before: "/assets/provas/antes_carlos.png",
    after: "/assets/provas/depois_carlos.png",
  },
  {
    name: "Rafael Santos",
    location: "Fluminense, RJ",
    before: "/assets/provas/antes_rafael.png",
    after: "/assets/provas/depois_rafael.png",
  },
  {
    name: "J. Felipe",
    location: "Sobradinho, BA",
    before: "/assets/provas/antes_jfelipe.png",
    after: "/assets/provas/depois_jfelipe.png",
  },
  {
    name: "A. Micael",
    location: "SÃƒÂ£o Paulo, SP",
    before: "/assets/provas/antes_micael.png",
    after: "/assets/provas/depois_micael.png",
  },
];

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Hero sample cards (already in public/assets) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const sampleCards = [
  {
    name: "MATHEUS SOUSA",
    city: "SANTOS FC",
    uf: "SP",
    birthDate: "2013-09-27",
    height: "1.45",
    weight: "38",
    overall: 99,
    attributes: { vel: 99, fin: 99, pas: 99, dri: 99, def: 99, fis: 99 },
    photo: "/assets/matheus.png",
  },
  {
    name: "CARLOS ALMEIDA",
    city: "FLAMENGO",
    uf: "RJ",
    birthDate: "1986-03-15",
    height: "1.78",
    weight: "82",
    overall: 99,
    attributes: { vel: 99, fin: 99, pas: 99, dri: 99, def: 99, fis: 99 },
    photo: "/assets/carlos.png",
  },
  {
    name: "RAFAEL SANTOS",
    city: "FLUMINENSE",
    uf: "RJ",
    birthDate: "1987-04-12",
    height: "1.78",
    weight: "74",
    overall: 99,
    attributes: { vel: 99, fin: 99, pas: 99, dri: 99, def: 99, fis: 99 },
    photo: "/assets/rafael.png",
  },
];

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Social Proof Carousel Component Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const SocialProofCarousel: React.FC<{ onCTA: () => void }> = ({ onCTA }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const autoRef = useRef<number | null>(null);

  const total = socialProofPairs.length;

  const goTo = useCallback(
    (i: number) => {
      setActiveIndex((i + total) % total);
    },
    [total]
  );

  // Auto-play
  useEffect(() => {
    autoRef.current = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5000);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [total]);

  const resetAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5000);
  }, [total]);

  const prev = () => {
    goTo(activeIndex - 1);
    resetAuto();
  };
  const next = () => {
    goTo(activeIndex + 1);
    resetAuto();
  };

  const pair = socialProofPairs[activeIndex];

  return (
    <section className="bg-[#061f12] text-white py-16 md:py-22 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <p className="mono text-[10px] text-[#ffcc00] font-black uppercase">
            Resultados reais
          </p>
          <h2 className="display text-3xl sm:text-4xl md:text-5xl mt-3">
            Veja a reaÃ§Ã£o de quem se vÃª no resultado.
          </h2>
          <p className="mt-4 text-white/70 font-bold text-sm md:text-base">
            Quando a imagem fica pronta, ela deixa de ser sÃ³ um arquivo e vira presente, conversa e lembranÃ§a.
          </p>
        </div>

        {/* Carousel card */}
        <div
          className="relative max-w-4xl mx-auto"
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart === null) return;
            const diff = touchStart - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
              diff > 0 ? next() : prev();
            }
            setTouchStart(null);
          }}
        >
          <motion.div
            key={activeIndex}
            className="rounded-3xl border border-[#ffcc00]/30 bg-gradient-to-br from-[#0a3520] to-[#072816] p-5 md:p-8 shadow-2xl"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Label */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-black text-lg md:text-xl">{pair.name}</p>
                <p className="text-white/60 text-xs md:text-sm font-bold">
                  {pair.location}
                </p>
              </div>
              <span className="rounded-full bg-[#ffcc00] text-[#103c27] px-3 py-1 text-[10px] font-black uppercase">
                {activeIndex + 1}/{total}
              </span>
            </div>

            {/* Before / After grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-5">
              {/* BEFORE */}
              <div className="relative group">
                <div className="absolute top-2 left-2 z-10 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-white/90">
                  Ã°Å¸â€œÂ· Foto enviada
                </div>
                <div className="rounded-2xl overflow-hidden border-2 border-white/10 aspect-[3/4] bg-[#0a2518]">
                  <img
                    src={pair.before}
                    alt={`Foto original de ${pair.name}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* AFTER */}
              <div className="relative group">
                <div className="absolute top-2 left-2 z-10 rounded-full bg-[#ffcc00]/90 backdrop-blur-sm px-2.5 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-[#103c27]">
                  Ã¢Å¡Â½ FanCard pronta
                </div>
                <div className="rounded-2xl overflow-hidden border-2 border-[#ffcc00]/40 aspect-[3/4] bg-[#0a2518] shadow-[0_0_30px_rgba(255,204,0,0.15)]">
                  <img
                    src={pair.after}
                    alt={`FanCard de ${pair.name}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Arrow between */}
            <div className="flex items-center justify-center my-4 gap-2 text-[#ffcc00]">
              <div className="h-px flex-1 bg-[#ffcc00]/20" />
              <ArrowRight className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-black uppercase">
                TransformaÃƒÂ§ÃƒÂ£o digital
              </span>
              <ArrowRight className="w-5 h-5 animate-pulse" />
              <div className="h-px flex-1 bg-[#ffcc00]/20" />
            </div>
          </motion.div>

          {/* Nav arrows */}
          <button
            type="button"
            onClick={prev}
            className="absolute left-[-16px] md:left-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#ffcc00] text-[#103c27] flex items-center justify-center shadow-xl hover:scale-110 transition z-20"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-[-16px] md:right-[-24px] top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#ffcc00] text-[#103c27] flex items-center justify-center shadow-xl hover:scale-110 transition z-20"
            aria-label="PrÃƒÂ³ximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {socialProofPairs.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                goTo(i);
                resetAuto();
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "bg-[#ffcc00] scale-125"
                  : "bg-white/25 hover:bg-white/50"
              }`}
              aria-label={`Ir para prova ${i + 1}`}
            />
          ))}
        </div>

        {/* CTA under carousel */}
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={onCTA}
            className="inline-flex items-center gap-2 rounded-full bg-[#ffcc00] text-[#103c27] px-6 py-3 font-black text-sm hover:bg-white transition shadow-xl"
          >
            Quero a minha tambÃƒÂ©m
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
   LANDING VIEW Ã¢â‚¬â€ Full page
   Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */

export const LandingView: React.FC<LandingViewProps> = ({
  onStartFlow,
  packagesRef,
}) => {
  const [feedbacks, setFeedbacks] = useState<
    Array<{
      id: string;
      name: string;
      packageName: string;
      rating: number;
      comment: string;
    }>
  >([]);

  useEffect(() => {
    fetch("/api/feedbacks/public")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setFeedbacks(Array.isArray(data) ? data : []))
      .catch(() => setFeedbacks([]));
  }, []);

  const startPackage = (packageId?: PackageId) => {
    navigator.vibrate?.(35);
    onStartFlow(packageId ?? "individual");
  };

  return (
    <div className="w-full bg-[#fffdf7] pb-24 md:pb-0">
      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Sticky bottom bar (clean, no fake scarcity) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[70] bg-[#061f12] text-white border-t border-[#ffcc00]/50 shadow-2xl md:inset-x-auto md:right-4 md:bottom-4 md:w-[420px] md:rounded-2xl md:border"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5, type: "spring", stiffness: 200 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <motion.span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ffcc00] text-[#103c27] shrink-0"
              animate={{ scale: [1, 1.15, 1], boxShadow: ["0 0 0px #ffcc00", "0 0 14px #ffcc00aa", "0 0 0px #ffcc00"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.span>
            <p className="text-[10px] md:text-sm font-extrabold truncate">
              Sua figurinha digital a partir de{" "}
              <span className="text-[#ffcc00]">R$ 8,97</span>
            </p>
          </div>
          <motion.button
            type="button"
            onClick={() => startPackage("individual")}
            className="shrink-0 rounded-full bg-[#ffcc00] text-[#103c27] px-3 md:px-5 py-1.5 md:py-2 text-[10px] md:text-sm font-black hover:bg-white transition"
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
          >
            Criar agora
          </motion.button>
        </div>
      </motion.div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ HERO SECTION Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="relative min-h-[760px] md:min-h-[820px] overflow-hidden flex items-center pt-14 md:pt-20">
        <img
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none brightness-[0.42]"
          src="/assets/fundo-estadio.jpg"
          alt="EstÃƒÂ¡dio de futebol"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#062013]/70 to-[#061f12]" />

        {/* Floating particles on hero */}
        <FloatingParticles />

        {/* Decorative orb top-right */}
        <motion.div
          className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(255,204,0,0.12) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Decorative orb bottom-left */}
        <motion.div
          className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(13,95,56,0.25) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-14 w-full">
          <div className="grid lg:grid-cols-[1fr_0.95fr] gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              {/* Animated gradient badge */}
              <motion.div
                className="inline-flex items-center gap-2 rounded-full text-[#103c27] px-3.5 py-1.5 font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl animate-neon-border border border-[#ffcc00]"
                style={{ background: "linear-gradient(90deg, #ffcc00, #ffe066, #ffcc00)" }}
                animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <motion.span
                  animate={{ rotate: [0, 20, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.span>
                Arte digital personalizada
              </motion.div>

              <h1 className="display mt-6 max-w-4xl text-4xl sm:text-5xl md:text-7xl text-white leading-[0.95]">
                Sua foto vira{" "}
                <span className="animate-gradient-text">figurinha digital</span>{" "}
                estilo Copa.
              </h1>
              <p className="mt-5 max-w-2xl text-white/88 text-base md:text-xl leading-relaxed font-bold">
                Envie sua foto e receba uma arte digital HD personalizada Ã¢â‚¬â€
                pronta para postar no Instagram, WhatsApp ou imprimir como
                adesivo.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-1.5 max-w-sm">
                {[
                  ["R$ 8,97", "a partir de"],
                  ["1 hora", "entrega digital"],
                  ["HD", "postar e imprimir"],
                ].map(([value, label], index) => (
                  <motion.div
                    key={label}
                    className="rounded-lg border border-[#ffcc00]/60 bg-[#061f12] px-2 py-1.5 shadow-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.3 + index * 0.1,
                    }}
                  >
                    <p className="text-[#ffcc00] text-base md:text-xl font-black leading-none">
                      {value}
                    </p>
                    <p className="text-white/75 text-[8px] md:text-[10px] font-bold uppercase mt-1 leading-tight">
                      {label}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-7 flex">
                <motion.button
                  type="button"
                  onClick={() => startPackage("individual")}
                  className="inline-flex items-center justify-center gap-3 bg-[#ffcc00] text-[#103c27] px-6 sm:px-8 py-3.5 rounded-full font-black hover:bg-white transition shadow-2xl text-sm sm:text-base"
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{ boxShadow: ["0 8px 30px #ffcc0050", "0 8px 50px #ffcc0099", "0 8px 30px #ffcc0050"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  TESTAR AGORA POR R$ 8,97
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => packagesRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="ml-3 inline-flex items-center justify-center gap-2 rounded-full border border-[#ffcc00]/50 bg-white/8 px-5 py-3.5 text-sm font-black text-white backdrop-blur-sm transition hover:bg-white/12"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver provas reais
                </motion.button>
              </div>

              <p className="mt-4 text-white/70 text-xs md:text-sm font-semibold">
                Entrega digital. Sua arte fica pronta no mesmo dia, sem depender
                de dia ÃƒÂºtil.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Mercado Pago seguro",
                  "Arquivo HD para postar ou imprimir",
                  "VocÃƒÂª vÃƒÂª o antes/depois antes de decidir",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full border border-white/12 bg-white/7 px-3 py-1 text-[10px] sm:text-xs font-black text-white/85"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative h-[430px] sm:h-[520px]"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <motion.div
                className="absolute left-1/2 top-4 z-30 -translate-x-1/2 rotate-[-3deg]"
                animate={{ y: [0, -10, 0], rotate: [-3, -1, -3] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <FancardPreview
                  cardData={sampleCards[1]}
                  photo={sampleCards[1].photo}
                  size="md"
                  isFullCard
                />
              </motion.div>
              <motion.div
                className="absolute left-2 sm:left-10 top-24 z-20 rotate-[-14deg] scale-75 sm:scale-90"
                animate={{ x: [0, -8, 0], rotate: [-14, -17, -14] }}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <FancardPreview
                  cardData={sampleCards[2]}
                  photo={sampleCards[2].photo}
                  size="sm"
                  isFullCard
                />
              </motion.div>
              <motion.div
                className="absolute right-0 sm:right-10 top-24 z-20 rotate-[12deg] scale-75 sm:scale-90"
                animate={{ x: [0, 8, 0], rotate: [12, 15, 12] }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <FancardPreview
                  cardData={sampleCards[0]}
                  photo={sampleCards[0].photo}
                  size="sm"
                  isFullCard
                />
              </motion.div>
              <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-yellow-primary px-5 py-2 text-green-deep font-black text-[11px] uppercase tracking-widest shadow-xl">
                pronta para postar e imprimir
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Stats bar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="bg-[#ffcc00] py-4 overflow-hidden border-b-2 border-[#103c27]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex flex-wrap justify-center gap-6 md:gap-16">
            {[
              { icon: Users, value: 200, suffix: "+", label: "pedidos entregues" },
              { icon: Zap,   value: 1,   suffix: "h", prefix: "< ", label: "tempo mÃƒÂ©dio de entrega" },
              { icon: Award, value: 100, suffix: "%", label: "satisfaÃƒÂ§ÃƒÂ£o garantida" },
            ].map(({ icon: Icon, value, suffix, prefix, label }, i) => (
              <motion.div
                key={label}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
              >
                <motion.span
                  className="w-9 h-9 rounded-full bg-[#103c27] text-[#ffcc00] flex items-center justify-center shrink-0"
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Icon className="w-4 h-4" />
                </motion.span>
                <div>
                  <p className="text-[#103c27] font-black text-lg leading-none">
                    <AnimatedCounter to={value} suffix={suffix} prefix={prefix} />
                  </p>
                  <p className="text-[#103c27]/70 text-[10px] font-bold uppercase">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Trust badges Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="border-b border-line-border bg-white py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-3 gap-4">
          {[
            [
              ShieldCheck,
              "Foto conferida",
              "A arte sÃƒÂ³ entra em produÃƒÂ§ÃƒÂ£o com foto onde o rosto aparece bem.",
            ],
            [
              Clock,
              "Entrega em atÃƒÂ© 1 hora",
              "Sua FanCard digital fica pronta e disponÃƒÂ­vel para download no mesmo dia.",
            ],
            [
              Mail,
              "Download no seu pedido",
              "Quando ficar pronto, o arquivo HD aparece no link do pedido. Sem spam.",
            ],
          ].map(([Icon, title, text], i) => (
            <motion.article
              key={String(title)}
              className="card-shimmer rounded-2xl border border-line-border bg-[#fff9e9] p-5"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.15, type: "spring", stiffness: 160 }}
              whileHover={{ y: -6, boxShadow: "0 16px 40px rgba(16,60,39,0.14)" }}
            >
              <motion.span
                className="inline-block mb-3"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.4 }}
              >
                {React.createElement(Icon as typeof ShieldCheck, {
                  className: "w-6 h-6 text-green-primary",
                })}
              </motion.span>
              <h2 className="font-black text-[#103c27]">{title as string}</h2>
              <p className="text-sm text-[#65756b] font-semibold mt-2">
                {text as string}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ─── Conexão real ───────────────────────────────────────────────── */}
      <section className="bg-[#061f12] text-white py-16 md:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <p className="mono text-[10px] text-[#ffcc00] font-black uppercase">
              Conexão real
            </p>
            <h2 className="display text-3xl md:text-5xl mt-3">
              Feito para entrar na brincadeira da Copa.
            </h2>
            <p className="mt-5 text-white/75 font-semibold leading-relaxed max-w-2xl">
              A ideia não é empurrar mais um arquivo para a sua pasta. É fazer a pessoa se ver dentro da festa: mandar no grupo, postar nos stories, guardar a lembrança e sentir que "agora eu também faço parte".
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Presente que vira reação imediata",
                "Memória de jogo, família ou pelada",
                "Sua foto com clima de estádio",
              ].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] sm:text-xs font-black text-white/85"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              [MessageCircle, "No grupo", "a figurinha vira assunto antes mesmo do jogo começar"],
              [Users, "No presente", "é diferente porque parece feito sob medida para alguém"],
              [Trophy, "Na lembrança", "não some na timeline; fica guardada com valor emocional"],
            ].map(([Icon, title, text], index) => (
              <motion.article
                key={String(title)}
                className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-sm shadow-2xl"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                whileHover={{ y: -6, boxShadow: "0 18px 46px rgba(0,0,0,0.25)" }}
              >
                <span className="w-10 h-10 rounded-2xl bg-[#ffcc00] text-[#103c27] flex items-center justify-center shadow-lg">
                  {React.createElement(Icon as typeof MessageCircle, {
                    className: "w-5 h-5",
                  })}
                </span>
                <h3 className="mt-4 font-black text-lg text-white">{title as string}</h3>
                <p className="mt-2 text-sm text-white/70 font-semibold leading-relaxed">
                  {text as string}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ How it works (step by step) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="bg-[#ffcc00] py-12 md:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <motion.div
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <div>
              <p className="mono text-[10px] text-green-primary font-black uppercase">
                Da foto ao cromo
              </p>
              <h2 className="display text-3xl md:text-5xl text-[#103c27] mt-2">
                Como funciona: 4 passos simples.
              </h2>
            </div>
            <p className="max-w-md text-[#103c27]/75 text-sm md:text-base font-bold">
              Processo rápido, visual e fácil de acompanhar — da sua foto até a
              arte final, sem tirar a sensação de Copa da página.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              [
                ImageIcon,
                "Envie sua foto",
                "suba uma foto com rosto visÃƒÂ­vel e boa iluminaÃƒÂ§ÃƒÂ£o",
              ],
              [
                Sparkles,
                "Recorte profissional",
                "sua foto recebe tratamento e encaixe na figurinha",
              ],
              [
                Trophy,
                "Dados personalizados",
                "nome, cidade/UF e estilo entram no layout da Copa",
              ],
              [
                Check,
                "Download HD pronto",
                "o arquivo aparece no seu pedido para baixar e usar",
              ],
            ].map(([Icon, title, text], index) => (
              <motion.article
                key={String(title)}
                className="relative rounded-xl bg-white p-3.5 md:p-4 border-2 border-[#103c27] shadow-[0_4px_0_#103c27]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#103c27] text-[#ffcc00] flex items-center justify-center">
                    {React.createElement(Icon as typeof ImageIcon, {
                      className: "w-4 h-4",
                    })}
                  </span>
                  <span className="mono text-[10px] text-[#103c27] font-black">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-base md:text-lg font-black text-[#103c27]">
                  {title as string}
                </h3>
                <p className="mt-1.5 text-xs md:text-sm font-bold text-[#103c27]/75">
                  {text as string}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ SOCIAL PROOF: Before / After carousel Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <SocialProofCarousel onCTA={() => startPackage()} />

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Packages / pricing Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section
        ref={packagesRef}
        id="packages"
        className="relative max-w-7xl mx-auto px-5 md:px-8 py-18 md:py-24 overflow-hidden"
      >
        {/* Background orbs */}
        <motion.div
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none opacity-30"
          style={{ background: "radial-gradient(circle, #ffcc0044 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, #0d5f3844 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="mono text-[10px] text-green-primary font-black uppercase">
            Escolha seu pacote
          </p>
          <h2 className="display text-4xl md:text-6xl text-[#103c27] mt-2">
            Comece pelo teste. Se gostar, suba o pacote.
          </h2>
          <p className="mt-4 text-[#65756b] text-base md:text-lg leading-relaxed font-bold">
            O caminho mais fÃƒÂ¡cil ÃƒÂ© experimentar por R$ 8,97 e ver o resultado antes de decidir o resto.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {packageCards.map((card, idx) => (
            <motion.article
              key={card.id}
              className={`card-shimmer relative rounded-3xl p-7 border shadow-lg flex flex-col ${
                card.featured
                  ? "bg-[#072816] text-white border-[#ffcc00] md:scale-[1.03] animate-neon-border"
                  : "bg-white text-[#103c27] border-line-border"
              }`}
              initial={{ opacity: 0, y: 40, scale: 0.93 }}
              whileInView={{ opacity: 1, y: 0, scale: card.featured ? 1.03 : 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: idx * 0.12, type: "spring", stiffness: 140 }}
              whileHover={{
                y: -8,
                boxShadow: card.featured
                  ? "0 20px 60px rgba(255,204,0,0.25)"
                  : "0 16px 40px rgba(16,60,39,0.12)"
              }}
            >
              {card.featured && (
                <div className="absolute -top-4 left-5 right-5 rounded-full bg-[#ffcc00] text-[#2a0606] border-2 border-[#2a0606] px-3 py-1.5 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xl">
                  Mais popular Ã‚Â· Melhor valor
                </div>
              )}
              <span
                className={`w-max rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                  card.featured
                    ? "mt-3 bg-[#ffcc00] text-green-deep"
                    : "bg-[#ecf4ee] text-green-primary"
                }`}
              >
                {card.badge}
              </span>
              <h3 className="mt-6 text-2xl font-black">{card.title}</h3>
              <p
                className={`mt-2 text-sm font-bold ${
                  card.featured ? "text-white/70" : "text-[#65756b]"
                }`}
              >
                {card.subtitle}
              </p>
              <div className="mt-6">
                {card.oldPrice && (
                  <p className="text-sm font-black text-red-400 line-through">
                    De {card.oldPrice}
                  </p>
                )}
                <p className="text-4xl md:text-5xl font-black leading-none">
                  {card.price}
                </p>
                <p
                  className={`mt-2 text-xs font-black uppercase ${
                    card.featured
                      ? "text-yellow-primary"
                      : "text-green-primary"
                  }`}
                >
                  {card.unit} Ã¢â‚¬â€ entrega {card.deadline}
                </p>
              </div>
              <p
                className={`mt-5 text-sm leading-relaxed font-semibold ${
                  card.featured ? "text-white/76" : "text-[#65756b]"
                }`}
              >
                {card.note}
              </p>
              <motion.button
                type="button"
                onClick={() => startPackage(card.id)}
                className={`mt-8 rounded-full px-5 py-3.5 font-black text-sm uppercase tracking-wider transition ${
                  card.featured
                    ? "bg-[#ffcc00] text-green-deep hover:bg-white pulse-ring"
                    : "border-2 border-green-primary text-green-primary hover:bg-green-primary hover:text-white"
                }`}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
              >
                Escolher este pacote
              </motion.button>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Detailed steps Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="bg-gradient-animated mesh-overlay text-white py-16 md:py-22 relative overflow-hidden scanline">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <p className="mono text-[10px] text-[#ffcc00] font-black uppercase">
              Passo a passo do pedido
            </p>
            <h2 className="display text-4xl md:text-5xl mt-3">
              Quatro passos. Sem complicaÃƒÂ§ÃƒÂ£o.
            </h2>
            <p className="mt-5 text-white/75 font-semibold leading-relaxed">
              Escolha o pacote, envie a foto, pague pelo Mercado Pago e
              acompanhe tudo pelo link do pedido.
            </p>
          </motion.div>
          <div className="space-y-0">
            {[
              [
                "1",
                "Escolha o pacote",
                "Individual (1), Trio (3) ou FamÃƒÂ­lia (5 figurinhas).",
              ],
              [
                "2",
                "Envie foto e dados",
                "Nome, e-mail, cidade/UF e os dados do card.",
              ],
              [
                "3",
                "Pagamento seguro",
                "Checkout protegido pelo Mercado Pago. Pix ou cartÃƒÂ£o.",
              ],
              [
                "4",
                "Baixe sua FanCard",
                "A arte HD aparece no link do seu pedido para download.",
              ],
            ].map(([number, title, text], index) => (
              <motion.article
                key={number}
                className="relative flex gap-5 pb-7 last:pb-0"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.12 }}
              >
                {index < 3 && (
                  <span className="absolute left-5 top-10 bottom-0 w-0.5 bg-[#ffcc00]" />
                )}
                <motion.span
                  className="relative z-10 w-10 h-10 rounded-full bg-[#ffcc00] text-green-deep flex items-center justify-center font-black shrink-0 shadow-lg"
                  whileHover={{ scale: 1.2, rotate: 8 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {number}
                </motion.span>
                <div className="pt-0.5">
                  <h3 className="font-black text-lg text-white">{title}</h3>
                  <p className="mt-1.5 text-sm text-white/70 font-semibold leading-relaxed">
                    {text}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ FAQ Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="bg-white py-18 md:py-24 border-b border-line-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <p className="mono text-[10px] text-green-primary font-black uppercase">
              DÃƒÂºvidas frequentes
            </p>
            <h2 className="display text-4xl md:text-5xl text-[#103c27] mt-3">
              Perguntas e respostas diretas.
            </h2>
            <p className="mt-4 text-[#65756b] font-bold">
              Tudo que vocÃƒÂª precisa saber antes de criar sua figurinha digital.
            </p>
          </motion.div>
          <div className="space-y-3">
            {[
              [
                "O que eu recebo exatamente?",
                "Uma arte digital em alta resoluÃƒÂ§ÃƒÂ£o (arquivo de imagem HD) com sua foto estilizada como figurinha de Copa do Mundo. VocÃƒÂª pode postar direto nas redes sociais ou levar a uma grÃƒÂ¡fica para imprimir como adesivo.",
              ],
              [
                "Como imprimir?",
                "Leve o arquivo para uma grÃƒÂ¡fica e peÃƒÂ§a papel adesivo fotogrÃƒÂ¡fico brilhante, laminaÃƒÂ§ÃƒÂ£o com brilho e corte individual. Ãƒâ€° o acabamento mais prÃƒÂ³ximo de uma figurinha fÃƒÂ­sica.",
              ],
              [
                "E se minha foto nÃƒÂ£o servir?",
                "A foto precisa mostrar o rosto com luz e nitidez. Se nÃƒÂ£o der para usar, o pedido informa o problema antes da arte final Ã¢â‚¬â€ sem cobrar de novo.",
              ],
              [
                "Pagamento ÃƒÂ© seguro?",
                "Sim. O pagamento ÃƒÂ© processado pelo Mercado Pago, a maior plataforma de pagamentos do Brasil. Aceitamos Pix e cartÃƒÂ£o de crÃƒÂ©dito.",
              ],
              [
                "Preciso ficar no site?",
                "NÃƒÂ£o. O pedido fica salvo e o link pode ser acessado depois pelo e-mail usado na compra. Quando a arte ficar pronta, o download aparece lÃƒÂ¡.",
              ],
            ].map(([question, answer], i) => (
              <motion.details
                key={question}
                className="group rounded-2xl border border-line-border bg-[#fff9e9] p-5"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-black text-[#103c27]">
                  {question}
                  <span className="text-green-primary group-open:rotate-45 transition-transform duration-200">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-[#65756b] leading-relaxed font-semibold">
                  {answer}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Feedbacks from API (conditional) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {feedbacks.length > 0 && (
        <section className="bg-[#fffdf7] py-16 border-b border-line-border">
          <div className="max-w-7xl mx-auto px-5 md:px-8">
            <motion.div
              className="text-center max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
            >
              <p className="mono text-green-primary font-black uppercase text-xs">
                AvaliaÃƒÂ§ÃƒÂµes reais
              </p>
              <h2 className="display text-4xl text-[#103c27] mt-2">
                Quem recebeu jÃƒÂ¡ avaliou.
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-5">
              {feedbacks.slice(0, 6).map((feedback, i) => (
                <motion.article
                  key={feedback.id}
                  className="border border-line-border rounded-2xl p-5 bg-white"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.09 }}
                  whileHover={{ y: -5, boxShadow: "0 12px 28px rgba(16,60,39,0.09)" }}
                >
                  <div className="text-yellow-500 text-sm font-black mb-3">
                    {"Ã¢Ëœâ€¦".repeat(Math.max(1, Math.min(5, feedback.rating)))}
                  </div>
                  <p className="text-[#103c27] font-bold text-sm leading-relaxed">
                    &ldquo;{feedback.comment}&rdquo;
                  </p>
                  <p className="mt-4 text-xs font-black text-green-primary">
                    {feedback.name}
                  </p>
                  <p className="text-[10px] text-[#65756b] font-bold mt-1">
                    {feedback.packageName}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Final CTA Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-18">
        <motion.div
          className="scanline relative overflow-hidden rounded-[30px] bg-gradient-animated text-white p-7 md:p-12 shadow-2xl mesh-overlay"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          {/* Floating particles inside CTA */}
          <FloatingParticles className="opacity-40" />
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            src="/assets/imagem.png"
            alt="EstÃƒÂ¡dio iluminado"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.15 }}
            >
              <p className="mono text-[10px] text-yellow-primary font-black uppercase">
                Comece agora
              </p>
              <h2 className="display text-3xl md:text-5xl mt-3">
                Crie sua figurinha digital e receba em atÃƒÂ© 1 hora.
              </h2>
              <p className="mt-4 text-white/75 font-semibold max-w-xl">
                Envie sua foto, personalize os dados e receba uma arte HD Ã¢â‚¬â€
                pronta para postar ou imprimir como adesivo.
              </p>
            </motion.div>
            <motion.button
              type="button"
              onClick={() => startPackage("individual")}
              className="rounded-full bg-[#ffcc00] text-green-deep px-6 md:px-8 py-3.5 md:py-4 font-black hover:bg-white transition"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.3, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.96 }}
              animate={{ boxShadow: ["0 0 0px #ffcc0000", "0 0 40px #ffcc0088", "0 0 0px #ffcc0000"] }}
            >
              Testar agora Ã¢â‚¬â€ R$ 8,97
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Footer Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <footer className="border-t border-line-border py-10 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col md:flex-row gap-5 md:items-start md:justify-between">
          <div>
            <p className="mono text-[10px] text-[#365342] font-black">
              FANCARD BRASIL Ã‚Â© 2026
            </p>
            <p className="text-sm text-muted-text mt-2 font-bold">
              Sua foto, sua figurinha digital personalizada.
            </p>
            <a
              href="https://wa.me/5575988310633"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-green-primary hover:underline"
            >
              <MessageCircle className="w-4 h-4" />
              Fale conosco no WhatsApp
            </a>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex items-center gap-2 text-[#65756b]">
              <ShieldCheck className="w-4 h-4 text-green-primary" />
              <span className="text-xs font-bold">
                Pagamento seguro via Mercado Pago
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#7e8a83] max-w-2xl md:text-right font-medium">
              ServiÃƒÂ§o independente de arte digital personalizada. NÃƒÂ£o possui
              afiliaÃƒÂ§ÃƒÂ£o com FIFA, CBF, Panini, clubes ou federaÃƒÂ§ÃƒÂµes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
