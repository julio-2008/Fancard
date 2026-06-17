import React, { useState, useEffect } from "react";
import { 
  Lock, Loader2, ArrowLeft, RefreshCw, Copy, Check, Upload, 
  ExternalLink, FileText, CheckCircle2, ChevronRight, Inbox, Clock, User, Mail, DollarSign, PenSquare
} from "lucide-react";
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
    height?: string;
    weight?: string;
    overall?: number;
    attributes?: {
      vel: number;
      fin: number;
      pas: number;
      dri: number;
      def: number;
      fis: number;
    };
  };
  generatedPrompt: string;
}

interface Order {
  id: string;
  accessToken: string;
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
    preferenceId?: string;
    paymentId?: string;
    status: string;
    checkoutUrl?: string;
    externalReference: string;
  };
  production: {
    status: "waiting_payment" | "waiting_admin_production" | "in_production" | "ready" | "delivered";
    finalFiles: FinalFile[];
    adminNotes?: string;
  };
}

interface AdminViewProps {
  onBackHome: () => void;
}

export function AdminView({ onBackHome }: AdminViewProps) {
  const [password, setPassword] = useState<string>("");
  const [token, setToken] = useState<string>(() => localStorage.getItem("fancard_admin_token") || "");
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState<boolean>(false);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  // Filtering and searching
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Copy state arrays
  const [copiedPrompts, setCopiedPrompts] = useState<Record<string, boolean>>({});
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sound context
  const audioContext = React.useRef<AudioContext | null>(null);
  const knownPaidOrderIds = React.useRef<Set<string>>(new Set());
  const didHydratePaidOrders = React.useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };
  
  // Sound helper
  const playAlertSound = (type: 'new' | 'paid') => {
    if (!soundEnabled || !audioContext.current) return;
    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();
    osc.connect(gain);
    gain.connect(audioContext.current.destination);
    
    // Som diferente para novo pedido (médio) e pago (alto)
    osc.frequency.setValueAtTime(type === 'paid' ? 880 : 440, audioContext.current.currentTime);
    gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    osc.start();
    osc.stop(audioContext.current.currentTime + (type === 'paid' ? 0.4 : 0.2));
  };

  const enableSound = () => {
    if (!audioContext.current) {
        audioContext.current = new AudioContext();
    }
    setSoundEnabled(true);
    showToast("Notificações sonoras ativadas!");
  };

  // Polling para novos pedidos
  useEffect(() => {
    if (!authenticated) return;
    
    const interval = setInterval(() => {
        fetchOrders(); // Essa função já existe e atualiza os pedidos
    }, 15000); // 15 segundos
    
    return () => clearInterval(interval);
  }, [authenticated]);

  // Check authentication status on boot
  useEffect(() => {
    if (token) {
      verifyAdminToken(token);
    }
  }, [token]);

  // Load orders only when authenticated equals true
  useEffect(() => {
    if (authenticated) {
      fetchOrders();
    }
  }, [authenticated]);

  const verifyAdminToken = async (authToken: string) => {
    try {
      const response = await fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (data.authenticated) {
        setAuthenticated(true);
      } else {
        localStorage.removeItem("fancard_admin_token");
        setToken("");
        setAuthenticated(false);
      }
    } catch (err) {
      console.error("Auth verification failed:", err);
      setAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        setLoginError(errData.error || "Senha inválida.");
        setLoginLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem("fancard_admin_token", data.token);
      setToken(data.token);
      setAuthenticated(true);
      setLoginLoading(false);
    } catch (err) {
      console.error("Login request error:", err);
      setLoginError("Erro na conexão com o servidor.");
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Logout request error:", err);
    }
    localStorage.removeItem("fancard_admin_token");
    setToken("");
    setAuthenticated(false);
    setOrders([]);
    setSelectedOrderId(null);
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        throw new Error("Falha ao pesquisar pedidos.");
      }
      const data = await response.json();
      // Sort orders descending by date created
      const sorted = (data as Order[]).sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const paidOrderIds = new Set(
        sorted
          .filter((order) => order.payment.status === "approved" && order.production.status !== "ready" && order.production.status !== "delivered")
          .map((order) => order.id)
      );
      const newPaidOrders = [...paidOrderIds].filter((id) => !knownPaidOrderIds.current.has(id));
      if (didHydratePaidOrders.current && newPaidOrders.length > 0) {
        playAlertSound("paid");
        showToast(`${newPaidOrders.length} novo(s) pedido(s) pago(s) aguardando producao.`);
      }
      knownPaidOrderIds.current = paidOrderIds;
      didHydratePaidOrders.current = true;
      setOrders(sorted);
      
      // Auto-select first order if none selected
      if (sorted.length > 0 && !selectedOrderId && window.innerWidth >= 768) {
        setSelectedOrderId(sorted[0].id);
      }
    } catch (err) {
      console.error("Fetch orders failed:", err);
      setOrdersError("Não foi possível carregar os pedidos no momento.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCopyPrompt = (itemId: string, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPrompts((prev) => ({ ...prev, [itemId]: true }));
    setTimeout(() => {
      setCopiedPrompts((prev) => ({ ...prev, [itemId]: false }));
    }, 2000);
  };

  // Process manual local file upload from Admin disk inside browser and send base64 chunk to database
  const handleUploadFanCard = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrderId) return;

    setUploadingItemId(itemId);
    
    // Read the selected file to a base64 string
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Url = reader.result as string;
      try {
        const response = await fetch(`/api/admin/orders/${selectedOrderId}/final-files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            itemId,
            fileBase64: base64Url,
            fileName: file.name,
          }),
        });

        if (!response.ok) {
          throw new Error("Falha no upload do arquivo.");
        }

        const data = await response.json();
        
        // Refresh orders list and selected order
        setOrders((prev) => prev.map((ord) => (ord.id === selectedOrderId ? data.order : ord)));
        
        // Sucesso: Notificar
        playAlertSound('paid');
        showToast(`Figurinha ${file.name} enviada com sucesso!`);
      } catch (err) {
        console.error("Upload error:", err);
        showToast("Erro ao enviar o arquivo final para o servidor.");
      } finally {
        setUploadingItemId(null);
      }
    };
  };

  // Update high-level production status or other direct parameters
  const handleUpdateStatus = async (status: string) => {
    if (!selectedOrderId) return;
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productionStatus: status,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrders((prev) => prev.map((ord) => (ord.id === selectedOrderId ? data.order : ord)));
      } else {
        alert("Erro ao atualizar o status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!selectedOrderId) return;
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminNotes: notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrders((prev) => prev.map((ord) => (ord.id === selectedOrderId ? data.order : ord)));
      }
    } catch (err) {
      console.error("Error saving notes:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  // Filter orders according to selection state
  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "waiting_payment" && o.payment.status !== "approved") ||
      (filterStatus === "waiting_production" && o.payment.status === "approved" && o.production.status === "waiting_admin_production") ||
      (filterStatus === "in_production" && o.production.status === "in_production") ||
      (filterStatus === "ready" && (o.production.status === "ready" || o.production.status === "delivered"));

    if (!matchesStatus) return false;

    // 2. Search query check (id, buyer name, or buyer email)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchName = o.buyer.name.toLowerCase().includes(q);
      const matchEmail = o.buyer.email.toLowerCase().includes(q);
      return matchId || matchName || matchEmail;
    }

    return true;
  });

  // ==================== RENDERING LOGIN DIALOG ====================
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#071d12] flex flex-col items-center justify-center py-20 px-4 text-white">
        <div className="max-w-md w-full bg-[#102d20] border border-green-primary/35 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-primary/10 rounded-full blur-2xl" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-primary/10 border border-yellow-primary/20 text-yellow-primary rounded-full text-[10px] uppercase font-black tracking-widest leading-none mb-4 mono">
              Internal Admin Panel
            </div>
            <h1 className="display text-3xl font-black tracking-tight text-white">
              Painel de Produção
            </h1>
            <p className="text-gray-400 text-xs mt-2 leading-relaxed">
              Área de acesso restrito para designers e controle operacional da FanCard Brasil.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#ffc526]/80 mb-2 mono">
                Senha Administrativa
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Informe a chave de segurança..."
                  required
                  className="w-full bg-[#0a2016] border border-green-primary/30 rounded-2xl py-4.5 px-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ffc526] transition-all font-mono"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 hover:text-white transition-colors" />
              </div>
              {loginError && (
                <p className="text-red-400 text-xs font-semibold mt-2.5 flex items-center gap-1.5 bg-red-950/20 px-3 py-2 rounded-xl border border-red-900/30">
                  ⚠️ {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#ffc526] text-[#071d12] rounded-2xl py-4 font-black text-sm tracking-wide shadow-lg hover:bg-white hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verificando autenticação...
                </>
              ) : (
                "Entrar no Terminal Admin"
              )}
            </button>
          </form>

          <div className="text-center mt-8">
            <button
              onClick={onBackHome}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-bold hover:text-white transition-colors cursor-pointer uppercase tracking-wider font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Retornar à Loja
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==================== RENDERING FULL DUAL-PANE COGNITIVE CONSOLE ====================
  return (
    <main className="w-full min-h-screen bg-[#091510] text-[#ecefed] flex flex-col">
      {/* 1. TOP HEADER RIBBON */}
      <header className="border-b border-[#1b3428] bg-[#0c1f17] px-6 py-4 flex items-center justify-between shrink-0 h-16">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 inline-block bg-[#ffc526] rounded-full" />
          <h1 className="font-black tracking-tight text-white text-lg">
            FanCard Brasil Terminal <span className="text-xs text-[#ffc526] font-mono font-medium ml-1.5">v1.2</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={enableSound}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${soundEnabled ? "bg-emerald-900 text-emerald-200" : "bg-yellow-900 text-yellow-200"}`}
          >
            {soundEnabled ? "🔊 Som Ativado" : "🔇 Ativar Som"}
          </button>
          <button
            onClick={fetchOrders}
            className="p-2 border border-[#1b3428] rounded-xl hover:bg-[#12281e] text-gray-400 hover:text-white transition-colors"
            title="Recarregar Pedidos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-900/40 hover:bg-red-800 text-red-200 border border-red-800/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Sair do Painel
          </button>
        </div>
      </header>

      {/* 2. DOCK BODY BAR: DUAL-PANE */}
      <div className="flex-grow flex overflow-hidden min-h-[calc(100vh-4rem)]">
        
        {/* Pane Left: Inbox Sidebar */}
        <div className={`${mobileDetailOpen ? "hidden md:flex" : "flex"} w-full md:w-96 border-r border-[#1b3428] bg-[#081711] flex-col shrink-0 overflow-hidden`}>
          {/* Filter ribbon */}
          <div className="p-4 border-b border-[#1b3428] space-y-3 shrink-0">
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar ID, comprador, e-mail..."
              className="w-full bg-[#05110c] border border-green-primary/10 rounded-xl py-2.5 px-4 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-green-primary"
            />

            {/* Quick Filter Pill Tabs */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterStatus === "all" ? "bg-green-primary text-white" : "bg-[#0b1f16] text-[#699a81] border border-[#1b3428]/45"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus("waiting_payment")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterStatus === "waiting_payment" ? "bg-amber-600 text-white" : "bg-[#0b1f16] text-[#699a81] border border-[#1b3428]/45"
                }`}
              >
                Pendente Pagto
              </button>
              <button
                onClick={() => setFilterStatus("waiting_production")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterStatus === "waiting_production" ? "bg-yellow-600 text-[#071d12]" : "bg-[#0b1f16] text-[#699a81] border border-[#1b3428]/45"
                }`}
              >
                Fila de Prod
              </button>
              <button
                onClick={() => setFilterStatus("in_production")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterStatus === "in_production" ? "bg-blue-600 text-white" : "bg-[#0b1f16] text-[#699a81] border border-[#1b3428]/45"
                }`}
              >
                Em Prod
              </button>
              <button
                onClick={() => setFilterStatus("ready")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterStatus === "ready" ? "bg-emerald-600 text-white" : "bg-[#0b1f16] text-[#699a81] border border-[#1b3428]/45"
                }`}
              >
                Prontos
              </button>
            </div>
          </div>

          {/* Orders Scrollable List */}
          <div className="flex-grow overflow-y-auto divided-y divide-[#1b3428]/35">
            {ordersLoading ? (
              <div className="py-20 text-center text-gray-500 font-mono text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#ffc526] mb-3" />
                Carregando banco de figurinhas...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 text-center text-gray-500 font-mono text-xs px-4">
                <Inbox className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                Nenhum pedido localizado para esses filtros.
              </div>
            ) : (
              filteredOrders.map((o) => {
                const isActive = o.id === selectedOrderId;
                const isApprovedPayment = o.payment.status === "approved";
                
                // Friendly human readable label for status code
                let labelColor = "bg-amber-900/30 text-amber-300";
                let statusLabel = "Aguardando Pix";
                if (isApprovedPayment) {
                  if (o.production.status === "waiting_admin_production") {
                    labelColor = "bg-yellow-500/20 text-yellow-300";
                    statusLabel = "Na Fila de Prod";
                  } else if (o.production.status === "in_production") {
                    labelColor = "bg-blue-500/20 text-blue-300";
                    statusLabel = "Design Ativo";
                  } else if (o.production.status === "ready" || o.production.status === "delivered") {
                    labelColor = "bg-emerald-500/20 text-emerald-300";
                    statusLabel = "Pronto e Entregue";
                  }
                }

                return (
                  <button
                    key={o.id}
                    onClick={() => {
                      setSelectedOrderId(o.id);
                      setMobileDetailOpen(true);
                    }}
                    className={`w-full text-left p-4.5 transition-all outline-none border-b border-[#1b3428]/25 flex flex-col gap-2 relative cursor-pointer ${
                      isActive ? "bg-[#102d20] border-l-4 border-l-[#ffc526]" : "hover:bg-[#0c2419]/50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-black text-white px-2 py-0.5 bg-black/30 rounded">
                        #{o.id}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase leading-none mono ${labelColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="text-xs font-extrabold text-gray-300 truncate">
                      {o.buyer.name}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>{o.packageName}</span>
                      <span>R$ {o.price.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Pane Right: Detailed Preview & Editor Operations */}
        <div className={`${mobileDetailOpen ? "block" : "hidden md:block"} flex-grow bg-[#09100c] overflow-y-auto p-4 md:p-8`}>
          {selectedOrder ? (
            <div className="max-w-4xl space-y-8">
              
              {/* 1. SECTOR HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d2118] p-6 border border-[#1b3428]/30 rounded-2xl">
                <div>
                  <button
                    onClick={() => setMobileDetailOpen(false)}
                    className="md:hidden mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#ffc526]"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar aos pedidos
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="bg-black/30 text-[#ffc526] font-mono text-sm px-3 py-1 rounded-lg font-black">
                      #{selectedOrder.id}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      Recebido: {new Date(selectedOrder.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <h2 className="display text-2xl font-black text-white mt-2.5">
                    {selectedOrder.buyer.name}
                  </h2>
                </div>

                {/* Seletor rápido de Workflow de produção */}
                <div className="space-y-1 w-full sm:w-auto">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#ffc526] mono">
                    Atualizar Status Global de Produção
                  </label>
                  <select
                    value={selectedOrder.production?.status || "waiting_payment"}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="bg-[#05110c] border border-green-primary/30 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-black tracking-wider focus:outline-none"
                  >
                    <option value="waiting_payment">⏳ Aguardando Pagamento</option>
                    <option value="waiting_admin_production">🏷️ Na Fila de Produção (Pago)</option>
                    <option value="in_production">🛠️ Em Produção Manual</option>
                    <option value="ready">✅ Produção Concluída (Pronto)</option>
                    <option value="delivered">📦 Entregue para o Cliente</option>
                  </select>
                </div>
              </div>

              {/* 2. DOCK DETAILS Grid: Comprador + Cobrança */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Informações de Contato */}
                <div className="bg-[#081811] p-5 border border-[#1b3428]/20 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black uppercase text-[#ffc526] tracking-widest leading-none flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Titular e Contato
                  </h3>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <p className="text-gray-500 font-mono">Nome Completo</p>
                      <p className="font-extrabold text-[#ecefed] mt-0.5">{selectedOrder.buyer.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-mono flex items-center gap-1.5"><Mail className="w-3" /> E-mail de Entrega</p>
                      <p className="font-extrabold text-[#ffc526] mt-0.5">{selectedOrder.buyer.email}</p>
                    </div>
                  </div>
                </div>

                {/* Informações de Pagamento e Fila */}
                <div className="bg-[#081811] p-5 border border-[#1b3428]/20 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black uppercase text-[#ffc526] tracking-widest leading-none flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" /> Transação do Mercado Pago
                  </h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-[#1b3428]/25 pb-2">
                      <span className="text-gray-500">Gateway Status:</span>
                      <span className={`font-black uppercase tracking-wider mono ${
                        selectedOrder.payment.status === "approved" ? "text-emerald-400" : "text-amber-400"
                      }`}>
                        {selectedOrder.payment.status === "approved" ? "APROVADO (Pago)" : "PENDENTE / AGUARDANDO"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[#1b3428]/25 pb-2">
                      <span className="text-gray-500">Valor Cobrado:</span>
                      <span className="font-black text-white">R$ {selectedOrder.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-500">External Ref:</span>
                      <span className="text-gray-400">{selectedOrder.payment.externalReference}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. WORKSTATION: FIGURINHAS DO PEDIDO & COPILOTO GPT */}
              <section className="space-y-6">
                <h3 className="text-sm font-black text-[#ffc526] uppercase tracking-wider">
                  Figurinhas a Produzir ({selectedOrder.items.length})
                </h3>

                <div className="space-y-6">
                  {selectedOrder.items.map((item) => {
                    const finalFile = selectedOrder.production?.finalFiles?.find((ff) => ff.itemId === item.id);
                    const promptCopied = copiedPrompts[item.id] || false;

                    return (
                      <div 
                        key={item.id}
                        className="bg-[#081811] rounded-2xl border border-[#1b3428]/35 overflow-hidden shadow-md"
                      >
                        {/* Figurinha Header */}
                        <div className="bg-[#0d2118] px-5 py-3.5 border-b border-[#1b3428]/35 flex justify-between items-center">
                          <span className="text-xs font-black uppercase tracking-wider text-green-primary">
                            Figurinha {item.index} — Identificador: <span className="text-white font-mono">{item.id}</span>
                          </span>
                          {finalFile ? (
                            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide">
                              ✅ Arte Pronta
                            </span>
                          ) : (
                            <span className="bg-amber-950/40 text-amber-400 border border-amber-800/40 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide animate-pulse">
                              ⏳ Pendente Design
                            </span>
                          )}
                        </div>

                        {/* Editor Layout: Grid de duas colunas */}
                        <div className="p-5 grid lg:grid-cols-12 gap-6">
                          
                          {/* Col 1: Foto recebida (3 colunas span) */}
                          <div className="lg:col-span-3 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#ffc526]/80 mono leading-none">
                              Foto Original Enviada
                            </p>
                            
                            <div className="bg-black/40 rounded-xl overflow-hidden aspect-[3/4] border border-[#1b3428]/40 relative group">
                              <img 
                                src={item.photoUrl} 
                                alt={item.cardData.name} 
                                className="w-full h-full object-contain bg-black"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <a
                              href={item.photoUrl}
                              download={item.originalPhotoName || `foto_${item.index}.png`}
                              className="w-full inline-flex items-center justify-center gap-1.5 bg-[#122b20] text-gray-300 rounded-xl py-2 text-[11px] font-extrabold hover:bg-green-primary hover:text-white transition-all cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Baixar Foto do Cliente
                            </a>
                          </div>

                          {/* Col 2: Copiloto ChatGPT Plus (9 colunas span) */}
                          <div className="lg:col-span-9 space-y-5 flex flex-col justify-between">
                            
                            {/* Prompt Copiloto Area */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#ffc526]/80 mono">
                                  Copiloto ChatGPT Plus (Instrução Manual)
                                </label>
                                <button
                                  onClick={() => handleCopyPrompt(item.id, item.generatedPrompt)}
                                  className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 bg-green-primary/10 hover:bg-green-primary text-green-primary hover:text-white rounded-lg font-black transition-all cursor-pointer"
                                >
                                  {promptCopied ? (
                                    <>
                                      <Check className="w-3" /> Prompt Copiado!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3" /> Copiar Prompt para ChatGPT Plus
                                    </>
                                  )}
                                </button>
                              </div>
                              
                              <div className="bg-[#05110c] text-gray-300 font-mono text-[11px] p-4 rounded-xl border border-line-border/5 space-y-2 select-all h-28 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                                {item.generatedPrompt}
                              </div>
                            </div>

                            {/* Detalhes Técnicos da Figurinha */}
                            <div className="bg-[#05110c]/40 p-4 rounded-xl border border-[#1b3428]/15 space-y-3.5">
                              <p className="text-[9px] font-black uppercase tracking-wider text-[#ffc526] mono">Especificações preenchidas pelo torcedor</p>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                                <div>
                                  <span className="text-gray-500 font-mono">Nome em Exibição:</span>
                                  <p className="font-extrabold text-[#ecefed] mt-0.5">{item.cardData.name || "—"}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-mono">Nascimento:</span>
                                  <p className="font-extrabold text-white mt-0.5">{item.cardData.birthDate || "—"}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-mono">Cidade / UF:</span>
                                  <p className="font-extrabold text-white mt-0.5">{item.cardData.city || "—"}{item.cardData.uf ? ` / ${item.cardData.uf}` : ""}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-mono">Altura / Peso:</span>
                                  <p className="font-extrabold text-[#ffc526] mt-0.5">
                                    {item.cardData.height ? `${item.cardData.height.replace(/ m/gi, "")} m` : "—"} / {item.cardData.weight ? `${item.cardData.weight.replace(/ kg/gi, "")} kg` : "—"}
                                  </p>
                                </div>

                              </div>
                            </div>

                            {/* Upload Area para Artes Prontas */}
                            <div className="bg-[#0b2118] border border-[#1b3428]/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <h4 className="font-black text-xs text-white">Anexar Arte Final (FanCard Pronta)</h4>
                                {finalFile && (
                                  <div className="mt-3 mb-3 flex items-center gap-3">
                                    <img
                                      src={finalFile.url}
                                      alt={`Arte final ${item.index}`}
                                      className="w-14 h-20 rounded-lg border border-emerald-700/50 object-contain bg-black"
                                    />
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                                      Upload final confirmado
                                    </span>
                                  </div>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1">Gere a figurinha no ChatGPT Plus, revise e faça o upload em formato PNG ou JPG aqui.</p>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {finalFile && (
                                  <a 
                                    href={finalFile.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-black/30 hover:bg-black/60 p-2.5 rounded-xl border border-[#1b3428]/35 text-[#ffc526]"
                                    title="Visualizar FanCard Atual"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}

                                <label className="inline-flex items-center gap-2 bg-[#ffc526] hover:bg-white text-[#071d12] rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer shadow-md">
                                  {uploadingItemId === item.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-3.5 h-3.5" /> {finalFile ? "Substituir Arte" : "Enviar Arte Pronta"}
                                    </>
                                  )}
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleUploadFanCard(item.id, e)}
                                    className="hidden" 
                                    disabled={uploadingItemId !== null}
                                  />
                                </label>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 4. PRIVATE ADMIN INTERNAL NOTES */}
              <section className="bg-[#081811] rounded-2xl border border-[#1b3428]/35 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase text-[#ffc526] tracking-widest leading-none flex items-center gap-2">
                    <PenSquare className="w-3.5 h-3.5" /> Notas Internas do Painel de Produção
                  </h3>
                  
                  {savingNotes && (
                    <span className="text-[10px] text-gray-400 animate-pulse font-mono">Salvando automaticamente...</span>
                  )}
                </div>

                <textarea
                  value={selectedOrder.production?.adminNotes || ""}
                  onChange={(e) => handleUpdateNotes(e.target.value)}
                  placeholder="Informações adicionais, anotações de design ou controle logístico interno..."
                  className="w-full min-h-[100px] bg-[#05110c] border border-green-primary/20 rounded-xl p-4 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#ffc526]"
                />
              </section>

            </div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
              <Inbox className="w-12 h-12 text-[#1b3428]/60 mb-3" />
              <p className="text-gray-500 font-mono text-xs">
                Selecione um pedido na caixa de entrada lateral para ver os detalhes e operacionalizar prompts.
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
