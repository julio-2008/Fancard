import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  BellRing,
  Check,
  Clock,
  Flame,
  Image as ImageIcon,
  Mail,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { FancardPreview } from "./FancardPreview";
import { PackageId } from "../types";

interface LandingViewProps {
  onStartFlow: (packageId?: PackageId) => void;
  packagesRef: React.RefObject<HTMLDivElement | null>;
  onOpenArquibancada: () => void;
}

interface OfferStatus {
  limit: number;
  used: number;
  remaining: number;
  cutoffLabel: string;
  isOpen: boolean;
}

const fallbackOffer: OfferStatus = {
  limit: 7,
  used: 0,
  remaining: 7,
  cutoffLabel: "20h",
  isOpen: true,
};

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
    title: "Escalacao Completa",
    subtitle: "5 FanCards para familia, amigos ou grupo",
    oldPrice: "R$ 74,50",
    price: "R$ 35,97",
    unit: "R$ 7,19 cada",
    deadline: "ate 2 horas",
    badge: "RECOMENDADO - 51% OFF",
    featured: true,
    note: "O pacote que mais combina com torcida: todo mundo vira figurinha e o preco por arte cai forte.",
  },
  {
    id: "trio",
    title: "Trio Tatico",
    subtitle: "3 FanCards para casal, irmaos ou amigos",
    oldPrice: "R$ 44,70",
    price: "R$ 26,97",
    unit: "R$ 8,99 cada",
    deadline: "ate 2 horas",
    badge: "quase 40% OFF",
    note: "A escolha certa para nao deixar ninguem de fora e ainda pagar menos por arte.",
  },
  {
    id: "individual",
    title: "Cromo Solo",
    subtitle: "1 FanCard personalizada",
    oldPrice: "",
    price: "R$ 14,90",
    unit: "entrada mais barata",
    deadline: "ate 1 hora",
    badge: "mais rapido",
    note: "Perfeito para testar agora e receber uma arte sua pronta para postar ou imprimir.",
  },
];

const sampleCards = [
  {
    name: "VANESSA SANTOS",
    city: "SALVADOR",
    uf: "BA",
    birthDate: "1994-09-13",
    height: "1.66",
    weight: "62",
    overall: 95,
    attributes: { vel: 96, fin: 94, pas: 91, dri: 95, def: 42, fis: 78 },
    photo: "/assets/matheus.png",
  },
  {
    name: "CARLOS ALMEIDA",
    city: "RIO DE JANEIRO",
    uf: "RJ",
    birthDate: "1986-03-15",
    height: "1.78",
    weight: "82",
    overall: 90,
    attributes: { vel: 85, fin: 82, pas: 94, dri: 92, def: 65, fis: 72 },
    photo: "/assets/carlos.png",
  },
  {
    name: "THIAGO SILVA",
    city: "RIO DE JANEIRO",
    uf: "RJ",
    birthDate: "1984-10-02",
    height: "1.80",
    weight: "78",
    overall: 92,
    attributes: { vel: 85, fin: 70, pas: 85, dri: 80, def: 94, fis: 88 },
    photo: "/assets/rafael.png",
  },
];

export const LandingView: React.FC<LandingViewProps> = ({
  onStartFlow,
  packagesRef,
  onOpenArquibancada,
}) => {
  const [offer, setOffer] = useState<OfferStatus>(fallbackOffer);
  const [showExitOffer, setShowExitOffer] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Array<{
    id: string;
    name: string;
    packageName: string;
    rating: number;
    comment: string;
  }>>([]);

  useEffect(() => {
    fetch("/api/offer/status")
      .then((response) => response.ok ? response.json() : fallbackOffer)
      .then((data) => setOffer({ ...fallbackOffer, ...data }))
      .catch(() => setOffer(fallbackOffer));

    fetch("/api/feedbacks/public")
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setFeedbacks(Array.isArray(data) ? data : []))
      .catch(() => setFeedbacks([]));
  }, []);

  useEffect(() => {
    const storageKey = "fancardExitOfferSeen";
    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY > 8 || sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
      setShowExitOffer(true);
    };
    const timer = window.setTimeout(() => {
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, "1");
        setShowExitOffer(true);
      }
    }, 42000);

    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  const remainingCopy = useMemo(() => {
    if (!offer.isOpen) return "rodada de hoje encerrada";
    return `${offer.remaining} de ${offer.limit} vagas relampago hoje`;
  }, [offer]);

  const startPackage = (packageId?: PackageId) => {
    navigator.vibrate?.(35);
    onStartFlow(packageId);
  };

  return (
    <div className="w-full bg-[#fffdf7] pb-24 md:pb-0">
      <div className="fixed inset-x-0 bottom-0 z-[70] md:top-0 md:bottom-auto bg-[#061f12] text-white border-y border-[#ffcc00] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ffcc00] text-green-deep shrink-0 animate-pulse">
              <Flame className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] md:text-xs font-black uppercase tracking-wider text-[#ffcc00] leading-none">
                Convocacao Relampago
              </p>
              <p className="text-[10px] md:text-sm font-extrabold truncate">
                {remainingCopy} - encerra as {offer.cutoffLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => startPackage("familia")}
            className="shrink-0 rounded-full bg-[#ffcc00] text-green-deep px-3 md:px-5 py-1.5 md:py-2 text-[10px] md:text-sm font-black hover:bg-white transition"
          >
            Garantir vaga
          </button>
        </div>
      </div>

      <section className="relative min-h-[760px] md:min-h-[820px] overflow-hidden flex items-center pt-14 md:pt-20">
        <img
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none brightness-[0.42]"
          src="/assets/fundo-estadio.jpg"
          alt="Estadio de futebol em dia de decisao"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#062013]/70 to-[#061f12]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 py-14 w-full">
          <div className="grid lg:grid-cols-[1fr_0.95fr] gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ffcc00] text-green-deep px-3.5 py-1.5 font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl">
                <BellRing className="w-4 h-4" />
                Escalacao de hoje aberta
              </div>

              <h1 className="display mt-6 max-w-4xl text-4xl sm:text-5xl md:text-7xl text-white leading-[0.95]">
                Sua foto na figurinha da Copa ainda hoje.
              </h1>
              <p className="mt-5 max-w-2xl text-white/88 text-base md:text-xl leading-relaxed font-bold">
                Entre na Convocacao Relampago: envie sua foto, pague no Pix e receba uma FanCard digital personalizada em ate 1 hora.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 max-w-lg">
                {[
                  ["1h", "Individual"],
                  ["2h", "Trio/Familia"],
                  [offer.cutoffLabel, "fecha hoje"],
                ].map(([value, label], index) => (
                  <motion.div
                    key={label}
                    className="rounded-xl border-2 border-[#ffcc00] bg-[#061f12] px-2.5 py-2 shadow-xl"
                    animate={{ y: [0, -4, 0], scale: [1, 1.03, 1] }}
                    transition={{ duration: 1.35 + index * 0.18, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <p className="text-[#ffcc00] text-lg md:text-2xl font-black leading-none">{value}</p>
                    <p className="text-white/75 text-[10px] md:text-xs font-bold uppercase mt-1">{label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-7 flex">
                <button
                  type="button"
                  onClick={() => startPackage("familia")}
                  className="inline-flex items-center justify-center gap-3 bg-[#ffcc00] text-green-deep px-6 sm:px-8 py-3.5 rounded-full font-black hover:bg-white hover:-translate-y-0.5 active:translate-y-0 transition shadow-2xl text-sm sm:text-base"
                >
                  PEGAR VAGA RELAMPAGO
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <p className="mt-4 text-white/70 text-xs md:text-sm font-semibold">
                Sem enrolacao de dia util: a rodada vale todos os dias ate {offer.cutoffLabel}, enquanto tiver vaga.
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
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <FancardPreview cardData={sampleCards[1]} photo={sampleCards[1].photo} size="md" isFullCard />
              </motion.div>
              <motion.div
                className="absolute left-2 sm:left-10 top-24 z-20 rotate-[-14deg] scale-75 sm:scale-90"
                animate={{ x: [0, -8, 0], rotate: [-14, -17, -14] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <FancardPreview cardData={sampleCards[2]} photo={sampleCards[2].photo} size="sm" isFullCard />
              </motion.div>
              <motion.div
                className="absolute right-0 sm:right-10 top-24 z-20 rotate-[12deg] scale-75 sm:scale-90"
                animate={{ x: [0, 8, 0], rotate: [12, 15, 12] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <FancardPreview cardData={sampleCards[0]} photo={sampleCards[0].photo} size="sm" isFullCard />
              </motion.div>
              <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-yellow-primary px-5 py-2 text-green-deep font-black text-[11px] uppercase tracking-widest shadow-xl">
                pronta para postar e imprimir
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-b border-line-border bg-white py-8">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-3 gap-4">
          {[
            [ShieldCheck, "Foto conferida", "A arte so entra em producao com foto onde o rosto aparece bem."],
            [Clock, "Acompanhamento vivo", "O pedido fica salvo na Minha Arquibancada e atualiza sozinho."],
            [Mail, "Entrega no proprio site", "Quando ficar pronto, o download aparece no link do pedido."],
          ].map(([Icon, title, text]) => (
            <article key={String(title)} className="rounded-2xl border border-line-border bg-[#fff9e9] p-5">
              {React.createElement(Icon as typeof ShieldCheck, { className: "w-6 h-6 text-green-primary mb-3" })}
              <h2 className="font-black text-[#103c27]">{title as string}</h2>
              <p className="text-sm text-[#65756b] font-semibold mt-2">{text as string}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#ffcc00] py-12 md:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
            <div>
              <p className="mono text-[10px] text-green-primary font-black uppercase">Da foto ao cromo</p>
              <h2 className="display text-3xl md:text-5xl text-[#103c27] mt-2">
                Veja o pedido se montar.
              </h2>
            </div>
            <p className="max-w-md text-[#103c27]/75 text-sm md:text-base font-bold">
              Sem texto infinito: o processo e curto, visual e facil de acompanhar ate a arte final ser liberada.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-0 border-y-2 border-[#103c27] bg-[#ffcc00]">
            {[
              [ImageIcon, "Foto enviada", "voce sobe a imagem com rosto visivel"],
              [Sparkles, "Recorte limpo", "a arte recebe tratamento e encaixe"],
              [Trophy, "Dados no card", "nome, cidade/UF e estilo entram no layout"],
              [Check, "Download pronto", "o arquivo aparece no seu pedido"],
            ].map(([Icon, title, text], index) => (
              <motion.article
                key={String(title)}
                className="relative p-4 md:p-5 border-b-2 md:border-b-0 md:border-r-2 last:border-r-0 border-[#103c27]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#103c27] text-[#ffcc00] flex items-center justify-center">
                    {React.createElement(Icon as typeof ImageIcon, { className: "w-5 h-5" })}
                  </span>
                  <span className="mono text-[10px] text-[#103c27] font-black">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-base md:text-lg font-black text-[#103c27]">{title as string}</h3>
                <p className="mt-1.5 text-xs md:text-sm font-bold text-[#103c27]/75">{text as string}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section ref={packagesRef} id="packages" className="max-w-7xl mx-auto px-5 md:px-8 py-18 md:py-24">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="mono text-[10px] text-green-primary font-black uppercase">Vaga de craque</p>
          <h2 className="display text-4xl md:text-6xl text-[#103c27] mt-2">
            Monte sua escalacao antes da rodada fechar.
          </h2>
          <p className="mt-4 text-[#65756b] text-base md:text-lg leading-relaxed font-bold">
            FanCard funciona melhor quando vira brincadeira de grupo: familia, amigos, casal, pelada e torcida entrando junto na onda.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {packageCards.map((card) => (
            <motion.article
              key={card.id}
              className={`relative rounded-3xl p-7 border shadow-lg flex flex-col ${
                card.featured
                  ? "bg-[#072816] text-white border-[#ffcc00] md:scale-[1.03]"
                  : "bg-white text-[#103c27] border-line-border"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              animate={card.featured ? { y: [0, -8, 0], rotate: [0, -0.4, 0.4, 0] } : undefined}
              viewport={{ once: true, margin: "-80px" }}
              transition={card.featured ? { duration: 1.65, repeat: Infinity, ease: "easeInOut" } : { duration: 0.45 }}
            >
              {card.featured && (
                <motion.div
                  className="absolute -top-4 left-5 right-5 rounded-full bg-[#ffcc00] text-[#2a0606] border-2 border-[#2a0606] px-3 py-1.5 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xl"
                  animate={{ scale: [1, 1.06, 1], backgroundColor: ["#ffcc00", "#ffef6a", "#ffcc00"] }}
                  transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
                >
                  Recomendado - 51% OFF
                </motion.div>
              )}
              <span className={`w-max rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                card.featured ? "mt-3 bg-[#ffcc00] text-green-deep" : "bg-[#ecf4ee] text-green-primary"
              }`}>
                {card.badge}
              </span>
              <h3 className="mt-6 text-2xl font-black">{card.title}</h3>
              <p className={`mt-2 text-sm font-bold ${card.featured ? "text-white/70" : "text-[#65756b]"}`}>
                {card.subtitle}
              </p>
              <div className="mt-6">
                {card.oldPrice && (
                  <p className="text-sm font-black text-red-400 line-through">De {card.oldPrice}</p>
                )}
                <p className="text-4xl md:text-5xl font-black leading-none">{card.price}</p>
                <p className={`mt-2 text-xs font-black uppercase ${card.featured ? "text-yellow-primary" : "text-green-primary"}`}>
                  {card.unit} - entrega {card.deadline}
                </p>
              </div>
              <p className={`mt-5 text-sm leading-relaxed font-semibold ${card.featured ? "text-white/76" : "text-[#65756b]"}`}>
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
                Entrar nessa rodada
              </button>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-[#061f12] text-white py-16 md:py-22">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
          <div>
            <p className="mono text-[10px] text-[#ffcc00] font-black uppercase">Como o pedido funciona</p>
            <h2 className="display text-4xl md:text-5xl mt-3">Quatro lances. Sem perder tempo.</h2>
            <p className="mt-5 text-white/75 font-semibold leading-relaxed">
              O cliente escolhe, envia uma vez, paga no Mercado Pago e acompanha tudo pelo proprio link do pedido.
            </p>
          </div>
          <div className="space-y-0">
            {[
              ["1", "Escolha o pacote", "Familia, Trio ou Individual."],
              ["2", "Envie foto e dados", "Nome, email uma vez, cidade/UF e medidas do card."],
              ["3", "Pague no Pix", "Checkout seguro do Mercado Pago."],
              ["4", "Baixe quando liberar", "A arte aparece na Minha Arquibancada e no pedido."],
            ].map(([number, title, text], index) => (
              <article key={number} className="relative flex gap-5 pb-7 last:pb-0">
                {index < 3 && (
                  <span className="absolute left-5 top-10 bottom-0 w-0.5 bg-[#ffcc00]" />
                )}
                <span className="relative z-10 w-10 h-10 rounded-full bg-[#ffcc00] text-green-deep flex items-center justify-center font-black shrink-0 shadow-lg">
                  {number}
                </span>
                <div className="pt-0.5">
                  <h3 className="font-black text-lg text-white">{title}</h3>
                  <p className="mt-1.5 text-sm text-white/70 font-semibold leading-relaxed">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-18 md:py-24 border-b border-line-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid lg:grid-cols-[0.9fr_1.1fr] gap-10">
          <div>
            <p className="mono text-[10px] text-green-primary font-black uppercase">Duvidas que travam compra</p>
            <h2 className="display text-4xl md:text-5xl text-[#103c27] mt-3">FAQ direto, sem enrolacao.</h2>
            <p className="mt-4 text-[#65756b] font-bold">
              A garantia aqui nao promete devolucao de arte personalizada. Ela promete clareza e entrega: se a foto estiver ruim, avisamos antes de produzir.
            </p>
          </div>
          <div className="space-y-3">
            {[
              ["Como imprimir?", "Leve o arquivo para uma grafica e peca papel adesivo fotografico brilhante, laminação brilho e corte individual. E o acabamento mais proximo de figurinha fisica."],
              ["E se minha foto nao servir?", "A foto precisa mostrar o rosto com luz e nitidez. Se nao der para usar, o pedido informa o problema antes da arte final."],
              ["Tem garantia?", "Tem Garantia de Arquivo Certo: voce recebe o arquivo digital contratado no link do pedido. Arte personalizada nao segue devolucao por arrependimento depois de produzida."],
              ["Preciso ficar no site?", "Nao. O pedido fica salvo na Minha Arquibancada e o link pode ser aberto depois pelo email usado na compra."],
            ].map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-line-border bg-[#fff9e9] p-5">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-black text-[#103c27]">
                  {question}
                  <span className="text-green-primary group-open:rotate-45 transition">+</span>
                </summary>
                <p className="mt-3 text-sm text-[#65756b] leading-relaxed font-semibold">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {feedbacks.length > 0 && (
        <section className="bg-[#fffdf7] py-16 border-b border-line-border">
          <div className="max-w-7xl mx-auto px-5 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="mono text-green-primary font-black uppercase text-xs">Avaliacoes reais</p>
              <h2 className="display text-4xl text-[#103c27] mt-2">Quem recebeu ja avaliou.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {feedbacks.slice(0, 6).map((feedback) => (
                <article key={feedback.id} className="border border-line-border rounded-2xl p-5 bg-white">
                  <div className="text-yellow-500 text-sm font-black mb-3">
                    {"*".repeat(Math.max(1, Math.min(5, feedback.rating))).replace(/\*/g, "★")}
                  </div>
                  <p className="text-[#103c27] font-bold text-sm leading-relaxed">"{feedback.comment}"</p>
                  <p className="mt-4 text-xs font-black text-green-primary">{feedback.name}</p>
                  <p className="text-[10px] text-[#65756b] font-bold mt-1">{feedback.packageName}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-5 md:px-8 py-18">
        <div className="relative overflow-hidden rounded-[30px] bg-[#082816] text-white p-7 md:p-12 shadow-2xl">
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            src="/assets/imagem.png"
            alt="Estadio iluminado"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-10 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="mono text-[10px] text-yellow-primary font-black uppercase">Rodada relampago</p>
              <h2 className="display text-3xl md:text-5xl mt-3">Nao deixa sua vaga cair para o proximo torcedor.</h2>
              <p className="mt-4 text-white/75 font-semibold max-w-xl">
                Se tiver vaga hoje, sua FanCard entra na fila rapida. Depois das {offer.cutoffLabel}, a rodada vira proxima chamada.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startPackage("familia")}
              className="rounded-full bg-[#ffcc00] text-green-deep px-6 md:px-8 py-3.5 md:py-4 font-black hover:bg-white transition"
            >
              Quero minha FanCard
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-line-border py-10 bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col md:flex-row gap-5 md:items-start md:justify-between">
          <div>
            <p className="mono text-[10px] text-[#365342] font-black">FANCARD BRASIL © 2026</p>
            <p className="text-sm text-muted-text mt-2 font-bold">Sua torcida, sua historia, sua FanCard personalizada.</p>
          </div>
          <p className="text-[11px] leading-relaxed text-[#7e8a83] max-w-2xl md:text-right font-medium">
            Servico independente de arte digital personalizada. Nao possui afiliacao, representacao, patrocinio ou autorizacao de FIFA, CBF, Panini, clubes, federacoes ou marcas oficiais.
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {showExitOffer && (
          <motion.div
            className="fixed inset-0 z-[90] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
            >
              <button
                type="button"
                onClick={() => setShowExitOffer(false)}
                className="absolute right-4 top-4 text-[#65756b] hover:text-[#103c27]"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="inline-flex rounded-full bg-[#ffcc00] text-green-deep px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                ultima chamada da rodada
              </span>
              <h2 className="display text-3xl text-[#103c27] mt-4">O motivo pra pegar agora e simples.</h2>
              <p className="mt-3 text-[#65756b] font-bold leading-relaxed">
                A fila relampago e separada para produzir hoje. Quando as {offer.remaining} vaga(s) acabarem ou passar de {offer.cutoffLabel}, seu pedido entra na proxima chamada e perde a prioridade da rodada.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["prioridade hoje", "menor preco por arte", "torcida junta"].map((reason) => (
                  <div key={reason} className="border border-[#103c27] bg-[#ffcc00] px-2 py-2 text-center text-[10px] font-black uppercase text-[#103c27] leading-tight">
                    {reason}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => startPackage("familia")}
                className="mt-6 w-full rounded-full bg-[#ffcc00] text-green-deep px-6 py-3.5 font-black hover:bg-green-primary hover:text-white transition"
              >
                Continuar e garantir vaga
              </button>
              <button
                type="button"
                onClick={() => setShowExitOffer(false)}
                className="mt-3 w-full text-xs font-black text-[#65756b] hover:text-[#103c27]"
              >
                Ver a pagina mais um pouco
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
