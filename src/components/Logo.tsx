import React, { useState } from "react";

interface LogoProps {
  className?: string;
  size?: number | string;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  const [error, setError] = useState(false);

  // Fallback seguro se o arquivo logo.png estiver vazio, corrompido ou falhar no carregamento
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center font-black text-yellow-primary bg-[#083f28] rounded-full border border-white/10 select-none ${className}`}
        style={{ 
          width: size, 
          height: size, 
          fontSize: typeof size === "number" ? size * 0.45 : "12px",
          lineHeight: "1"
        }}
      >
        FB
      </div>
    );
  }

  return (
    <img
      src="/assets/logo.png"
      alt="Logo"
      className={`rounded-full object-cover select-none pointer-events-none border border-white/10 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
};
