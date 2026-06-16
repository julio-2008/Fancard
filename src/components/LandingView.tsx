import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { FancardPreview } from "./FancardPreview";
import { Trophy, Check, ArrowRight, ShieldCheck, Mail, Sparkles, AlertCircle } from "lucide-react";
import { PackageId } from "../types";

// Importações não mais usadas como módulos (para evitar Vite MIME type issues), usamos URLs baseadas no static server do Express


interface LandingViewProps {
  onStartFlow: (packageId?: PackageId) => void;
  packagesRef: React.RefObject<HTMLDivElement | null>;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartFlow,
  packagesRef,
}) => {
  const [feedbacks, setFeedbacks] = useState<Array<{
    id: string;
    name: string;
    packageName: string;
    rating: number;
    comment: string;
  }>>([]);

  useEffect(() => {
    fetch("/api/feedbacks/public")
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setFeedbacks(Array.isArray(data) ? data : []))
      .catch(() => setFeedbacks([]));
  }, []);

  // Mock dos craques do Hero para visualização idêntica de figurinhas (sem dados técnicos desnecessários)
  const craqueVanessa = {
    name: "VANESSA SANTOS",
    city: "SALVADOR",
    uf: "BA",
    birthDate: "1994-09-13",
    height: "1.66",
    weight: "62",
    overall: 95,
    attributes: { vel: 96, fin: 94, pas: 91, dri: 95, def: 42, fis: 78 },
  };

  const craqueThiago = {
    name: "THIAGO SILVA",
    city: "RIO DE JANEIRO",
    uf: "RJ",
    birthDate: "1984-10-02",
    height: "1.80",
    weight: "78",
    overall: 92,
    attributes: { vel: 85, fin: 70, pas: 85, dri: 80, def: 94, fis: 88 },
  };

  const craqueLucas = {
    name: "CARLOS ALMEIDA",
    city: "RIO DE JANEIRO",
    uf: "RJ",
    birthDate: "1986-03-15",
    height: "1.78",
    weight: "82",
    overall: 90,
    attributes: { vel: 85, fin: 82, pas: 94, dri: 92, def: 65, fis: 72 },
  };

  return (
    <div className="w-full">
      {/* 1. SEÇÃO HERO */}
      <section className="relative min-h-[720px] md:min-h-[780px] overflow-hidden flex items-center">
        {/* Imagem de Fundo Estádio */}
        <picture>
          <img
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none brightness-[0.45]"
            src="/assets/fundo-estadio.jpg"
            alt="Gramado de estádio com jogador número 10 e enorme bandeira do Brasil de fundo"
            referrerPolicy="no-referrer"
          />
        </picture>
        <div className="absolute inset-0 hero-overlay bg-black/35"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-32 pb-16 w-full">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            {/* Texto do Hero */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-3 mb-5">
                <span className="w-9 h-px bg-yellow-primary"></span>
                <p className="mono text-[9px] md:text-[10px] text-yellow-primary font-bold">
                  FIGURINHA PERSONALIZADA COM SUA FOTO
                </p>
              </div>
              <h1 
                style={{ fontFamily: 'Noto Serif Myanmar', fontWeight: 'normal', fontStyle: 'normal' }}
                className="display text-4xl sm:text-5xl md:text-6xl text-white max-w-3xl"
              >
                Vire figurinha de Copa com sua própria foto.
              </h1>
              <p className="mt-5 md:mt-6 text-white/85 text-base md:text-lg max-w-xl leading-relaxed font-medium">
                Escolha o pacote, envie suas fotos e dados, pague com Mercado Pago e receba sua FanCard digital pronta para postar ou imprimir.
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => onStartFlow()}
                  className="inline-flex items-center justify-center gap-3 bg-yellow-primary text-green-deep px-8 py-4.5 rounded-full font-black hover:translate-y-[-3px] active:translate-y-[0px] hover:shadow-xl hover:bg-white transition-all duration-300 cursor-pointer text-base md:text-lg"
                >
                  CRIAR MINHA FIGURINHA
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <p className="mt-5 text-white/70 text-xs sm:text-sm font-semibold">
                Arte digital sob medida • Entrega digital • Pagamento via Pix
              </p>
              <p className="mt-2 text-white/50 text-xs font-semibold">
                Receba no site e por e-mail • Pedido direto no site
              </p>
            </motion.div>

            {/* Showcase das Figurinhas com Hovers Interativos Exclusivos */}
            <motion.div
              className="relative h-[320px] sm:h-[400px] md:h-[460px] cursor-pointer group mt-8 lg:mt-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="absolute inset-x-8 top-8 mx-auto w-[60%] h-[60%] rounded-full bg-yellow-primary/10 blur-3.5xl pointer-events-none"></div>

              {/* Figurinha Esquerda (Rafael / Thiago) */}
              <div className="absolute left-[2%] sm:left-[8%] top-[14%] sm:top-[18%] z-10 rotate-[-11deg] opacity-40 sm:opacity-90 scale-70 sm:scale-100 transition-all duration-300 group-hover:rotate-[-15deg] group-hover:translate-x-[-12px]">
                <FancardPreview
                  cardData={craqueThiago}
                  photo="/assets/rafael.png"
                  size="sm"
                  isFullCard={true}
                />
              </div>

              {/* Figurinha Direita (Matheus / Vanessa) */}
              <div className="absolute right-[2%] sm:right-[8%] top-[12%] sm:top-[16%] z-20 rotate-[9deg] opacity-40 sm:opacity-90 scale-70 sm:scale-100 transition-all duration-300 group-hover:rotate-[13deg] group-hover:translate-x-[12px]">
                <FancardPreview
                  cardData={craqueVanessa}
                  photo="/assets/matheus.png"
                  size="sm"
                  isFullCard={true}
                />
              </div>

              {/* Figurinha Central Principal (Carlos Almeida) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[2%] sm:top-[4%] z-30 rotate-[-2deg] scale-[0.85] sm:scale-100 transition-all duration-300 group-hover:translate-y-[-12px] group-hover:rotate-[1deg] group-hover:scale-105">
                <FancardPreview
                  cardData={craqueLucas}
                  photo="/assets/carlos.png"
                  size="md"
                  isFullCard={true}
                />
              </div>

              {/* Selo Informativo */}
              <div 
                className="absolute right-[-4px] sm:right-4 bottom-4 z-40 bg-yellow-primary text-green-deep px-4 py-2 rounded-full shadow-2xl skew-x-[-3deg] hover:scale-105 transition-all duration-200"
              >
                <p className="mono text-[9px] sm:text-[11px] leading-none font-black tracking-widest text-[#00361d]">
                  PRONTA PRA POSTAR
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO DE BENEFÍCIOS ("O que você recebe") */}
      <section 
        style={{ backgroundColor: "#ffe600" }}
        className="border-y border-line-border py-12 md:py-16"
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="text-center mb-10 max-w-xl mx-auto">
            <p className="mono text-[10px] text-green-primary font-bold">ENTREGA EXCLUSIVA</p>
            <h2 className="text-2xl font-black text-[#103c27] mt-1.5">O que você recebe no seu pedido</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.article
              className="pt-6 border-t-2 border-green-primary/20 hover:border-green-primary transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0 }}
            >
              <p className="mono text-[10px] text-green-primary font-bold">01</p>
              <h2 className="mt-3 font-extrabold text-[#103c27] text-lg">FanCard digital personalizada</h2>
              <p className="mt-2 text-muted-text text-sm leading-relaxed font-medium">
                Sua própria figurinha estilizada de alta fidelidade desenhada sob medida com a sua foto.
              </p>
            </motion.article>

            <motion.article
              className="pt-6 border-t-2 border-green-primary/20 hover:border-green-primary transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="mono text-[10px] text-green-primary font-bold">02</p>
              <h2 className="mt-3 font-extrabold text-[#103c27] text-lg">Arquivo em alta qualidade</h2>
              <p className="mt-2 text-muted-text text-sm leading-relaxed font-medium">
                Pronto para postar nos Stories, WhatsApp ou feed, além de formato adequado para imprimir.
              </p>
            </motion.article>

            <motion.article
              className="pt-6 border-t-2 border-green-primary/20 hover:border-green-primary transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="mono text-[10px] text-green-primary font-bold">03</p>
              <h2 className="mt-3 font-extrabold text-[#103c27] text-lg">Dados personalizados na arte</h2>
              <p className="mt-2 text-muted-text text-sm leading-relaxed font-medium">
                Nome, data de nascimento, cidade ou time, peso e altura, tudo personalizado por você.
              </p>
            </motion.article>

            <motion.article
              className="pt-6 border-t-2 border-green-primary/20 hover:border-green-primary transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="mono text-[10px] text-green-primary font-bold">04</p>
              <h2 className="mt-3 font-extrabold text-[#103c27] text-lg">Entrega direta pelo site</h2>
              <p className="mt-2 text-muted-text text-sm leading-relaxed font-medium">
                Painel do cliente síncrono para verificar o progresso de design e baixar os arquivos finais sem complicações.
              </p>
            </motion.article>
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO DE PACOTES */}
      <section ref={packagesRef} id="packages" className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="mono text-[10px] text-green-primary font-bold mb-4">
            PACOTES FANCARD
          </p>
          <h2 className="display text-4xl md:text-5xl text-[#103c27]">
            Escolha seu pacote.
          </h2>
          <p className="mt-5 text-[#65756b] text-base md:text-lg leading-relaxed font-bold">
            Você escolhe a quantidade de figurinhas que deseja criar por um preço promocional exclusivo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* PACOTE INDIVIDUAL */}
          <motion.article
            className="rounded-3xl bg-white p-8 border border-line-border shadow-md hover:shadow-xl hover:translate-y-[-5px] transition-all duration-300 flex flex-col justify-between"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0 }}
          >
            <div>
              <span className="inline-flex bg-slate-100 text-green-deep rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider mb-5">
                Cromo Base de Entrada
              </span>
              <div className="h-1.5 w-14 bg-green-primary rounded-full mb-7" />
              <h3 className="text-2xl font-black text-[#103c27]">Individual</h3>
              <p className="mt-2 text-green-deep font-bold text-sm">1 FanCard personalizada</p>
              <div className="mt-5">
                <span className="text-xs text-[#718176] font-bold block">Entrega em até 12 horas</span>
                <p className="mt-1 text-[#103c27] font-black text-4xl sm:text-5xl">
                  R$ 14,90
                </p>
                <div className="mt-2 text-[11px] text-[#103c27]/70 font-black uppercase tracking-wider bg-slate-100 px-2 py-1 rounded inline-block">
                  Apenas R$ 14,90 por FanCard
                </div>
              </div>
              <p className="mt-5 text-[#718176] leading-relaxed text-sm font-medium">
                Ideal para transformar uma foto especial em uma FanCard digital pronta para postar ou imprimir. Produção personalizada de alta fidelidade.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStartFlow("individual")}
              className="mt-8 w-full rounded-full border-2 border-green-primary px-5 py-3 text-green-primary font-extrabold hover:bg-green-primary hover:text-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-center uppercase text-xs tracking-wider"
            >
              CRIAR 1 FANCARD
            </button>
          </motion.article>

          {/* PACOTE TRIO */}
          <motion.article
            className="rounded-3xl bg-white p-8 border border-line-border shadow-md hover:shadow-xl hover:translate-y-[-5px] transition-all duration-300 flex flex-col justify-between"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div>
              <span 
                style={{ backgroundColor: "#ffc526" }}
                className="inline-flex text-[#103c27] rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider mb-5"
              >
                Ganhe quase 40% de desconto
              </span>
              <div className="h-1.5 w-14 bg-yellow-primary rounded-full mb-7" />
              <h3 className="text-2xl font-black text-[#103c27]">Trio</h3>
              <p className="mt-2 text-green-deep font-bold text-sm">3 FanCards personalizadas</p>
              <div className="mt-5">
                <span className="text-xs text-red-500 font-bold line-through block">De R$ 44,70</span>
                <p className="text-[#103c27] font-black text-4xl sm:text-5xl">
                  R$ 26,97
                </p>
                <div className="mt-2 text-[11px] text-[#103c27]/70 font-black uppercase tracking-wider bg-slate-100 px-2 py-1 rounded inline-block">
                  Apenas R$ 8,99 por FanCard
                </div>
              </div>
              <p className="mt-5 text-[#718176] leading-relaxed text-sm font-medium">
                Perfeito para irmãos, amigos, casal com filho, colegas de time ou três versões diferentes. Entrega em até 1 dia útil.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStartFlow("trio")}
              className="mt-8 w-full rounded-full border-2 border-green-primary px-5 py-3 text-green-primary font-extrabold hover:bg-green-primary hover:text-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-center uppercase text-xs tracking-wider"
            >
              CRIAR 3 FANCARDS
            </button>
          </motion.article>

          {/* PACOTE FAMÍLIA / AMIGOS */}
          <motion.article
            className="rounded-3xl bg-[#092916] p-8 border-2 border-yellow-primary text-white shadow-2xl hover:shadow-[0_20px_50px_rgba(234,179,8,0.2)] hover:translate-y-[-5px] transition-all duration-300 relative flex flex-col justify-between"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Tag em destaque */}
            <div 
              className="absolute -top-4 left-8 bg-[#ffc000] border border-[#3f0808] text-[#3f0808] px-4 py-1.5 rounded-full font-mono font-black text-[10px] sm:text-xs tracking-wider shadow-lg animate-pulse"
            >
              RECOMENDADO — MAIS DE 50% DE DESCONTO
            </div>

            <div className="mt-4">
              <div className="h-1.5 w-14 bg-yellow-primary rounded-full mb-7" />
              <h3 className="text-2xl font-black text-white flex items-center gap-2">
                Família / Amigos
                <Trophy className="w-5 h-5 text-yellow-primary shrink-0" />
              </h3>
              <p className="text-yellow-primary mt-2 font-bold text-sm">
                5 FanCards personalizadas
              </p>
              
              <div className="mt-5">
                <span className="text-xs text-red-400 font-extrabold line-through block">De R$ 74,50</span>
                <p className="text-white font-black text-4xl sm:text-5xl flex items-baseline gap-1">
                  R$ 35,97
                </p>
                <div className="mt-1.5 text-[11px] text-yellow-primary font-black uppercase tracking-wider bg-white/10 px-2 py-1 rounded inline-block">
                  Apenas R$ 7,19 por FanCard
                </div>
              </div>

              <p className="mt-5 text-white/80 leading-relaxed text-sm font-medium">
                O pacote mais vantajoso para família, amigos, grupo da pelada, escola ou time. Entrega em até 1 dia útil.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => onStartFlow("familia")}
              className="mt-8 w-full rounded-full bg-yellow-primary px-5 py-3 text-green-deep font-black hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer text-center uppercase text-xs tracking-wider shadow-lg"
            >
              CRIAR 5 FANCARDS
            </button>
          </motion.article>
        </div>

        <p className="mt-12 text-center text-[#6f7e74] text-sm font-bold">
          Continue na Chave FanCard e complete as informações com muita facilidade.
        </p>
      </section>

      {/* 4. SEÇÃO "COMO O PEDIDO FUNCIONA" */}
      <section 
        style={{ backgroundColor: "#092916" }}
        className="py-20 md:py-24 text-white"
      >
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="mono text-[10px] text-yellow-primary font-bold mb-4">
                COMO O PEDIDO FUNCIONA
              </p>
              <h2 className="display text-4xl md:text-5xl text-white max-w-xl">
                Rápido de pedir. Fácil de acompanhar.
              </h2>
              <p className="mt-5 text-white/75 text-base md:text-lg leading-relaxed max-w-md font-medium">
                Você avança de forma visual pela Chave FanCard, envia as fotos, preenche os dados e o status atualiza no próprio site.
              </p>
            </motion.div>

            <div className="space-y-8">
              <motion.article
                className="flex gap-5 step-line"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="w-12 h-12 rounded-full bg-yellow-primary text-green-deep flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                  1
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg sm:text-xl">
                    Escolha o pacote
                  </h3>
                  <p className="mt-2 text-white/72 leading-relaxed text-sm font-semibold">
                    Selecione 1 (Individual), 3 (Trio) ou 5 (Família) figurinhas.
                  </p>
                </div>
              </motion.article>

              <motion.article
                className="flex gap-5 step-line"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="w-12 h-12 rounded-full bg-yellow-primary text-green-deep flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                  2
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg sm:text-xl">
                    Envie foto e dados
                  </h3>
                  <p className="mt-2 text-white/72 leading-relaxed text-sm font-semibold">
                    Insira as especificações e fotos no próprio portal.
                  </p>
                </div>
              </motion.article>

              <motion.article
                className="flex gap-5 step-line"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="w-12 h-12 rounded-full bg-yellow-primary text-green-deep flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                  3
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg sm:text-xl">
                    Pague com segurança no Mercado Pago
                  </h3>
                  <p className="mt-2 text-white/72 leading-relaxed text-sm font-semibold">
                    Realize o faturamento em ambiente totalmente seguro e certificado.
                  </p>
                </div>
              </motion.article>

              <motion.article
                className="flex gap-5"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="w-12 h-12 rounded-full bg-yellow-primary text-green-deep flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                  4
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg sm:text-xl">
                    Receba sua FanCard digital
                  </h3>
                  <p className="mt-2 text-white/72 leading-relaxed text-sm font-semibold">
                    Baixe sua obra-prima diretamente pelo site ou por e-mail em alta resolução.
                  </p>
                </div>
              </motion.article>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DE LIMITES */}
      <section className="bg-cream-light py-20 md:py-24 border-b border-line-border">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p 
              style={{ fontSize: "12px" }}
              className="mono text-green-primary font-bold mb-4"
            >
              LIMITE POR PACOTE
            </p>
            <h2 className="display text-4xl md:text-5xl text-[#103c27]">
              Cada pacote tem a quantidade certa.
            </h2>
            <p className="mt-5 text-[#65756b] text-base md:text-lg leading-relaxed font-bold">
              Isso garante que sua esteira de produção seja super ágil e as figurinhas fiquem prontas o mais rápido possível.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.article
              className="border-t border-[#c9dccd] pt-6 flex flex-col items-center text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-full bg-green-primary/10 text-green-primary flex items-center justify-center mb-3">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-[#103c27] font-black text-lg">Individual</h3>
              <p className="text-[#6d7c72] mt-2 leading-relaxed font-semibold">
                Envie 1 foto para 1 figurinha.
              </p>
            </motion.article>

            <motion.article
              className="border-t border-[#c9dccd] pt-6 flex flex-col items-center text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-10 h-10 rounded-full bg-green-primary/10 text-green-primary flex items-center justify-center mb-3">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-[#103c27] font-black text-lg">Trio</h3>
              <p className="text-[#6d7c72] mt-2 leading-relaxed font-semibold">
                Envie até 3 fotos diferentes.
              </p>
            </motion.article>

            <motion.article
              className="border-t border-[#c9dccd] pt-6 flex flex-col items-center text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-10 h-10 rounded-full bg-green-primary/10 text-green-primary flex items-center justify-center mb-3">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-[#103c27] font-black text-lg">Família / Amigos</h3>
              <p className="text-[#6d7c72] mt-2 leading-relaxed font-semibold">
                Envie até 5 fotos diferentes.
              </p>
            </motion.article>
          </div>
        </div>
      </section>

      {feedbacks.length > 0 && (
        <section className="bg-white py-18 md:py-22 border-b border-line-border">
          <div className="max-w-7xl mx-auto px-5 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="mono text-green-primary font-bold mb-4 text-xs">
                AVALIAÇÕES REAIS
              </p>
              <h2 className="display text-4xl md:text-5xl text-[#103c27]">
                Quem recebeu já avaliou.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {feedbacks.slice(0, 6).map((feedback) => (
                <article key={feedback.id} className="border border-line-border rounded-2xl p-5 bg-cream-light">
                  <div className="text-yellow-500 text-sm font-black mb-3">
                    {"★".repeat(Math.max(1, Math.min(5, feedback.rating)))}
                  </div>
                  <p className="text-[#103c27] font-bold text-sm leading-relaxed">
                    “{feedback.comment}”
                  </p>
                  <div className="mt-4 pt-4 border-t border-line-border/70">
                    <p className="text-xs font-black text-green-primary">{feedback.name}</p>
                    <p className="text-[10px] text-[#65756b] font-bold mt-1">{feedback.packageName}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. BANNER FINAL / CALL-TO-ACTION */}
      <section 
        className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-24"
        style={{ backgroundColor: "#031b47" }}
      >
        <motion.div
          className="rounded-[32px] px-7 py-12 md:px-16 md:py-16 overflow-hidden relative shadow-xl min-h-[340px] flex items-center bg-[#152e1c]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Imagem de Fundo de Alta Resolução - imagem.png */}
          <picture>
            <img
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none brightness-100"
              src="/assets/imagem.png"
              alt="Estádio incrível sob o brilho intenso do sol"
              referrerPolicy="no-referrer"
            />
          </picture>

          <div className="relative z-10 w-full grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="flex flex-col items-center text-center w-full">
              <p 
                style={{ 
                  textAlign: "center", 
                  fontSize: "11px", 
                  lineHeight: "1", 
                  fontFamily: "Arial", 
                  fontWeight: "bold", 
                  fontStyle: "normal" 
                }}
                className="mb-4"
              >
                É SUA VEZ DE ENTRAR EM CAMPO
              </p>
              <h2 
                style={{ textAlign: "left", borderWidth: "0px" }}
                className="display text-3xl sm:text-4xl md:text-5xl text-white max-w-2xl font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              >
                Pronto para virar figurinha de Copa?
              </h2>
              <p 
                style={{ 
                  textAlign: "left", 
                  height: "64.25px", 
                  width: "264px", 
                  marginTop: "20px", 
                  fontFamily: "DM Sans", 
                  fontWeight: "bold", 
                  fontStyle: "normal", 
                  marginLeft: "0px", 
                  paddingTop: "0px", 
                  lineHeight: "15.75px", 
                  fontSize: "17px" 
                }}
                className="text-white/95 leading-relaxed"
              >
                Escolha o pacote certo que cabe no seu bolso e continue na Chave FanCard hoje mesmo.
              </p>
            </div>
            <motion.button
              type="button"
              onClick={() => onStartFlow()}
              style={{ borderColor: "#000000", color: "#000000" }}
              className="inline-flex items-center justify-center gap-3 bg-yellow-primary rounded-full px-8 py-4.5 font-black hover:bg-white md:whitespace-nowrap cursor-pointer text-base shadow-lg"
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0px 10px 15px -3px rgba(0, 0, 0, 0.3)",
                  "0px 15px 30px 2px rgba(254, 240, 138, 0.4)",
                  "0px 10px 15px -3px rgba(0, 0, 0, 0.3)"
                ]
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                scale: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                },
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                },
                default: { duration: 0.3 }
              }}
            >
              ESCOLHER PACOTE
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-line-border py-12 bg-white/50">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col md:flex-row gap-6 md:justify-between md:items-start">
          <div>
            <p className="mono text-[10px] text-[#365342] font-black">
              FANCARD BRASIL © 2026
            </p>
            <p className="text-sm text-muted-text mt-2 font-bold">
              Sua torcida, sua história, sua FanCard personalizada.
            </p>
          </div>
          <div className="max-w-2xl text-left md:text-right">
            <p className="text-xs leading-normal text-[#7e8a83] font-semibold flex items-center md:justify-end gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
              Isenção de Responsabilidade
            </p>
            <p className="text-[11px] leading-relaxed text-[#7e8a83] mt-2 font-medium">
              Serviço independente de arte digital personalizada. Não possuímos afiliação, representação, patrocínio ou qualquer autorização de entidades oficiais como FIFA, CBF, Panini, clubes de futebol, federações desportivas ou marcas comerciais associadas à Copa do Mundo. Todas as marcas comerciais são de propriedade de seus respectivos donos.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
