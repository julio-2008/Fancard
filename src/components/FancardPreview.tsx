import React from "react";
import { CardData } from "../types";

interface FancardPreviewProps {
  cardData: CardData;
  photo: string | null;
  size?: "sm" | "md" | "lg";
  isFullCard?: boolean;
}

export const FancardPreview: React.FC<FancardPreviewProps> = ({
  cardData,
  photo,
  size = "md",
  isFullCard = false,
}) => {
  const { name, city, uf, height, weight } = cardData;
  const overall = 99;
  const attributes = { vel: 99, fin: 99, pas: 99, dri: 99, def: 99, fis: 99 };

  // Calculando dimensões de acordo com o tamanho solicitado
  const sizeClasses = {
    sm: "w-[150px] h-[210px] text-[10px] rounded-xl border-2",
    md: "w-[240px] h-[336px] text-xs rounded-2xl border-4",
    lg: "w-[300px] h-[420px] text-sm rounded-3xl border-[6px]",
  };

  const nameSize = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  const badgeSize = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  // Se for uma figurinha de imagem completa, renderizamos apenas o elemento img sem sobrepor o design HTML
  const showAsFullImage = isFullCard || 
    (photo && (
      photo.includes("vanessa_photo_correct") || 
      photo.includes("thiago_card_complete") ||
      photo.includes("lucas_card_complete") ||
      photo.includes("eduardo_card_complete") ||
      photo.includes("brazil_player_bg") ||
      photo.includes("rafael") ||
      photo.includes("carlos") ||
      photo.includes("matheus")
    ));

  if (showAsFullImage && photo) {
    return (
      <div
        id={`fancard-preview-full-${size}`}
        className={`relative select-none overflow-hidden flex items-center justify-center bg-transparent border-yellow-primary ${sizeClasses[size]} transition-all duration-300 hover:scale-105 rounded-[1.25rem]`}
        style={{
          boxShadow: "0 20px 40px rgba(8, 63, 40, 0.4)",
        }}
      >
        <img
          src={photo}
          alt={name || "Card"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative select-none overflow-hidden font-sans border-yellow-primary bg-gradient-to-b from-green-deep to-green-primary shadow-2xl flex flex-col justify-between text-white ${sizeClasses[size]} transition-all duration-300 hover:scale-105`}
      style={{
        boxShadow: "0 20px 40px rgba(8, 63, 40, 0.4), inset 0 0 40px rgba(244, 196, 48, 0.2)",
      }}
    >
      {/* Detalhes de Fundo / Estrela Reluzente */}
      <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-yellow-primary/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Cabeçalho da Figurinha: Geral e Posição */}
      <div className="absolute top-3 left-3 flex flex-col items-center z-10">
        <div className="font-extrabold text-[28px] md:text-[36px] lg:text-[44px] leading-none text-yellow-primary tracking-tighter filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {overall}
        </div>
        <div className="font-mono font-bold text-[10px] md:text-xs text-soft-bg bg-green-deep/70 px-1.5 py-0.5 rounded border border-white/20">
          CRAQUE
        </div>
      </div>

      {/* Escudo Brasil e Escudo do Site */}
      <div className="absolute top-3 right-3 flex flex-col items-center gap-1.5 z-10">
        {/* Bandeira do Brasil */}
        <div className="w-7 h-5 rounded border border-white/40 overflow-hidden shadow-md">
          <div className="w-full h-full bg-[#009b3a] relative flex items-center justify-center">
            {/* Losango amarelo */}
            <div className="w-4 h-4 bg-[#fedf00] rotate-45 transform"></div>
            {/* Círculo azul */}
            <div className="absolute w-2 h-2 bg-[#002776] rounded-full"></div>
          </div>
        </div>
        <div className="text-[8px] font-bold text-white/80 bg-black/40 px-1 py-0.5 rounded uppercase">
          {uf || "BRA"}
        </div>
      </div>

      {/* Area da Foto Centralizada */}
      <div className="relative w-full h-[62%] mt-4 overflow-hidden flex items-end justify-center">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
        ) : (
          /* Placeholder de jogador premium se não houver foto */
          <div className="w-full h-full bg-gradient-to-b from-green-deep to-green-primary flex flex-col items-center justify-end pb-4 px-4 text-center">
            {/* Silhueta minimalista de jogador de futebol */}
            <svg
              className="w-2/3 h-2/3 text-white/30 filter drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
            <div className="absolute text-[8px] sm:text-[10px] text-yellow-primary/80 font-black mb-1 px-2 py-0.5 bg-black/40 rounded-full">
              SUA FOTO AQUI
            </div>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-green-primary via-green-primary/50 to-transparent"></div>
      </div>

      {/* Caixa de Texto Inferior: Nome e Atributos */}
      <div className="bg-gradient-to-b from-green-primary to-green-deep border-t border-yellow-primary/40 p-2 md:p-3 relative z-10 flex-grow flex flex-col justify-between">
        {/* Nome do Craque */}
        <div className="text-center">
          <h3
            className={`font-black tracking-tight text-white uppercase text-shadow-md truncate ${nameSize[size]}`}
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}
          >
            {name || "SEU NOME"}
          </h3>
          <div className="text-[8px] md:text-[10px] text-yellow-primary/80 font-extrabold uppercase mt-0.5 tracking-wider truncate">
            {city || "BRASIL / BR"}
          </div>
        </div>

        {/* Linha Divisória de Ouro */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-yellow-primary/70 to-transparent my-1 md:my-1.5" />

        {/* Atributos Estilo FanCard */}
        <div className="grid grid-cols-6 gap-0.5 md:gap-1 text-center font-mono">
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[8px] text-soft-bg/60 font-bold uppercase">VEL</span>
            <span className="text-[10px] md:text-sm font-black text-yellow-primary">{attributes.vel}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[8px] text-soft-bg/60 font-bold uppercase">FIN</span>
            <span className="text-[10px] md:text-sm font-black text-yellow-primary">{attributes.fin}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[8px] text-soft-bg/60 font-bold uppercase">PAS</span>
            <span className="text-[10px] md:text-sm font-black text-yellow-primary">{attributes.pas}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[8px] text-soft-bg/60 font-bold uppercase">DRI</span>
            <span className="text-[10px] md:text-sm font-black text-yellow-primary">{attributes.dri}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[8px] text-soft-bg/60 font-bold uppercase">DEF</span>
            <span className="text-[10px] md:text-sm font-black text-yellow-primary">{attributes.def}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] md:text-[8px] text-soft-bg/60 font-bold uppercase">FIS</span>
            <span className="text-[10px] md:text-sm font-black text-yellow-primary">{attributes.fis}</span>
          </div>
        </div>

        {/* Pequenos Detalhes Finais */}
        <div className="flex justify-between items-center mt-1 md:mt-2 text-[6px] md:text-[8px] text-white/50 border-t border-white/5 pt-1">
          <span>
            {height ? `${height.toString().replace(/[^0-9.,]/g, "").replace(".", ",")} m` : "1,75 m"}
            {" • "}
            {weight ? `${weight.toString().replace(/[^0-9]/g, "")} kg` : "72 kg"}
          </span>
          <span className="font-mono text-[5px] md:text-[7px] tracking-widest text-yellow-primary/85">FANCARD BRASIL</span>
        </div>
      </div>
    </div>
  );
};
