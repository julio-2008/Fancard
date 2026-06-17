import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Loader2, Search, ShieldCheck, Ticket, Trophy } from "lucide-react";
import { readOrderHistory, saveOrderHistoryItem, StoredOrderHistoryItem } from "../lib/orderHistory";

interface ArquibancadaViewProps {
  onBackHome: () => void;
  onOpenOrder: (orderId: string, accessToken: string) => void;
}

interface LiveOrderSummary {
  id: string;
  packageName: string;
  price: number;
  createdAt: string;
  payment: { status: string; checkoutUrl?: string };
  production: { status: string; finalFiles: Array<{ id: string }> };
}

function statusLabel(order?: LiveOrderSummary) {
  if (!order) return "Salvo neste navegador";
  if (order.production.status === "ready" || order.production.status === "delivered") return "Pronto para baixar";
  if (order.production.status === "in_production") return "Em produção";
  if (order.payment.status === "approved") return "Na fila de criação";
  return "Aguardando pagamento";
}

function statusClass(order?: LiveOrderSummary) {
  if (!order) return "bg-slate-100 text-slate-700";
  if (order.production.status === "ready" || order.production.status === "delivered") return "bg-emerald-100 text-emerald-800";
  if (order.production.status === "in_production") return "bg-blue-100 text-blue-800";
  if (order.payment.status === "approved") return "bg-yellow-100 text-yellow-900";
  return "bg-amber-100 text-amber-900";
}

export function ArquibancadaView({ onBackHome, onOpenOrder }: ArquibancadaViewProps) {
  const [history, setHistory] = useState<StoredOrderHistoryItem[]>([]);
  const [liveOrders, setLiveOrders] = useState<Record<string, LiveOrderSummary>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [recoverId, setRecoverId] = useState("");
  const [recoverToken, setRecoverToken] = useState("");
  const [recoverError, setRecoverError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(readOrderHistory());
  }, []);

  useEffect(() => {
    history.forEach((item) => {
      if (liveOrders[item.orderId] || loadingIds[item.orderId]) return;
      setLoadingIds((current) => ({ ...current, [item.orderId]: true }));
      fetch(`/api/orders/public/${item.orderId}?token=${item.accessToken}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data?.id) {
            setLiveOrders((current) => ({ ...current, [item.orderId]: data }));
          }
        })
        .catch(() => undefined)
        .finally(() => {
          setLoadingIds((current) => ({ ...current, [item.orderId]: false }));
        });
    });
  }, [history, liveOrders, loadingIds]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [history]);

  const handleRecover = async (event: FormEvent) => {
    event.preventDefault();
    setRecoverError(null);
    const orderId = recoverId.trim().toUpperCase();
    const accessToken = recoverToken.trim();
    if (!orderId || !accessToken) {
      setRecoverError("Informe o código do pedido e a chave de acesso.");
      return;
    }

    try {
      const response = await fetch(`/api/orders/public/${orderId}?token=${accessToken}`);
      if (!response.ok) {
        setRecoverError("Não encontramos esse pedido com essa chave.");
        return;
      }
      const data = await response.json();
      const next = saveOrderHistoryItem({
        orderId,
        accessToken,
        packageName: data.packageName,
        packageId: data.packageId,
        quantity: data.quantity,
        price: data.price,
        buyerName: data.buyer?.name,
        buyerEmail: data.buyer?.email,
        checkoutUrl: data.payment?.checkoutUrl,
        createdAt: data.createdAt || new Date().toISOString(),
      });
      setHistory(next);
      onOpenOrder(orderId, accessToken);
    } catch {
      setRecoverError("Erro de conexão ao recuperar pedido. Tente novamente.");
    }
  };

  return (
    <main className="min-h-screen bg-[#fffdfa] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-green-primary text-xs font-black uppercase tracking-widest mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao site
        </button>

        <section className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div>
            <div className="inline-flex items-center gap-2 bg-yellow-primary text-green-deep rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest">
              <Trophy className="w-4 h-4" />
              Área da torcida
            </div>
            <h1 className="display text-4xl md:text-5xl text-[#103c27] mt-5">
              Minha Arquibancada
            </h1>
            <p className="mt-4 text-[#65756b] max-w-2xl font-bold leading-relaxed">
              Seus pedidos ficam salvos neste navegador para você acompanhar pagamento, produção, entrega e baixar a arte final quando ela for liberada.
            </p>

            <div className="mt-8 grid gap-4">
              {sortedHistory.length === 0 ? (
                <div className="bg-white border border-line-border rounded-3xl p-8 shadow-sm">
                  <Ticket className="w-10 h-10 text-yellow-primary mb-4" />
                  <h2 className="text-xl font-black text-[#103c27]">Nenhum pedido salvo ainda</h2>
                  <p className="text-sm text-[#65756b] mt-2 font-semibold">
                    Depois que você criar uma FanCard, o pedido aparece aqui automaticamente.
                  </p>
                </div>
              ) : (
                sortedHistory.map((item) => {
                  const live = liveOrders[item.orderId];
                  const date = new Date(live?.createdAt || item.createdAt).toLocaleDateString("pt-BR");
                  return (
                    <article key={item.orderId} className="bg-white border border-line-border rounded-3xl p-5 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-green-primary">#{item.orderId}</span>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusClass(live)}`}>
                              {loadingIds[item.orderId] ? "Atualizando..." : statusLabel(live)}
                            </span>
                          </div>
                          <h2 className="font-black text-[#103c27] mt-2">
                            {live?.packageName || item.packageName || "FanCard personalizada"}
                          </h2>
                          <p className="text-xs text-[#65756b] mt-1 font-semibold">
                            Criado em {date}
                            {(live?.price || item.price) ? ` • R$ ${(live?.price || item.price || 0).toFixed(2).replace(".", ",")}` : ""}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenOrder(item.orderId, item.accessToken)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-green-primary text-white px-5 py-3 text-xs font-black hover:bg-green-deep transition"
                        >
                          Abrir lance do pedido
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <aside className="bg-[#092916] text-white rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-primary text-green-deep flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-black">Recuperar pedido</h2>
                <p className="text-xs text-white/60 font-semibold">Use o código e a chave do link.</p>
              </div>
            </div>

            <form onSubmit={handleRecover} className="mt-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-yellow-primary mb-2">
                  Código do pedido
                </label>
                <input
                  value={recoverId}
                  onChange={(event) => setRecoverId(event.target.value)}
                  placeholder="FC123456"
                  className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-white font-bold outline-none focus:border-yellow-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-yellow-primary mb-2">
                  Chave de acesso
                </label>
                <input
                  value={recoverToken}
                  onChange={(event) => setRecoverToken(event.target.value)}
                  placeholder="tok_..."
                  className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-white font-bold outline-none focus:border-yellow-primary"
                />
              </div>
              {recoverError && (
                <p className="text-xs font-bold text-red-200 bg-red-950/40 rounded-xl px-3 py-2">{recoverError}</p>
              )}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-yellow-primary text-green-deep px-5 py-3 text-xs font-black hover:bg-white transition"
              >
                <ShieldCheck className="w-4 h-4" />
                Entrar na arquibancada
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 flex gap-3 text-xs text-white/65 font-semibold leading-relaxed">
              <Clock className="w-5 h-5 text-yellow-primary shrink-0" />
              <p>A página do pedido continua atualizando sozinha enquanto sua arte passa por pagamento, produção e entrega.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
