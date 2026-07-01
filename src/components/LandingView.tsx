import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "motion/react";
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
} from "lucide-react";
import { FancardPreview } from "./FancardPreview";
import { PackageId } from "../types";

interface LandingViewProps {
  onStartFlow: (packageId?: PackageId) => void;
  packagesRef: React.RefObject<HTMLDivElement | null>;
  onOpenArquibancada: () => void;
}

/* ─── Packages ──────────────────────────────────────────── */

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
    id: "familia",
    title: "Escalação Completa",
    subtitle: "5 FanCards — família, amigos ou grupo",
    oldPrice: "R$ 44,85",
    price: "R$ 22,95",
    unit: "R$ 4,59 cada",
    deadline: "até 2 horas",
    badge: "MELHOR VALOR POR ARTE",
    featured: true,
    note: "O pacote ideal para transformar todo mundo em figurinha e pagar menos por arte.",
  },
  {
    id: "trio",
    title: "Trio Tático",
    subtitle: "3 FanCards — casal, irmãos ou amigos",
    oldPrice: "R$ 26,91",
    price: "R$ 17,90",
    unit: "R$ 5,97 cada",
    deadline: "até 2 horas",
    badge: "MAIS PEDIDO",
    note: "Três figurinhas personalizadas para não deixar ninguém de fora.",
  },
  {
    id: "individual",
    title: "Cromo Solo",
    subtitle: "1 FanCard personalizada",
    oldPrice: "",
    price: "R$ 8,97",
    unit: "menor entrada",
    deadline: "até 1 hora",
    badge: "COMECE AQUI",
    note: "Perfeito para experimentar. Receba sua arte digital pronta para postar ou imprimir.",
  },
];

/* ─── Before / After pairs (real social proof) ──────────── */

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
    location: "São Paulo, SP",
    before: "/assets/provas/antes_micael.png",
    after: "/assets/provas/depois_micael.png",
  },
];

/* ─── Hero sample cards (already in public/assets) ──────── */

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

/* ─── Social Proof Carousel Component ───────────────────── */

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
            Veja o antes e depois de quem já fez.
          </h2>
          <p className="mt-4 text-white/70 font-bold text-sm md:text-base">
            Pessoas reais que enviaram a foto e receberam a FanCard digital
            personalizada.
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
                  📷 Foto enviada
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
                  ⚽ FanCard pronta
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
                Transformação digital
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
            aria-label="Próximo"
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
            Quero a minha também
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   LANDING VIEW — Full page
   ═══════════════════════════════════════════════════════════ */

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
    onStartFlow(packageId);
  };

  return (
    <div className="w-full bg-[#fffdf7] pb-24 md:pb-0">
      {/* ─── Sticky bottom bar (clean, no fake scarcity) ──── */}
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

      {/* ─── HERO SECTION ──────────────────────────────────── */}
      <section className="relative min-h-[760px] md:min-h-[820px] overflow-hidden flex items-center pt-14 md:pt-20">
        <img
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none brightness-[0.42]"
          src="/assets/fundo-estadio.jpg"
          alt="Estádio de futebol"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#062013]/70 to-[#061f12]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-14 w-full">
          <div className="grid lg:grid-cols-[1fr_0.95fr] gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ffcc00] text-[#103c27] px-3.5 py-1.5 font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl">
                <Sparkles className="w-4 h-4" />
                Arte digital personalizada
              </div>

              <h1 className="display mt-6 max-w-4xl text-4xl sm:text-5xl md:text-7xl text-white leading-[0.95]">
                Sua foto vira figurinha digital estilo Copa.
              </h1>
              <p className="mt-5 max-w-2xl text-white/88 text-base md:text-xl leading-relaxed font-bold">
                Envie sua foto e receba uma arte digital HD personalizada —
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
                  onClick={() => startPackage()}
                  className="inline-flex items-center justify-center gap-3 bg-[#ffcc00] text-[#103c27] px-6 sm:px-8 py-3.5 rounded-full font-black hover:bg-white transition shadow-2xl text-sm sm:text-base"
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{ boxShadow: ["0 8px 30px #ffcc0050", "0 8px 50px #ffcc0099", "0 8px 30px #ffcc0050"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  CRIAR MINHA FIGURINHA
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </motion.button>
              </div>

              <p className="mt-4 text-white/70 text-xs md:text-sm font-semibold">
                Entrega digital. Sua arte fica pronta no mesmo dia, sem depender
                de dia útil.
              </p>
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

      {/* ─── Trust badges ──────────────────────────────────── */}
      <section className="border-b border-line-border bg-white py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-3 gap-4">
          {[
            [
              ShieldCheck,
              "Foto conferida",
              "A arte só entra em produção com foto onde o rosto aparece bem.",
            ],
            [
              Clock,
              "Entrega em até 1 hora",
              "Sua FanCard digital fica pronta e disponível para download no mesmo dia.",
            ],
            [
              Mail,
              "Download no seu pedido",
              "Quando ficar pronto, o arquivo HD aparece no link do pedido. Sem spam.",
            ],
          ].map(([Icon, title, text], i) => (
            <motion.article
              key={String(title)}
              className="rounded-2xl border border-line-border bg-[#fff9e9] p-5"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(16,60,39,0.10)" }}
            >
              {React.createElement(Icon as typeof ShieldCheck, {
                className: "w-6 h-6 text-green-primary mb-3",
              })}
              <h2 className="font-black text-[#103c27]">{title as string}</h2>
              <p className="text-sm text-[#65756b] font-semibold mt-2">
                {text as string}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ─── How it works (step by step) ───────────────────── */}
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
              arte final.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              [
                ImageIcon,
                "Envie sua foto",
                "suba uma foto com rosto visível e boa iluminação",
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

      {/* ─── SOCIAL PROOF: Before / After carousel ─────────── */}
      <SocialProofCarousel onCTA={() => startPackage()} />

      {/* ─── Packages / pricing ────────────────────────────── */}
      <section
        ref={packagesRef}
        id="packages"
        className="max-w-7xl mx-auto px-5 md:px-8 py-18 md:py-24"
      >
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="mono text-[10px] text-green-primary font-black uppercase">
            Escolha seu pacote
          </p>
          <h2 className="display text-4xl md:text-6xl text-[#103c27] mt-2">
            Quanto mais figurinhas, menor o preço.
          </h2>
          <p className="mt-4 text-[#65756b] text-base md:text-lg leading-relaxed font-bold">
            Perfeito para família, amigos, casal ou galera da pelada — cada um
            vira uma figurinha personalizada.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {packageCards.map((card, idx) => (
            <motion.article
              key={card.id}
              className={`relative rounded-3xl p-7 border shadow-lg flex flex-col ${
                card.featured
                  ? "bg-[#072816] text-white border-[#ffcc00] md:scale-[1.03]"
                  : "bg-white text-[#103c27] border-line-border"
              }`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
            >
              {card.featured && (
                <div className="absolute -top-4 left-5 right-5 rounded-full bg-[#ffcc00] text-[#2a0606] border-2 border-[#2a0606] px-3 py-1.5 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xl">
                  Mais popular · Melhor valor
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
                  {card.unit} — entrega {card.deadline}
                </p>
              </div>
              <p
                className={`mt-5 text-sm leading-relaxed font-semibold ${
                  card.featured ? "text-white/76" : "text-[#65756b]"
                }`}
              >
                {card.note}
              </p>
              <button
                type="button"
                onClick={() => startPackage(card.id)}
                className={`mt-8 rounded-full px-5 py-3.5 font-black text-sm uppercase tracking-wider transition ${
                  card.featured
                    ? "bg-[#ffcc00] text-green-deep hover:bg-white"
                    : "border-2 border-green-primary text-green-primary hover:bg-green-primary hover:text-white"
                }`}
              >
                Escolher este pacote
              </button>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ─── Detailed steps ────────────────────────────────── */}
      <section className="bg-[#061f12] text-white py-16 md:py-22">
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
              Quatro passos. Sem complicação.
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
                "Individual (1), Trio (3) ou Família (5 figurinhas).",
              ],
              [
                "2",
                "Envie foto e dados",
                "Nome, e-mail, cidade/UF e os dados do card.",
              ],
              [
                "3",
                "Pagamento seguro",
                "Checkout protegido pelo Mercado Pago. Pix ou cartão.",
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

      {/* ─── FAQ ────────────────────────────────────────────── */}
      <section className="bg-white py-18 md:py-24 border-b border-line-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <p className="mono text-[10px] text-green-primary font-black uppercase">
              Dúvidas frequentes
            </p>
            <h2 className="display text-4xl md:text-5xl text-[#103c27] mt-3">
              Perguntas e respostas diretas.
            </h2>
            <p className="mt-4 text-[#65756b] font-bold">
              Tudo que você precisa saber antes de criar sua figurinha digital.
            </p>
          </motion.div>
          <div className="space-y-3">
            {[
              [
                "O que eu recebo exatamente?",
                "Uma arte digital em alta resolução (arquivo de imagem HD) com sua foto estilizada como figurinha de Copa do Mundo. Você pode postar direto nas redes sociais ou levar a uma gráfica para imprimir como adesivo.",
              ],
              [
                "Como imprimir?",
                "Leve o arquivo para uma gráfica e peça papel adesivo fotográfico brilhante, laminação com brilho e corte individual. É o acabamento mais próximo de uma figurinha física.",
              ],
              [
                "E se minha foto não servir?",
                "A foto precisa mostrar o rosto com luz e nitidez. Se não der para usar, o pedido informa o problema antes da arte final — sem cobrar de novo.",
              ],
              [
                "Pagamento é seguro?",
                "Sim. O pagamento é processado pelo Mercado Pago, a maior plataforma de pagamentos do Brasil. Aceitamos Pix e cartão de crédito.",
              ],
              [
                "Preciso ficar no site?",
                "Não. O pedido fica salvo e o link pode ser acessado depois pelo e-mail usado na compra. Quando a arte ficar pronta, o download aparece lá.",
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

      {/* ─── Feedbacks from API (conditional) ───────────────── */}
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
                Avaliações reais
              </p>
              <h2 className="display text-4xl text-[#103c27] mt-2">
                Quem recebeu já avaliou.
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
                    {"★".repeat(Math.max(1, Math.min(5, feedback.rating)))}
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

      {/* ─── Final CTA ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-18">
        <motion.div
          className="relative overflow-hidden rounded-[30px] bg-[#082816] text-white p-7 md:p-12 shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            src="/assets/imagem.png"
            alt="Estádio iluminado"
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
                Crie sua figurinha digital e receba em até 1 hora.
              </h2>
              <p className="mt-4 text-white/75 font-semibold max-w-xl">
                Envie sua foto, personalize os dados e receba uma arte HD —
                pronta para postar ou imprimir como adesivo.
              </p>
            </motion.div>
            <motion.button
              type="button"
              onClick={() => startPackage()}
              className="rounded-full bg-[#ffcc00] text-green-deep px-6 md:px-8 py-3.5 md:py-4 font-black hover:bg-white transition"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.3, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.96 }}
              animate={{ boxShadow: ["0 0 0px #ffcc0000", "0 0 40px #ffcc0088", "0 0 0px #ffcc0000"] }}
            >
              Começar agora — R$ 8,97
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-line-border py-10 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col md:flex-row gap-5 md:items-start md:justify-between">
          <div>
            <p className="mono text-[10px] text-[#365342] font-black">
              FANCARD BRASIL © 2026
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
              Serviço independente de arte digital personalizada. Não possui
              afiliação com FIFA, CBF, Panini, clubes ou federações.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
