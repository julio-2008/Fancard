import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, Copy, Download, Loader2, ShieldCheck, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Logo } from "./Logo";

interface FinalFile {
  id: string;
  itemId: string;
  url: string;
  fileName: string;
  uploadedAt: string;
}

interface FanCardItem {
  id: string;
  index: number;
  photoUrl: string;
  originalPhotoName?: string;
  cardData: {
    name: string;
    birthDate?: string;
    city: string;
    overall?: number;
  };
}

interface Order {
  id: string;
  accessToken?: string;
  createdAt: string;
  packageId: string;
  packageName: string;
  quantity: number;
  price: number;
  buyer: {
    name: string;
    email: string;
  };
  items: FanCardItem[];
  payment: {
    provider: string;
    status: string;
    checkoutUrl?: string;
  };
  production: {
    status: "waiting_payment" | "waiting_admin_production" | "in_production" | "ready" | "delivered";
    finalFiles: FinalFile[];
    adminNotes?: string;
  };
  feedback?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
}

interface PedidoStatusViewProps {
  orderId: string;
  accessToken: string;
  onBackHome: () => void;
}

export function PedidoStatusView({ orderId, accessToken, onBackHome }: PedidoStatusViewProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);
  const [simulatingPayment, setSimulatingPayment] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(() => "Notification" in window && Notification.permission === "granted");
  const audioRef = useRef<AudioContext | null>(null);
  const lastReadyNotifiedRef = useRef<string | null>(null);

  const playReadyAlert = () => {
    try {
      const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioRef.current) audioRef.current = new AudioCtor();
      const ctx = audioRef.current;
      const gain = ctx.createGain();
      gain.gain.value = 0.18;
      gain.connect(ctx.destination);
      [880, 1175, 1480].forEach((freq, index) => {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(ctx.currentTime + index * 0.18);
        osc.stop(ctx.currentTime + index * 0.18 + 0.13);
      });
    } catch {
      // Audio can be blocked until the customer taps the page.
    }
  };

  const enableDeliveryAlerts = async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      setAlertsEnabled(permission === "granted");
    } else {
      setAlertsEnabled("Notification" in window && Notification.permission === "granted");
    }

    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (err) {
        console.warn("Nao foi possivel registrar as notificacoes do pedido:", err);
      }
    }

    playReadyAlert();
  };

  const showReadyNotification = async (currentOrder: Order) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const notificationOptions: NotificationOptions = {
      body: `Pedido #${currentOrder.id}: sua arte final foi liberada.`,
      icon: "/assets/logo.png",
      data: {
        url: `${window.location.origin}/?pedido=${currentOrder.id}&token=${accessToken}`,
      },
    };

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await registration.showNotification("FanCard pronta para baixar", notificationOptions);
        return;
      }
    } catch (err) {
      console.warn("Nao foi possivel exibir notificacao via service worker:", err);
    }

    new Notification("FanCard pronta para baixar", notificationOptions);
  };

  useEffect(() => {
    const ready = order?.production.status === "ready" || order?.production.status === "delivered";
    if (order && ready && !order.feedback) {
      setShowFeedback(true);
    }

    if (order && ready && lastReadyNotifiedRef.current !== order.id) {
      lastReadyNotifiedRef.current = order.id;
      playReadyAlert();
      void showReadyNotification(order);
    }
  }, [order?.id, order?.production.status, order?.feedback, accessToken]);

  // Check query params in location
  const isSimulationParam = window.location.hash.includes("simulate_payment=true") || 
                            window.location.hash.includes("payment_status=simulated") ||
                            (order && order.payment.checkoutUrl && order.payment.checkoutUrl.includes("payment_status=simulated"));
  const paymentStatusParam = window.location.hash.includes("payment_status=success") ? "success" : "";

  useEffect(() => {
    fetchOrder();
    // Setup polling every 8 seconds to check for admin manual updates or webhook payment validation automatically
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [orderId, accessToken]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/public/${orderId}?token=${accessToken}`);
      if (!response.ok) {
        // Tenta ver se temos um pedido local no localStorage
        const localOrders = JSON.parse(localStorage.getItem("fancard_local_orders") || "[]");
        const found = localOrders.find((o: any) => o.id === orderId);
        if (found) {
          if (found.accessToken !== accessToken) {
            setErrorCode("UNAUTHORIZED");
          } else {
            setOrder(found);
            setErrorCode(null);
          }
          setLoading(false);
          return;
        }

        if (response.status === 401) {
          setErrorCode("UNAUTHORIZED");
        } else {
          setErrorCode("NOT_FOUND");
        }
        setLoading(false);
        return;
      }
      const data = await response.json();
      setOrder(data);
      setErrorCode(null);
      setLoading(false);
    } catch (err) {
      console.warn("Erro ao buscar pedido no servidor, buscando no Local Storage:", err);
      const localOrders = JSON.parse(localStorage.getItem("fancard_local_orders") || "[]");
      const found = localOrders.find((o: any) => o.id === orderId);
      if (found) {
        if (found.accessToken !== accessToken) {
          setErrorCode("UNAUTHORIZED");
        } else {
          setOrder(found);
          setErrorCode(null);
        }
        setLoading(false);
        return;
      }
      setErrorCode("SERVER_ERROR");
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/#pedido/${orderId}?token=${accessToken}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  // Safe manual testing simulator that runs with local backend verification endpoint
  const handleSimulatePaymentApproval = async () => {
    setSimulatingPayment(true);
    try {
      const response = await fetch(`/api/admin/simulate-pay/${orderId}`, {
        method: "POST",
      });
      if (response.ok) {
        setNotification({
          message: "⚡ Pagamento simulado com SUCESSO via backend! Atualizando status...",
          type: "success",
        });
        setTimeout(() => setNotification(null), 5000);
        await fetchOrder();
        setSimulatingPayment(false);
        return;
      }
    } catch (err) {
      console.warn("Erro de requisição na simulação de pagamento, simulando localmente:", err);
    }

    // Código de fallback local
    const localOrders = JSON.parse(localStorage.getItem("fancard_local_orders") || "[]");
    const orderIdx = localOrders.findIndex((o: any) => o.id === orderId);
    if (orderIdx !== -1) {
      localOrders[orderIdx].payment.status = "approved";
      localOrders[orderIdx].production = {
        status: "waiting_admin_production",
        finalFiles: [],
      };
      localOrders[orderIdx].updatedAt = new Date().toISOString();
      localStorage.setItem("fancard_local_orders", JSON.stringify(localOrders));
      
      setNotification({
        message: "⚡ Pagamento simulado com SUCESSO localmente! Atualizando status...",
        type: "success",
      });
      setTimeout(() => setNotification(null), 5000);
      await fetchOrder();
    } else {
      alert("Erro ao enviar comando de simulação para o servidor.");
    }
    setSimulatingPayment(false);
  };

  const handleSimulateProductionReady = async () => {
    if (!order) return;
    
    // Fallback de design pronto
    const localOrders = JSON.parse(localStorage.getItem("fancard_local_orders") || "[]");
    const orderIdx = localOrders.findIndex((o: any) => o.id === orderId);
    
    const fakeFinalFiles = order.items.map((item) => ({
      id: "final_sim_" + Math.random().toString(36).substring(2, 9),
      itemId: item.id,
      url: item.photoUrl, // Usa a própria imagem do cliente para a miniatura / download final!
      fileName: `fancard_final_${item.index}.png`,
      uploadedAt: new Date().toISOString(),
    }));

    if (orderIdx !== -1) {
      localOrders[orderIdx].production.status = "ready";
      localOrders[orderIdx].production.finalFiles = fakeFinalFiles;
      localOrders[orderIdx].updatedAt = new Date().toISOString();
      localStorage.setItem("fancard_local_orders", JSON.stringify(localOrders));
      
      setNotification({
        message: "🎨 Design finalizado com SUCESSO! Agora você já pode visualizar e testar o download das suas figurinhas.",
        type: "success",
      });
      setTimeout(() => setNotification(null), 5000);
      await fetchOrder();
    } else {
      // Se não for pedido de local storage, tenta fazer um patch emulado no estado local
      const mockOrder = { ...order };
      mockOrder.production.status = "ready";
      mockOrder.production.finalFiles = fakeFinalFiles;
      setOrder(mockOrder);
      setNotification({
        message: "🎨 Design finalizado com SUCESSO na esteira sandbox local! Aproveite o teste.",
        type: "success",
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#fffbf4] py-20 px-5">
        <Loader2 className="w-12 h-12 text-[#103c27] animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#103c27] tracking-wider mono uppercase">
          Carregando status do seu pedido...
        </p>
      </div>
    );
  }

  if (errorCode || !order) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center bg-[#fffbf4] py-20 px-5 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="display text-3xl text-red-950 font-black mb-3">
          {errorCode === "UNAUTHORIZED" ? "Acesso não Autorizado" : "Pedido Não Localizado"}
        </h2>
        <p className="max-w-md text-red-800 text-sm leading-relaxed mb-8">
          {errorCode === "UNAUTHORIZED"
            ? "O token de acesso fornecido para este link é inválido. Certifique-se de que copiou o endereço do pedido corretamente."
            : "Não conseguimos localizar nenhuma chave correspondente a essa identificação em nosso banco de dados."}
        </p>
        <button
          onClick={onBackHome}
          className="inline-flex items-center gap-2 bg-green-primary text-white px-6 py-3 rounded-full font-bold shadow-md hover:bg-green-deep transition-all cursor-pointer text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </button>
      </div>
    );
  }

  // Calcular progresso
  const isPaid = order.payment.status === "approved";
  const isProductionReady = order.production.status === "ready" || order.production.status === "delivered";
  const isProductionStarted = order.production.status === "in_production" || order.production.status === "ready";
  
  return (
    <main className="w-full min-h-screen bg-[#fffdfa] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {showFeedback && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-black text-[#103c27] mb-2">Avalie sua FanCard!</h2>
            <p className="text-sm text-gray-500 mb-6">Como foi sua experiência? Seu feedback nos ajuda a melhorar!</p>
            <div className="flex gap-2 mb-6 justify-center">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  className={`text-4xl transition-all ${rating >= r ? "text-yellow-400 scale-110" : "text-gray-200"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-2xl p-4 mb-6 min-h-[100px] text-sm"
              placeholder="O que achou do tempo de produção, da qualidade da arte? (mín 15 caracteres)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              disabled={submitting || rating === 0 || comment.trim().length < 15}
              onClick={async () => {
                setSubmitting(true);
                await fetch(`/api/orders/${order.id}/feedback`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ rating, comment }),
                });
                setSubmitting(false);
                setShowFeedback(false);
                fetchOrder();
              }}
              className="w-full bg-[#103c27] text-white py-4 rounded-full font-black text-sm hover:bg-[#1a5e3e] transition-all disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Enviar Avaliação"}
            </button>
          </div>
        </div>
      )}
      {/* Container Principal Centralizado */}
      <div className="max-w-4xl mx-auto">
        
        {/* Toast Notification */}
        {notification && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-950 flex items-center gap-3 animate-bounce shadow-md">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-bold leading-normal">{notification.message}</p>
          </div>
        )}

        {/* Notificação de simpificação para ambiente local */}
        {isSimulationParam && !isPaid && (
          <div className="mb-6 p-5 rounded-2xl bg-[#ffecd1]/40 border border-[#ffb347]/50 text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div>
              <div className="flex items-center gap-2 font-black text-xs text-amber-800 uppercase tracking-wider mono mb-1">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                Ambiente de Homologação Sandbox
              </div>
              <p className="text-xs font-medium leading-relaxed max-w-xl">
                Você escolheu simulador nas variáveis do Mercado Pago. Para testar o fluxo de ponta a ponta sem chave real, use o botão de simulação do servidor abaixo para marcar este pedido como pago no banco de dados.
              </p>
            </div>
            <button
              onClick={handleSimulatePaymentApproval}
              disabled={simulatingPayment}
              className="bg-amber-800 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-amber-950 focus:outline-none transition-all disabled:opacity-50 inline-flex items-center gap-2 shrink-0 cursor-pointer shadow"
            >
              {simulatingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : "⚡ Aprovar Pagamento"}
            </button>
          </div>
        )}

        {isSimulationParam && isPaid && order.production.status !== "ready" && (
          <div className="mb-6 p-5 rounded-2xl bg-green-50 border border-green-200 text-green-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div>
              <div className="flex items-center gap-2 font-black text-xs text-green-700 uppercase tracking-wider mono mb-1">
                <Check className="w-4 h-4 text-green-600 shrink-0" />
                Simulador de Esteira de Design
              </div>
              <p className="text-xs font-medium leading-relaxed max-w-xl">
                O pagamento foi aprovado! Em ambiente de produção real, nossa equipe cria as artes finais. No modo sandbox, você mesmo pode simular a finalização do design para gerar as artes e testar a visualização e downloads.
              </p>
            </div>
            <button
              onClick={handleSimulateProductionReady}
              className="bg-green-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-green-800 focus:outline-none transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer shadow"
            >
              🎨 Concluir Design e Liberar Downloads
            </button>
          </div>
        )}

        {/* 1. CABEÇALHO DO STATUS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-line-border/30 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-green-primary/10 text-green-primary px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mono">
                Acompanhar Pedido
              </span>
              <span className="text-muted-text text-xs font-mono">
                Criado em {new Date(order.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <h1 className="display text-3xl font-black text-[#103c27] mt-2">
              Pedido #{order.id}
            </h1>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={enableDeliveryAlerts}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 border border-yellow-primary/40 hover:border-yellow-primary text-green-deep bg-yellow-primary/20 px-4 py-2.5 rounded-full text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              {alertsEnabled ? "Alertas ativos" : "Ativar alerta"}
            </button>
            <button
              onClick={handleCopyLink}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 border border-green-primary/20 hover:border-green-primary text-green-primary bg-white px-4 py-2.5 rounded-full text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            >
              {copiedOrderId ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Link Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Link do Pedido
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. ESTADO VISUAL DA ESTAÇÃO DE PEDIDO (PROGRESS STEPPER) */}
        <section className="bg-white border border-line-border/20 rounded-[28px] p-6 sm:p-8 mt-8 shadow-sm">
          <h2 className="mono text-[10px] text-green-primary font-bold uppercase tracking-widest tracking-wide mb-6">
            Status do Processo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Step 1: Pedido Criado */}
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-10 h-10 rounded-full bg-green-primary text-white flex items-center justify-center shrink-0 font-bold text-sm shadow">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-[#103c27] text-sm">Pedido criado</h4>
                <p className="text-xs text-muted-text mt-1">Pedido registrado com sucesso no portal.</p>
              </div>
            </div>

            {/* Step 1.5: Pagamento Status */}
            <div className="flex gap-4 items-start relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm shadow ${
                isPaid 
                  ? "bg-green-primary text-white" 
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}>
                {isPaid ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5 animate-pulse" />}
              </div>
              <div>
                <h4 className="font-bold text-[#103c27] text-sm">
                  {isPaid ? "Pagamento confirmado" : "Pagamento pendente"}
                </h4>
                <p className="text-xs text-muted-text mt-1">
                  {isPaid 
                    ? "Faturamento aprovado de forma segura." 
                    : "Aguardando confirmação do Mercado Pago."}
                </p>
                {!isPaid && order.payment.checkoutUrl && (
                  <a
                    href={order.payment.checkoutUrl}
                    className="inline-flex mt-2 text-xs font-extrabold text-[#ffb300] hover:underline"
                  >
                    👉 Pagar agora com Mercado Pago
                  </a>
                )}
              </div>
            </div>

            {/* Step 2: Produção Status */}
            <div className="flex gap-4 items-start relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm shadow ${
                isProductionReady 
                  ? "bg-green-primary text-white" 
                  : isProductionStarted 
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-gray-100 text-gray-400"
              }`}>
                {isProductionReady ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="mono text-xs">03</span>
                )}
              </div>
              <div>
                <h4 className="font-bold text-[#103c27] text-sm">
                  {isProductionReady ? "Pronto para baixar" : isProductionStarted ? "Em produção" : "Aguardando produção"}
                </h4>
                <p className="text-xs text-muted-text mt-1">
                  {isProductionReady 
                    ? "Sua FanCard tática está pronta para download!" 
                    : isProductionStarted
                      ? "Nossa esteira profissional de design está atuando na sua arte." 
                      : "Aguardando aprovação do pagamento."}
                </p>
              </div>
            </div>
          </div>

          {/* Banner centralizadora dependendo do status de produção atual */}
          <div className="mt-8 p-5 rounded-2xl bg-[#fcf9f2] border border-line-border/10 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="text-center sm:text-left">
              <h3 className="font-black text-sm text-[#103c27]">
                {!isPaid 
                  ? "Aguardando Confirmação do Pagamento" 
                  : !isProductionReady 
                    ? "🔑 Seu design está em produção personalizada" 
                    : "🏆 Suas FanCards Premium estão prontas!"}
              </h3>
              <p className="text-xs text-muted-text mt-1 max-w-xl">
                {!isPaid 
                  ? "Assim que o pix ou cartão for confirmado no Mercado Pago, nossa equipe inicia a modelagem da sua arte feita sob medida imediatamente. A estimativa de produção é de até 12 horas ou 1 dia útil." 
                  : !isProductionReady 
                    ? "Nossos especialistas em design gráfico cuidam da remoção de fundo com inteligência artificial, tratamento de iluminação e harmonia de cores para que seu card fique impecável. O tempo de produção é de até 12 horas ou 1 dia útil." 
                    : "Sua arte digital concluída foi qualificada e liberada com design profissional de alta fidelidade. Faça o seu download em excelente definição abaixo."}
              </p>
            </div>

            {isProductionReady && (
              <span className="bg-green-primary text-white rounded-full px-5 py-2 text-xs font-black shrink-0 tracking-wide">
                PRONTO PRA POSTAR
              </span>
            )}
          </div>
        </section>

        {/* 3. LISTA DE FIGURINHAS DO PEDIDO */}
        <section className="mt-8">
          <h2 className="display text-xl text-[#103c27] font-black mb-4">
            Suas Figurinhas ({order.items.length})
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {order.items.map((item) => {
              // Check if final file is ready for this specific itemId
              const finalFile = order.production.finalFiles.find((ff) => ff.itemId === item.id);
              const isReady = !!finalFile && isProductionReady;

              return (
                <div 
                  key={item.id}
                  className={`bg-white rounded-[24px] border transition-all overflow-hidden flex flex-col justify-between ${
                    isReady 
                      ? "border-yellow-primary/40 shadow-md ring-1 ring-yellow-primary/10" 
                      : "border-line-border/20 shadow-sm"
                  }`}
                >
                  <div className="p-5 flex gap-4 items-start">
                    {/* Imagem original do cliente para comparação tática */}
                    <div className="w-16 h-20 bg-cream rounded-xl overflow-hidden shrink-0 border border-line-border/15 relative">
                      <img 
                        src={item.photoUrl} 
                        alt={item.cardData.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 right-1 bg-green-primary text-white text-[8px] font-black px-1 py-0.5 rounded uppercase leading-none">
                        Foto enviada
                      </span>
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold text-green-primary bg-green-primary/5 px-2 py-0.5 rounded-full uppercase">
                          Figurinha {item.index}
                        </span>
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3" /> Pronta
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase animate-pulse">
                            {isPaid ? "Na fila" : "Aguardando"}
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-gray-900 mt-2 text-base leading-tight">
                        {item.cardData.name}
                      </h3>
                      <p className="text-xs text-muted-text mt-1">
                        {item.cardData.city}
                      </p>
                    </div>
                  </div>

                  {/* Detalhes de download se estiver pronta */}
                  {isReady && finalFile ? (
                    <div className="bg-[#fffdf2] p-4 border-t border-yellow-primary/10 flex flex-col gap-3">
                      {/* Visualização miniatura do resultado */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-gray-200 rounded-lg overflow-hidden shrink-0 relative border border-yellow-primary/30">
                          <img 
                            src={finalFile.url} 
                            alt={`${item.cardData.name} Final`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow">
                          <p className="text-[10px] text-[#103c27] font-black uppercase tracking-wider">Arte Finalizada por Designer</p>
                          <p className="text-xs text-gray-500 font-mono truncate">{finalFile.fileName}</p>
                        </div>
                      </div>

                      <a
                        href={finalFile.url}
                        download={finalFile.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-yellow-primary text-green-deep rounded-full py-2.5 px-4 text-xs font-black hover:bg-green-primary hover:text-white hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> FAZER DOWNLOAD DO FANCARD
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500 font-medium">
                      {isPaid 
                        ? "Design sob análise. O upload final aparecerá aqui." 
                        : "Liberação pendente de confirmação de pagamento."}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. SEÇÃO DO RESUMO DO COMPRADOR */}
        <section className="bg-white border border-line-border/20 rounded-[28px] p-6 sm:p-8 mt-8 shadow-sm">
          <h2 className="mono text-[10px] text-green-primary font-bold uppercase tracking-widest tracking-wide mb-4">
            Detalhes da Compra
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-text">TITULAR DO PEDIDO</p>
              <p className="font-extrabold text-gray-900 mt-1">{order.buyer.name}</p>
              <p className="text-xs text-gray-500 font-mono">{order.buyer.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-text">PRODUTO E VALOR</p>
              <p className="font-extrabold text-gray-900 mt-1">{order.packageName}</p>
              <p className="font-black text-green-primary mt-0.5">R$ {order.price.toFixed(2).replace(".", ",")}</p>
            </div>
          </div>
        </section>

        {/* 5. FOOTER SECURE INFO */}
        <div className="text-center mt-12">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-green-primary hover:text-green-deep text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar à Página Inicial
          </button>
          <div className="flex items-center justify-center gap-2 text-muted-text/65 text-[10px] mt-6 font-mono">
            <ShieldCheck className="w-4 h-4 text-green-primary" />
            CONEXÃO TOTALMENTE CRIPTOGRAFADA E SEGURA COM MERCADO PAGO®
          </div>
        </div>

      </div>
    </main>
  );
}
