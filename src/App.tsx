import { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { LandingView } from "./components/LandingView";
import { OrderFlowView } from "./components/OrderFlowView";
import { PedidoStatusView } from "./components/PedidoStatusView";
import { AdminView } from "./components/AdminView";
import { PackageId } from "./types";

export default function App() {
  const [viewMode, setViewMode] = useState<"landing" | "order" | "pedido" | "admin">("landing");
  const [selectedPackageId, setSelectedPackageId] = useState<PackageId | null>(null);
  
  // Public order Status trackers
  const [orderId, setOrderId] = useState<string>("");
  const [orderToken, setOrderToken] = useState<string>("");
  
  const packagesRef = useRef<HTMLDivElement | null>(null);

  // Sincronizar estado global de acordo com o hash da URL (igual ao site original)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#criar") {
        setViewMode("order");
      } else if (hash.startsWith("#pedido/") || hash.startsWith("#/pedido/")) {
        // Formato esperado: #pedido/FC123456?token=tok_xxxxx ou #/pedido/FC123456?token=tok_xxxxx
        const rawPath = hash.startsWith("#/pedido/") 
          ? hash.replace("#/pedido/", "") 
          : hash.replace("#pedido/", "");
        const [idPart, queryPart] = rawPath.split("?");
        setOrderId(idPart);
        
        let token = "";
        if (queryPart) {
          const params = new URLSearchParams(queryPart);
          token = params.get("token") || "";
        }
        setOrderToken(token);
        setViewMode("pedido");
      } else if (hash === "#ADM") {
        setViewMode("admin");
      } else {
        setViewMode("landing");
        setOrderId("");
        setOrderToken("");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Checagem de primeiro carregamento
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Rolagem suave até a seção de pacotes na landing
  const scrollPackages = () => {
    if (viewMode === "landing" && packagesRef.current) {
      packagesRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      setViewMode("landing");
      window.location.hash = "#home";
      setTimeout(() => {
        packagesRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Iniciar fluxo de pedidos
  const startFlowStep = (packageId?: PackageId) => {
    localStorage.removeItem("fancardProgressData");
    if (packageId) {
      setSelectedPackageId(packageId);
    } else {
      setSelectedPackageId(null);
    }
    setViewMode("order");
    window.location.hash = "#criar";
  };

  // Retornar da chave à homepage
  const goBackToHome = () => {
    setViewMode("landing");
    window.location.hash = "#home";
  };

  const showHeader = viewMode === "landing" || viewMode === "order";

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between">
      {/* Cabeçalho Oficial Adaptativo (Habilitado apenas na Landing e Fluxo de Compra) */}
      {showHeader && (
        <Header
          viewMode={viewMode === "order" ? "order" : "landing"}
          onBackHome={goBackToHome}
          onScrollToPackages={scrollPackages}
        />
      )}

      {/* Visualização Principal Alternada de acordo com o Roteador Hash */}
      <div className="flex-grow w-full">
        {viewMode === "landing" && (
          <LandingView
            onStartFlow={startFlowStep}
            packagesRef={packagesRef}
          />
        )}
        
        {viewMode === "order" && (
          <OrderFlowView
            initialPackageId={selectedPackageId}
            onBackHome={goBackToHome}
          />
        )}

        {viewMode === "pedido" && (
          <PedidoStatusView
            orderId={orderId}
            accessToken={orderToken}
            onBackHome={goBackToHome}
          />
        )}

        {viewMode === "admin" && (
          <AdminView
            onBackHome={goBackToHome}
          />
        )}
      </div>
    </div>
  );
}
