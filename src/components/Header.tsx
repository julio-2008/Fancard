import React from "react";
import { ArrowLeft, Trophy } from "lucide-react";
import { Logo } from "./Logo";

interface HeaderProps {
  viewMode: "landing" | "order" | "arquibancada";
  onBackHome?: () => void;
  onScrollToPackages?: () => void;
  onOpenArquibancada?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onBackHome,
  onScrollToPackages,
  onOpenArquibancada,
}) => {
  if (viewMode === "order" || viewMode === "arquibancada") {
    return (
      <header className="border-b border-line-border bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4">
          <div 
            onClick={onBackHome}
            className="flex items-center gap-3 select-none cursor-pointer hover:scale-105 transition-transform duration-300 ease-out"
          >
            <Logo size={42} className="shadow-md" />
            <div>
              <p className="font-extrabold tracking-[0.11em] text-sm text-green-primary md:text-base leading-none">
                FANCARD BRASIL
              </p>
              <p className="mono text-[8px] text-muted-text mt-1 leading-none font-bold">
                CHAVE FANCARD
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={viewMode === "arquibancada" ? onScrollToPackages : onBackHome}
            className="inline-flex items-center gap-2 border border-line-border text-green-primary bg-white px-4 py-2.5 rounded-full text-xs md:text-sm font-extrabold hover:bg-soft-bg transition-all duration-200 cursor-pointer shadow-sm hover:translate-y-[-1px] active:translate-y-[0px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{viewMode === "arquibancada" ? "Ver pacotes" : "Voltar ao site"}</span>
          </button>
        </div>
      </header>
    );
  }

  // Header para a Landing Page
  return (
    <header className="absolute top-0 left-0 w-full z-35">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 md:py-6 flex items-center justify-between">
        <div 
          onClick={onScrollToPackages}
          className="flex items-center gap-3 select-none cursor-pointer hover:scale-105 transition-transform duration-300 ease-out"
        >
          <Logo size={42} className="shadow-lg" />
          <div>
            <p className="font-extrabold tracking-[0.11em] text-sm md:text-base text-white leading-none">
              FANCARD BRASIL
            </p>
            <p className="mono text-[8px] md:text-[9px] text-white/70 mt-1 leading-none font-bold">
              SUA FOTO. SUA COPA.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenArquibancada}
            className="inline-flex items-center justify-center gap-1.5 bg-white text-green-deep px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full font-black text-[9px] sm:text-xs hover:bg-yellow-primary hover:text-green-deep hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-white uppercase tracking-wider"
          >
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="sm:hidden">Arquibancada</span>
            <span className="hidden sm:inline">Minha Arquibancada</span>
          </button>
        </div>
      </div>
    </header>
  );
};
