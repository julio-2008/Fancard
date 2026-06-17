import { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { LandingView } from "./components/LandingView";
import { OrderFlowView } from "./components/OrderFlowView";
import { PedidoStatusView } from "./components/PedidoStatusView";
import { AdminView } from "./components/AdminView";
import { ArquibancadaView } from "./components/ArquibancadaView";
import { PackageId } from "./types";
import { saveOrderHistoryItem } from "./lib/orderHistory";

export default function App() {
  const [viewMode, setViewMode] = useState<"landing" | "order" | "pedido" | "admin" | "arquibancada">("landing");
  const [selectedPackageId, setSelectedPackageId] = useState<PackageId | null>(null);
  
  // Public order Status trackers
  const [orderId, setOrderId] = useState<string>("");
  const [orderToken, setOrderToken] = useState<string>("");
  
  const packagesRef = useRef<HTMLDivElement | null>(null);

  // Sincronizar estado global de acordo com o hash da URL (igual ao site original)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const query = new URLSearchParams(window.location.search);
      const queryOrderId = query.get("pedido") || query.get("orderId") || query.get("external_reference");
      const queryToken = query.get("token") || "";

      if (hash === "#arquibancada") {
        setOrderId("");
        setOrderToken("");
        setViewMode("arquibancada");
      } else if (hash === "#criar") {
        setViewMode("order");
      } else if (queryOrderId && queryToken) {
        saveOrderHistoryItem({
          orderId: queryOrderId,
          accessToken: queryToken,
          createdAt: new Date().toISOString(),
        });
        setOrderId(queryOrderId);
        setOrderToken(queryToken);
        setViewMode("pedido");
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
        if (idPart && token) {
          saveOrderHistoryItem({
            orderId: idPart,
            accessToken: token,
            createdAt: new Date().toISOString(),
          });
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
      window.history.pushState(null, "", `${window.location.pathname}#home`);
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
    window.history.pushState(null, "", `${window.location.pathname}#criar`);
  };

  // Retornar da chave à homepage
  const goBackToHome = () => {
    setViewMode("landing");
    setOrderId("");
    setOrderToken("");
    window.history.pushState(null, "", `${window.location.pathname}#home`);
  };

  const openArquibancada = () => {
    setOrderId("");
    setOrderToken("");
    setViewMode("arquibancada");
    window.history.pushState(null, "", `${window.location.pathname}#arquibancada`);
  };

  const openSavedOrder = (id: string, token: string) => {
    setOrderId(id);
    setOrderToken(token);
    window.location.hash = `#pedido/${id}?token=${token}`;
    setViewMode("pedido");
  };

  const showHeader = viewMode === "landing" || viewMode === "order" || viewMode === "arquibancada";

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between">
      {/* Cabeçalho Oficial Adaptativo (Habilitado apenas na Landing e Fluxo de Compra) */}
      {showHeader && (
        <Header
          viewMode={viewMode === "order" ? "order" : viewMode === "arquibancada" ? "arquibancada" : "landing"}
          onBackHome={goBackToHome}
          onScrollToPackages={scrollPackages}
          onOpenArquibancada={openArquibancada}
        />
      )}

      {/* Visualização Principal Alternada de acordo com o Roteador Hash */}
      <div className="flex-grow w-full">
        {viewMode === "landing" && (
          <LandingView
            onStartFlow={startFlowStep}
            packagesRef={packagesRef}
            onOpenArquibancada={openArquibancada}
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
            onOpenArquibancada={openArquibancada}
          />
        )}

        {viewMode === "admin" && (
          <AdminView
            onBackHome={goBackToHome}
          />
        )}

        {viewMode === "arquibancada" && (
          <ArquibancadaView
            onBackHome={goBackToHome}
            onOpenOrder={openSavedOrder}
          />
        )}
      </div>
    </div>
  );
}
