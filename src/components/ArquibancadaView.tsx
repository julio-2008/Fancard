import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock, Mail, Search, ShieldCheck, Ticket, Trophy } from "lucide-react";
import {
  readLastOrder,
  readOrderHistory,
  saveOrderHistoryItem,
  StoredOrderHistoryItem,
} from "../lib/orderHistory";

interface ArquibancadaViewProps {
  onBackHome: () => void;
  onOpenOrder: (orderId: string, accessToken: string) => void;
}

interface LiveOrderSummary {
  id: string;
  packageName: string;
  packageId?: string;
  quantity: number;
  price: number;
  createdAt: string;
  buyer?: { name?: string; email?: string };
  payment: { status: string; checkoutUrl?: string };
  production: { status: string; finalFiles: Array<{ id: string }> };
  accessToken?: string;
}

function statusLabel(order?: LiveOrderSummary) {
  if (!order) return "Salvo neste aparelho";
  if (order.production.status === "ready" || order.production.status === "delivered") return "Pronto para baixar";
  if (order.production.status === "in_production") return "Em producao";
  if (order.payment.status === "approved") return "Na fila de criacao";
  return "Aguardando pagamento";
}

function statusClass(order?: LiveOrderSummary) {
  if (!order) return "bg-slate-100 text-slate-700";
  if (order.production.status === "ready" || order.production.status === "delivered") return "bg-emerald-100 text-emerald-800";
  if (order.production.status === "in_production") return "bg-blue-100 text-blue-800";
  if (order.payment.status === "approved") return "bg-yellow-100 text-yellow-900";
  return "bg-amber-100 text-amber-900";
}

function toHistoryItem(order: LiveOrderSummary): StoredOrderHistoryItem | null {
  if (!order.accessToken) return null;
  return {
    orderId: order.id,
    accessToken: order.accessToken,
    checkoutUrl: order.payment.checkoutUrl,
    packageName: order.packageName,
    packageId: order.packageId,
    quantity: order.quantity,
    price: order.price,
    buyerName: order.buyer?.name,
    buyerEmail: order.buyer?.email,
    createdAt: order.createdAt,
  };
}

export function ArquibancadaView({ onBackHome, onOpenOrder }: ArquibancadaViewProps) {
  const [history, setHistory] = useState<StoredOrderHistoryItem[]>([]);
  const [liveOrders, setLiveOrders] = useState<Record<string, LiveOrderSummary>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showAdvancedRecover, setShowAdvancedRecover] = useState(false);
  const [recoverId, setRecoverId] = useState("");
  const [recoverToken, setRecoverToken] = useState("");

  useEffect(() => {
    const items = readOrderHistory();
    const last = readLastOrder();
    const merged = last && !items.some((item) => item.orderId === last.orderId) ? [last, ...items] : items;
    setHistory(merged);
    const profile = JSON.parse(localStorage.getItem("fancardCustomerProfile") || "null");
    if (profile?.email) setLookupEmail(profile.email);
  }, []);

  useEffect(() => {
    history.forEach((item) => {
      if (liveOrders[item.orderId] || loadingIds[item.orderId]) return;
      setLoadingIds((current) => ({ ...current, [item.orderId]: true }));
      fetch(`/api/orders/public/${item.orderId}?token=${item.accessToken}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (data?.id) setLiveOrders((current) => ({ ...current, [item.orderId]: data }));
        })
        .catch(() => undefined)
        .finally(() => setLoadingIds((current) => ({ ...current, [item.orderId]: false })));
    });
  }, [history, liveOrders, loadingIds]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [history]);

  const featured = sortedHistory[0];
  const featuredLive = featured ? liveOrders[featured.orderId] : undefined;

  const mergeOrders = (orders: LiveOrderSummary[]) => {
    let next = readOrderHistory();
    orders.forEach((order) => {
      const item = toHistoryItem(order);
      if (item) next = saveOrderHistoryItem(item);
    });
    setHistory(next);
  };

  const handleEmailLookup = async (event: FormEvent) => {
    event.preventDefault();
    setLookupError(null);
    const email = lookupEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLookupError("Digite o email usado no pedido.");
      return;
    }

    setLookupLoading(true);
    try {
      const response = await fetch(`/api/orders/lookup-by-email?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        setLookupError("Nao encontramos pedidos com esse email.");
        return;
      }
      const data = await response.json();
      const orders = Array.isArray(data.orders) ? data.orders : [];
      if (orders.length === 0) {
        setLookupError("Nenhum pedido encontrado para esse email.");
        return;
      }
      localStorage.setItem("fancardCustomerProfile", JSON.stringify({ email }));
      mergeOrders(orders);
      const first = orders[0];
      if (first?.id && first?.accessToken) onOpenOrder(first.id, first.accessToken);
    } catch {
      setLookupError("Erro de conexao ao buscar seus pedidos.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAdvancedRecover = async (event: FormEvent) => {
    event.preventDefault();
    setLookupError(null);
    const orderId = recoverId.trim().toUpperCase();
    const accessToken = recoverToken.trim();
    if (!orderId || !accessToken) {
      setLookupError("Informe o codigo e a chave apenas se estiver em outro aparelho.");
      return;
    }
    const response = await fetch(`/api/orders/public/${orderId}?token=${accessToken}`);
    if (!response.ok) {
      setLookupError("Nao encontramos esse pedido com essa chave.");
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
  };

  return (
    <main className="min-h-screen bg-[#fffdfa] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          onClick={onBackHome}
          className="inline-flex items-center gap-2 text-green-primary text-xs font-black uppercase tracking-widest mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao site
        </button>

        <section className="grid xl:grid-cols-[1fr_460px] gap-10 items-start">
          <div>
            <div className="inline-flex items-center gap-2 bg-yellow-primary text-green-deep rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest">
              <Trophy className="w-4 h-4" />
              Area da torcida
            </div>
            <h1 className="display text-5xl md:text-7xl text-[#103c27] mt-5 leading-none">
              Minha Arquibancada
            </h1>
            <p className="mt-5 text-[#53665b] max-w-3xl text-lg md:text-xl font-bold leading-relaxed">
              Entre com seu email e veja seus pedidos, pagamento, producao e download. Se voce criou o pedido neste aparelho, ele aparece automaticamente.
            </p>

            {featured && (
              <article className="mt-8 bg-[#092916] text-white rounded-[32px] p-6 md:p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusClass(featuredLive)}`}>
                      {loadingIds[featured.orderId] ? "Atualizando..." : statusLabel(featuredLive)}
                    </span>
                    <h2 className="mt-4 text-2xl md:text-3xl font-black">
                      {featuredLive?.packageName || featured.packageName || "FanCard personalizada"}
                    </h2>
                    <p className="mt-2 text-white/65 text-sm font-semibold">
                      Pedido #{featured.orderId} salvo nesta Arquibancada
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenOrder(featured.orderId, featured.accessToken)}
                    className="inline-flex items-center justify-center rounded-full bg-yellow-primary text-green-deep px-6 py-4 text-sm font-black hover:bg-white transition"
                  >
                    Ver meu pedido
                  </button>
                </div>
              </article>
            )}

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              {[
                ["1", "Pedido salvo", "Apos criar, o link fica guardado no navegador."],
                ["2", "Status ao vivo", "Pagamento e producao atualizam pelo site."],
                ["3", "Download final", "Quando o ADM liberar, a arte aparece no pedido."],
              ].map(([number, title, copy]) => (
                <div key={number} className="bg-white border border-line-border rounded-3xl p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-yellow-primary text-green-deep flex items-center justify-center font-black">
                    {number}
                  </div>
                  <h2 className="font-black text-[#103c27] mt-4">{title}</h2>
                  <p className="text-sm text-[#65756b] font-semibold mt-2">{copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4">
              {sortedHistory.length === 0 ? (
                <div className="bg-white border border-line-border rounded-[32px] p-8 md:p-10 shadow-sm">
                  <Ticket className="w-12 h-12 text-yellow-primary mb-5" />
                  <h2 className="text-2xl font-black text-[#103c27]">Nenhum pedido salvo neste aparelho</h2>
                  <p className="text-base text-[#65756b] mt-2 font-semibold max-w-2xl">
                    Se voce ja comprou, digite o email usado no pedido. Se ainda nao comprou, crie sua FanCard e ela aparecera aqui automaticamente.
                  </p>
                </div>
              ) : (
                sortedHistory.map((item) => {
                  const live = liveOrders[item.orderId];
                  const date = new Date(live?.createdAt || item.createdAt).toLocaleDateString("pt-BR");
                  return (
                    <article key={item.orderId} className="bg-white border border-line-border rounded-3xl p-5 md:p-6 shadow-sm">
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
                          className="inline-flex items-center justify-center rounded-full bg-green-primary text-white px-5 py-3 text-xs font-black hover:bg-green-deep transition"
                        >
                          Abrir pedido
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <aside className="bg-[#092916] text-white rounded-[36px] p-6 md:p-8 shadow-xl sticky top-24">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-yellow-primary text-green-deep flex items-center justify-center">
                <Mail className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Entrar com email</h2>
                <p className="text-sm text-white/65 font-semibold">Mais facil para recuperar seus pedidos.</p>
              </div>
            </div>

            <form onSubmit={handleEmailLookup} className="mt-7 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-yellow-primary mb-2">
                  Email usado no pedido
                </label>
                <input
                  type="email"
                  value={lookupEmail}
                  onChange={(event) => setLookupEmail(event.target.value)}
                  placeholder="seuemail@dominio.com"
                  className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-4 text-white font-bold outline-none focus:border-yellow-primary"
                />
              </div>
              {lookupError && (
                <p className="text-xs font-bold text-red-200 bg-red-950/40 rounded-xl px-3 py-2">{lookupError}</p>
              )}
              <button
                type="submit"
                disabled={lookupLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-yellow-primary text-green-deep px-5 py-4 text-sm font-black hover:bg-white transition disabled:opacity-60"
              >
                <Search className="w-4 h-4" />
                {lookupLoading ? "Buscando..." : "Ver meus pedidos"}
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAdvancedRecover((value) => !value)}
                className="text-xs font-black uppercase tracking-widest text-yellow-primary hover:text-white transition"
              >
                Estou em outro aparelho
              </button>

              {showAdvancedRecover && (
                <form onSubmit={handleAdvancedRecover} className="mt-4 space-y-3">
                  <input
                    value={recoverId}
                    onChange={(event) => setRecoverId(event.target.value)}
                    placeholder="Codigo do pedido"
                    className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white font-bold outline-none focus:border-yellow-primary"
                  />
                  <input
                    value={recoverToken}
                    onChange={(event) => setRecoverToken(event.target.value)}
                    placeholder="Chave do link"
                    className="w-full rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-white font-bold outline-none focus:border-yellow-primary"
                  />
                  <button type="submit" className="w-full rounded-full bg-white text-green-deep px-4 py-3 text-xs font-black">
                    Recuperar por link antigo
                  </button>
                </form>
              )}
            </div>

            <div className="mt-7 pt-6 border-t border-white/10 flex gap-3 text-sm text-white/70 font-semibold leading-relaxed">
              <Clock className="w-5 h-5 text-yellow-primary shrink-0" />
              <p>Para notificacao fora do site, o cliente precisa ativar alertas no pedido. Sem permissao do navegador, nenhum site consegue apitar no celular fechado.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
