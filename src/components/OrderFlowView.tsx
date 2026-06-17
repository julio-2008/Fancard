import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, Ticket, Image as ImageIcon, User, Mail, ShieldAlert,
  ClipboardList, QrCode, CheckCheck, Sparkles, ArrowRight,
  ArrowLeft, Copy, Check, Upload, ArrowUpRight, BadgeCheck,
  Zap, Shield, Compass, Loader2
} from "lucide-react";
import { OrderState, OrderStep, PackageId } from "../types";
import { FancardPreview } from "./FancardPreview";
import { Logo } from "./Logo";
import { MercadoPagoCard } from "./MercadoPagoCard";
import { validatePhotoFile } from "../lib/imageValidation";
import { saveOrderHistoryItem } from "../lib/orderHistory";

interface OrderFlowViewProps {
  initialPackageId: PackageId | null;
  onBackHome: () => void;
}

const packageMap = {
  individual: { name: "Individual", quantity: 1, price: "R$ 14,90", priceValue: 14.90 },
  trio: { name: "Trio", quantity: 3, price: "R$ 26,97", priceValue: 26.97 },
  familia: { name: "Família / Amigos", quantity: 5, price: "R$ 35,97", priceValue: 35.97 },
};

const stepOrder: OrderStep[] = [
  "package",
  "photo",
  "delivery",
  "summary",
];

const stepNamesMap: Record<OrderStep, string> = {
  package: "Escolha do Pacote",
  photo: "Personalizar Figurinha",
  delivery: "Dados de Entrega",
  summary: "Resumo Técnico",
  card: "Pagamento Cartão",
  pix: "Pagamento Pix",
  review: "Revisão Geral",
  production: "Esteira de Design",
};

export const OrderFlowView: React.FC<OrderFlowViewProps> = ({
  initialPackageId,
  onBackHome,
}) => {
  // Estado local gerenciado em React
  const [orderState, setOrderState] = useState<OrderState>(() => {
    let savedProfile: { name?: string; email?: string } = {};
    try {
      savedProfile = JSON.parse(localStorage.getItem("fancardCustomerProfile") || "{}");
    } catch {
      savedProfile = {};
    }
    const qty = initialPackageId ? (packageMap[initialPackageId]?.quantity || 1) : 1;
    const defaultItems = Array.from({ length: qty }, (_, i) => ({
      id: `figurinha_${i}`,
      photo: null,
      cardData: {
        name: "",
        birthDate: "",
        city: "",
        uf: "",
        height: "",
        weight: "",
        overall: 99,
        attributes: {
          vel: 99,
          fin: 99,
          pas: 99,
          dri: 99,
          def: 99,
          fis: 99,
        },
      },
    }));

    return {
      packageId: initialPackageId,
      items: defaultItems,
      activeItemIndex: 0,
      paymentStatus: "not_started",
      photo: null,
      cardData: {
        name: "",
        birthDate: "",
        city: "",
        uf: "",
        height: "",
        weight: "",
        overall: 99,
        attributes: {
          vel: 99,
          fin: 99,
          pas: 99,
          dri: 99,
          def: 99,
          fis: 99,
        },
      },
      deliveryData: {
        buyerName: savedProfile.name || "",
        buyerEmail: savedProfile.email || "",
        confirmEmail: savedProfile.email || "",
        phone: "",
      },
      activeStep: initialPackageId ? "photo" : "package",
      completedSteps: initialPackageId ? ["package"] : [],
    };
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [productionPercent, setProductionPercent] = useState(0);
  const [productionStep, setProductionStep] = useState(0);
  const [isBracketMobileOpen, setIsBracketMobileOpen] = useState(false);

  const [mpStatus, setMpStatus] = useState<"idle" | "loading" | "success" | "simulated" | "error">("idle");
  const [mpCheckoutUrl, setMpCheckoutUrl] = useState<string>("");
  const [mpPreferenceId, setMpPreferenceId] = useState<string>("");
  const [buyerCpf, setBuyerCpf] = useState<string>("123.456.789-09");
  const [transparentPixData, setTransparentPixData] = useState<{ paymentId: number; qrCode: string; qrCodeBase64: string } | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState<boolean>(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Efeito para carregar o Pix do Checkout Transparente de forma automática e integrada no fluxo
  useEffect(() => {
    if (orderState.activeStep === "pix" && !transparentPixData && !isGeneratingPix) {
      const generateTransparentPix = async () => {
        setIsGeneratingPix(true);
        setMpStatus("loading");
        try {
          const currentPackageId = orderState.packageId || "individual";
          const packageInfo = packageMap[currentPackageId];
          
          console.log("Requisitando Pix Transparente ao backend para:", orderState.deliveryData.buyerEmail);

          const response = await fetch("/api/mercado-pago/create-payment-pix", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              packageId: currentPackageId,
              priceValue: packageInfo.priceValue,
              buyerName: orderState.deliveryData.buyerName,
              buyerEmail: orderState.deliveryData.buyerEmail,
              cpf: buyerCpf,
            }),
          });

          if (!response.ok) {
            throw new Error("Erro de comunicação com endpoint Pix do backend");
          }

          const data = await response.json();
          if (data.status === "simulated") {
            setMpStatus("simulated");
            setTransparentPixData({
              paymentId: data.paymentId,
              qrCode: data.qrCode,
              qrCodeBase64: "", // Sem base64 para simulação
            });
          } else if (data.status === "success") {
            setMpStatus("success");
            setTransparentPixData({
              paymentId: data.paymentId,
              qrCode: data.qrCode,
              qrCodeBase64: data.qrCodeBase64,
            });
            // Opcional: Salva caso queira um fallback de link do checkout pro também
            setMpCheckoutUrl(`https://www.mercadopago.com.br/payments/123456/link`); // Placeholder se não enviado
          } else {
            throw new Error("Resposta inválida no formato de Pix Transparente");
          }
        } catch (error) {
          console.error("Erro ao gerar Pix no Checkout Transparente:", error);
          setMpStatus("error");
        } finally {
          setIsGeneratingPix(false);
        }
      };

      generateTransparentPix();
    } else if (orderState.activeStep !== "pix") {
      // Limpa os estados quando sai do faturamento para permitir novas requisições limpas
      setMpStatus("idle");
      setTransparentPixData(null);
      setIsGeneratingPix(false);
    }
  }, [orderState.activeStep, orderState.packageId, orderState.deliveryData, buyerCpf]);

  // Carregar dados salvos se existirem
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fancardProgressData");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.packageId) {
          const qty = packageMap[parsed.packageId]?.quantity || 1;
          const items = Array.isArray(parsed.items) && parsed.items.length === qty
            ? parsed.items
            : Array.from({ length: qty }, (_, i) => ({
                id: `figurinha_${i}`,
                photo: null,
                cardData: {
                  name: "",
                  birthDate: "",
                  city: "",
                  uf: "",
                  height: "",
                  weight: "",
                  overall: 99,
                  attributes: { vel: 99, fin: 99, pas: 99, dri: 99, def: 99, fis: 99 }
                }
              }));

          // Migrar etapas obsoletas antigas se houver
          let migratedActiveStep = parsed.activeStep;
          if (migratedActiveStep === "data") {
            migratedActiveStep = "photo";
          } else if (migratedActiveStep === "fancard") {
            migratedActiveStep = "summary";
          }

          const migratedCompletedSteps = (parsed.completedSteps || [])
            .filter((s: string) => s !== "data" && s !== "fancard");

          setOrderState({
            ...parsed,
            items,
            activeStep: migratedActiveStep,
            completedSteps: migratedCompletedSteps,
            activeItemIndex: typeof parsed.activeItemIndex === "number" ? parsed.activeItemIndex : 0,
            paymentStatus: parsed.paymentStatus || "not_started"
          });
        }
      }
    } catch (e) {
      console.error("Erro ao carregar progresso salvo", e);
    }
  }, []);

  // Salvar progresso
  const saveState = (newState: OrderState) => {
    setOrderState(newState);
    try {
      localStorage.setItem("fancardProgressData", JSON.stringify(newState));
    } catch (e: any) {
      // Se exceder a quota do LocalStorage (QuotaExceededError), salvamos os dados sem as imagens pesadas para evitar crash
      if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
        console.warn("QuotaExceededError: Salvando estado reduzido no localStorage (sem base64 de fotos volumosas).");
        try {
          const sanitizedItems = (newState.items || []).map(item => ({
            ...item,
            photo: (item.photo && item.photo.length > 20000) ? null : item.photo
          }));
          const sanitizedState = {
            ...newState,
            items: sanitizedItems
          };
          localStorage.setItem("fancardProgressData", JSON.stringify(sanitizedState));
        } catch (innerError) {
          console.error("Erro interno ao tentar salvar progresso higienizado:", innerError);
          try {
            localStorage.removeItem("fancardProgressData");
          } catch (_) {}
        }
      } else {
        console.error("Erro ao salvar progresso no localStorage:", e);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Cálculo automático do overall do jogador (média simples dos atributos)
  const calculateOverall = (
    attrs: typeof orderState.cardData.attributes
  ) => {
    const raw = (attrs.vel + attrs.fin + attrs.pas + attrs.dri + attrs.def + attrs.fis) / 6;
    return Math.min(99, Math.max(30, Math.round(raw)));
  };

  // Tratadores de navegação
  const isStepUnlocked = (step: OrderStep) => {
    const idx = stepOrder.indexOf(step);
    if (idx === 0) return true;
    return orderState.completedSteps.includes(stepOrder[idx - 1]);
  };

  const handleStepClick = (step: OrderStep) => {
    if (isStepUnlocked(step) || orderState.completedSteps.includes(step)) {
      saveState({
        ...orderState,
        activeStep: step,
      });
    } else {
      showToast("Por favor, conclua os lances anteriores para desbloquear esta etapa.");
    }
  };

  const handleBackStep = (targetStep: OrderStep) => {
    saveState({
      ...orderState,
      activeStep: targetStep,
    });
  };

  const markStepDone = (currentStep: OrderStep, nextStep: OrderStep) => {
    const completed = [...orderState.completedSteps];
    if (!completed.includes(currentStep)) {
      completed.push(currentStep);
    }
    saveState({
      ...orderState,
      completedSteps: completed,
      activeStep: nextStep,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 1. Tratamento da seleção do pacote
  const handleSelectPackage = (id: PackageId) => {
    const packageInfo = packageMap[id];
    const completed = [...orderState.completedSteps];
    if (!completed.includes("package")) {
      completed.push("package");
    }
    const qty = packageInfo.quantity;
    const defaultItems = Array.from({ length: qty }, (_, i) => ({
      id: `figurinha_${i}`,
      photo: null,
      cardData: {
        name: "",
        birthDate: "",
        city: "",
        uf: "",
        height: "",
        weight: "",
        overall: 99,
        attributes: {
          vel: 99,
          fin: 99,
          pas: 99,
          dri: 99,
          def: 99,
          fis: 99,
        },
      },
    }));

    saveState({
      ...orderState,
      packageId: id,
      items: defaultItems,
      activeItemIndex: 0,
      completedSteps: completed,
      activeStep: "photo",
    });
    showToast(`Pacote ${packageInfo.name} selecionado. Agora, envie as fotos de craque!`);
  };

  // 2. Upload de Foto
  const processPhotoFile = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showToast("Por favor, selecione um formato de imagem válido (JPG, PNG ou WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (e.target?.result) {
          const dataUrl = e.target.result as string;
          
          // Ação: Validar foto com try-catch
          const validation = await validatePhotoFile(dataUrl).catch(err => {
            console.error("Erro na validação:", err);
            return { isValid: false, message: "Erro ao processar imagem.", severity: "reprovada" as const };
          });
          
          if (!validation.isValid) {
            showToast(validation.message);
            return;
          }

          const updated = [...(orderState.items || [])];
          if (updated[orderState.activeItemIndex]) {
            updated[orderState.activeItemIndex] = {
              ...updated[orderState.activeItemIndex],
              photo: dataUrl,
            };
          }
          saveState({
            ...orderState,
            photo: dataUrl,
            items: updated,
          });
          showToast(`Foto da Figurinha #${orderState.activeItemIndex + 1} validada e carregada!`);
        }
      } catch (error) {
        console.error("Erro fatal no processamento da imagem:", error);
        showToast("Ocorreu um erro interno ao processar esta foto.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPhotoFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processPhotoFile(file);
  };

  const handleSavePersonalization = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validações completas para a figurinha ativa (Item atual)
    const cardNum = orderState.activeItemIndex + 1;
    if (!currentItem.photo) {
      showToast(`Falta enviar a foto da FanCard ${cardNum}.`);
      return;
    }
    if (!currentItem.cardData.name || !currentItem.cardData.name.trim()) {
      showToast(`Falta preencher o nome da FanCard ${cardNum}.`);
      return;
    }
    if (!currentItem.cardData.birthDate || !currentItem.cardData.birthDate.trim()) {
      showToast(`Falta preencher a data de nascimento da FanCard ${cardNum}.`);
      return;
    }
    if (!currentItem.cardData.city || !currentItem.cardData.city.trim()) {
      showToast(`Falta preencher a cidade ou time da FanCard ${cardNum}.`);
      return;
    }
    if (!currentItem.cardData.uf || !currentItem.cardData.uf.trim()) {
      showToast(`Selecione a UF da FanCard ${cardNum}.`);
      return;
    }
    if (!currentItem.cardData.height || !currentItem.cardData.height.trim()) {
      showToast(`Falta preencher a altura da FanCard ${cardNum}.`);
      return;
    }
    if (!currentItem.cardData.weight || !currentItem.cardData.weight.trim()) {
      showToast(`Falta preencher o peso da FanCard ${cardNum}.`);
      return;
    }

    const qty = orderState.packageId ? packageMap[orderState.packageId].quantity : 1;
    
    if (orderState.activeItemIndex < qty - 1) {
      // Avança para a próxima figurinha do mesmo pacote
      saveState({
        ...orderState,
        activeItemIndex: orderState.activeItemIndex + 1,
      });
      showToast(`Figurinha #${orderState.activeItemIndex + 1} configurada! Agora, faça os ajustes para a #${orderState.activeItemIndex + 2}.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Se todas as figurinhas foram configuradas e salvas, avança para os dados de entrega
      const completed = [...orderState.completedSteps];
      if (!completed.includes("photo")) {
        completed.push("photo");
      }
      saveState({
        ...orderState,
        completedSteps: completed,
        activeStep: "delivery",
        activeItemIndex: 0, // Resetar para o primeiro item ao avançar
      });
      showToast("Personalização salva com sucesso! Insira suas coordenadas de entrega.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAttributeChange = (key: keyof typeof orderState.cardData.attributes, val: number) => {
    const updated = [...(orderState.items || [])];
    const item = updated[orderState.activeItemIndex];
    if (!item) return;

    const newAttrs = {
      ...item.cardData.attributes,
      [key]: val,
    };
    const newOverall = calculateOverall(newAttrs);
    
    updated[orderState.activeItemIndex] = {
      ...item,
      cardData: {
        ...item.cardData,
        attributes: newAttrs,
        overall: newOverall,
      }
    };

    saveState({
      ...orderState,
      items: updated,
    });
  };

  // 4. Cadastro de dados de entrega
  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const { buyerName, buyerEmail } = orderState.deliveryData;
    if (!buyerName.trim()) {
      showToast("Informe o nome completo do comprador.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      showToast("Insira um endereço de e-mail válido para a entrega digital.");
      return;
    }
    if (false) {
      showToast("A confirmação do e-mail não coincide. Verifique as caixas.");
      return;
    }
    localStorage.setItem("fancardCustomerProfile", JSON.stringify({
      name: buyerName.trim(),
      email: buyerEmail.trim().toLowerCase(),
    }));
    saveState({
      ...orderState,
      deliveryData: {
        ...orderState.deliveryData,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim().toLowerCase(),
        confirmEmail: buyerEmail.trim().toLowerCase(),
      },
    });
    markStepDone("delivery", "summary");
  };

  const handleSubmitOrder = async () => {
    if (isSubmittingOrder) return;
    setIsSubmittingOrder(true);
    showToast("⏰ Criando seu pedido seguro e processando as fotos... Aguarde.");

    const currentPackageId = orderState.packageId || "individual";
    const packageInfo = packageMap[currentPackageId];
    const payload = {
      packageId: currentPackageId,
      buyer: {
        name: orderState.deliveryData.buyerName,
        email: orderState.deliveryData.buyerEmail,
        phone: orderState.deliveryData.phone,
      },
      items: (orderState.items || []).map((item, idx) => ({
        photo: item.photo,
        originalPhotoName: `fancard_orig_${idx + 1}.png`,
        cardData: {
          name: item.cardData.name,
          birthDate: item.cardData.birthDate,
          city: item.cardData.city,
          uf: item.cardData.uf,
          height: item.cardData.height,
          weight: item.cardData.weight,
        }
      }))
    };

    let data;
    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha na criação do pedido no servidor.");
      }

      data = await response.json();
    } catch (err) {
      console.error("[API Error] Falha ao criar pedido:", err);
      showToast("Não foi possível criar o pedido agora. Verifique sua conexão ou tente novamente em alguns segundos.");
      setIsSubmittingOrder(false);
      return;
    }

    showToast("🚀 Pedido e faturamento gerados! Redirecionando...");
    localStorage.removeItem("fancardProgressData");
    saveOrderHistoryItem({
      orderId: data.orderId,
      accessToken: data.accessToken,
      checkoutUrl: data.checkoutUrl,
      packageName: data.packageName || packageInfo.name,
      packageId: currentPackageId,
      quantity: packageInfo.quantity,
      price: packageInfo.priceValue,
      buyerName: orderState.deliveryData.buyerName,
      buyerEmail: orderState.deliveryData.buyerEmail,
      createdAt: new Date().toISOString(),
    });

    // Redirect immediately to Checkout Pro or simulated test window
    if (!data.checkoutUrl) {
      showToast("Erro: Checkout Mercado Pago não retornou URL de pagamento. Tente novamente.");
      setIsSubmittingOrder(false);
      return;
    }

    setTimeout(() => {
      window.location.href = data.checkoutUrl;
    }, 800);
  };

  // 7. Fluxo de pagamento via Pix copia e cola simulado
  const handleCopyPix = () => {
    const code = "00020101021226870014br.gov.bcb.pix2565pix.fancard.brasil/cobranca/digital/2603202652040000530398654049.955802BR5914FanCardBrasil6009SaoPaulo62070503fcd";
    navigator.clipboard.writeText(code);
    setPixCopiado(true);
    showToast("Código Copia e Cola do Pix copiado com sucesso!");
    setTimeout(() => setPixCopiado(false), 3000);
  };

  // Simula o processamento do pagamento após Pix
  const handleConfirmPix = () => {
    setIsVerifyingPayment(true);
    showToast("Confirmando pagamento com a rede de recebimento...");
    setTimeout(() => {
      setIsVerifyingPayment(false);
      markStepDone("pix", "review");
      showToast("Pagamento pré-confirmado em nossa esteira! Prossiga para revisão fiscal.");
    }, 1800);
  };

  // 8. Enviar para a produção real
  const handleSendToProduction = () => {
    markStepDone("review", "production");
    setProductionPercent(0);
    setProductionStep(0);
    showToast("FanCard enviada para a esteira oficial de design!");
  };

  // Efeito para enriquecer a esteira de produção simulando cada passe
  useEffect(() => {
    if (orderState.activeStep !== "production") return;

    const interval = setInterval(() => {
      setProductionPercent((prev) => {
        if (prev >= 92) {
          clearInterval(interval);
          return 92;
        }
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return Math.min(92, next);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderState.activeStep]);

  useEffect(() => {
    if (productionPercent < 25) setProductionStep(0); // Recebido
    else if (productionPercent < 55) setProductionStep(1); // Conferido
    else if (productionPercent < 85) setProductionStep(2); // Arte em produção
    else if (productionPercent < 92) setProductionStep(3); // Acabamento
    else setProductionStep(4); // Em processamento final
  }, [productionPercent]);

  const currentItem = (orderState.items && orderState.items[orderState.activeItemIndex]) || {
    id: "figurinha_0",
    photo: null,
    cardData: {
      name: "",
      birthDate: "",
      city: "",
      uf: "",
      height: "",
      weight: "",
      overall: 99,
      attributes: { vel: 99, fin: 99, pas: 99, dri: 99, def: 99, fis: 99 }
    }
  };
  const packageInfo = orderState.packageId ? packageMap[orderState.packageId] : { name: "Individual", quantity: 1, price: "R$ 9,95" };

  return (
    <div className="w-full">
      <main className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-12">
        {/* Cabeçalho de Introdução da Etapa */}
        <div className="mb-8 md:mb-10">
          <p className="mono text-[10px] text-green-primary font-bold mb-3">
            SUA JORNADA DA VITÓRIA
          </p>
          <h1 className="display text-3xl sm:text-4xl md:text-5xl text-green-deep max-w-4xl">
            {orderState.activeStep === "production" 
              ? "Sua figurinha está no aquecimento."
              : "Monte sua FanCard até a grande final."
            }
          </h1>
          <p className="mt-4 max-w-3xl text-muted-text text-sm sm:text-base leading-relaxed font-semibold">
            {orderState.activeStep === "production"
              ? "Nossos designers já estão tratando seu arquivo, removendo o fundo e aplicando o mockup dourado."
              : "Defina o pacote, personalize seu jogador, revise os dados e acompanhe o pedido pela Minha Arquibancada."
            }
          </p>
        </div>

        {/* Grade de Layout: Grid Sidebar de Playoff vs Painel Ativo */}
        {/* Barra de Progresso Compacta no Mobile */}
        <div className="lg:hidden bg-gradient-to-r from-green-deep to-[#052618] border border-yellow-primary/30 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9.5 h-9.5 rounded-full bg-yellow-primary/10 flex items-center justify-center text-yellow-primary border border-yellow-primary/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-white text-xs tracking-tight leading-none">Chave FanCard</p>
              <p className="text-[10px] sm:text-xs text-white/70 mt-1 font-bold leading-none">
                Etapa {stepOrder.indexOf(orderState.activeStep) + 1} de {stepOrder.length}: <span className="text-yellow-primary uppercase tracking-wide font-mono">{stepNamesMap[orderState.activeStep]}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBracketMobileOpen(!isBracketMobileOpen)}
            className="bg-white/10 hover:bg-white/15 text-white border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-200 cursor-pointer active:scale-95"
          >
            {isBracketMobileOpen ? "Ocultar Chave" : "Ver Chave 🏆"}
          </button>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-8 items-start">
          
          {/* BARRA LATERAL: CHAVE FANCARD (Estilo tabela playoff real) */}
          <aside className={`bracket-wrap ${isBracketMobileOpen ? "block" : "hidden lg:block"} mb-6 lg:mb-0`}>
            <div className="relative z-10 mb-6 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-[#fff] text-lg tracking-tight leading-none">
                  Chave FanCard
                </p>
                <p className="text-xs text-white/60 mt-1.5 font-bold leading-none">
                  Do primeiro lance até a taça
                </p>
              </div>
              <Logo size={42} className="shadow-md hover:scale-105 transition-transform duration-300" />
            </div>

            {/* FASE 1: ENTRADA */}
            <div className="bracket-round">
              <p className="mono round-title">1ª FASE — CAPTAÇÃO</p>
              
              {/* Passo: Pacote */}
              <button
                type="button"
                onClick={() => handleStepClick("package")}
                className={`bracket-node text-left w-full rounded-2xl p-3 flex items-center justify-between border ${
                  orderState.completedSteps.includes("package")
                    ? "bg-white/15 border-white/25 text-white"
                    : orderState.activeStep === "package"
                    ? "bg-yellow-primary border-yellow-primary text-green-deep shadow-xl translate-x-1"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    orderState.activeStep === "package" ? "border-green-deep" : "border-white/20"
                  }`}>
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm leading-none">Pacote</p>
                    <p className={`text-[10px] mt-1 leading-none ${
                      orderState.activeStep === "package" ? "text-green-deep/70" : "text-white/40"
                    }`}>
                      {orderState.packageId ? packageMap[orderState.packageId].name : "Defina seu jogo"}
                    </p>
                  </div>
                </div>
                {orderState.completedSteps.includes("package") && <CheckCheck className="w-4 h-4 text-yellow-primary" />}
              </button>

              <div className="bracket-connector"></div>

              {/* Passo: Personalização (Foto e Atributos combinados) */}
              <button
                type="button"
                onClick={() => handleStepClick("photo")}
                disabled={!isStepUnlocked("photo") && !orderState.completedSteps.includes("photo")}
                className={`bracket-node text-left w-full rounded-2xl p-3 flex items-center justify-between border ${
                  orderState.completedSteps.includes("photo")
                    ? "bg-white/15 border-white/25 text-white"
                    : orderState.activeStep === "photo"
                    ? "bg-yellow-primary border-yellow-primary text-green-deep shadow-xl translate-x-1"
                    : !isStepUnlocked("photo")
                    ? "opacity-40 cursor-not-allowed bg-black/20 border-white/5 text-white/30"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    orderState.activeStep === "photo" ? "border-green-deep" : "border-white/20"
                  }`}>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm leading-none">Personalizar</p>
                    <p className={`text-[10px] mt-1 leading-none ${
                      orderState.activeStep === "photo" ? "text-green-deep/70" : "text-white/40"
                    }`}>
                      {orderState.photo ? "Carregada" : "Foto e Atributos"}
                    </p>
                  </div>
                </div>
                {orderState.completedSteps.includes("photo") && <CheckCheck className="w-4 h-4 text-yellow-primary" />}
              </button>

              <div className="bracket-connector"></div>

              {/* Passo: Entrega */}
              <button
                type="button"
                onClick={() => handleStepClick("delivery")}
                disabled={!isStepUnlocked("delivery") && !orderState.completedSteps.includes("delivery")}
                className={`bracket-node text-left w-full rounded-2xl p-3 flex items-center justify-between border ${
                  orderState.completedSteps.includes("delivery")
                    ? "bg-white/15 border-white/25 text-white"
                    : orderState.activeStep === "delivery"
                    ? "bg-yellow-primary border-yellow-primary text-green-deep shadow-xl translate-x-1"
                    : !isStepUnlocked("delivery")
                    ? "opacity-40 cursor-not-allowed bg-black/20 border-white/5 text-white/30"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    orderState.activeStep === "delivery" ? "border-green-deep" : "border-white/20"
                  }`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm leading-none">Destinatário</p>
                    <p className={`text-[10px] mt-1 leading-none ${
                      orderState.activeStep === "delivery" ? "text-green-deep/70" : "text-white/40"
                    }`}>
                      {orderState.deliveryData.buyerName ? "Contatos salvos" : "Onde enviar"}
                    </p>
                  </div>
                </div>
                {orderState.completedSteps.includes("delivery") && <CheckCheck className="w-4 h-4 text-yellow-primary" />}
              </button>
            </div>

            {/* FASE 2: REVISÃO COMPONENTES */}
            <div className="bracket-round">
              <p className="mono round-title">2ª FASE — REVISÃO</p>

              {/* Passo: Resumo */}
              <button
                type="button"
                onClick={() => handleStepClick("summary")}
                disabled={!isStepUnlocked("summary") && !orderState.completedSteps.includes("summary")}
                className={`bracket-node text-left w-full rounded-2xl p-3 flex items-center justify-between border ${
                  orderState.completedSteps.includes("summary")
                    ? "bg-white/15 border-white/25 text-white"
                    : orderState.activeStep === "summary"
                    ? "bg-yellow-primary border-yellow-primary text-green-deep shadow-xl translate-x-1"
                    : !isStepUnlocked("summary")
                    ? "opacity-40 cursor-not-allowed bg-black/20 border-white/5 text-white/30"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    orderState.activeStep === "summary" ? "border-green-deep" : "border-white/20"
                  }`}>
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm leading-none">Súmula Geral</p>
                    <p className={`text-[10px] mt-1 leading-none ${
                      orderState.activeStep === "summary" ? "text-green-deep/70" : "text-white/40"
                    }`}>
                      Prévia dos Atletas
                    </p>
                  </div>
                </div>
                {orderState.completedSteps.includes("summary") && <CheckCheck className="w-4 h-4 text-yellow-primary" />}
              </button>
            </div>

            {/* FASE 3: CONFIRMAÇÃO */}
            <div className="bracket-round">
              <p className="mono round-title">CONFIRMAÇÃO</p>

              {/* Passo: Pix */}
              <button
                type="button"
                onClick={() => handleStepClick("pix")}
                disabled={!isStepUnlocked("pix") && !orderState.completedSteps.includes("pix")}
                className={`bracket-node text-left w-full rounded-2xl p-3 flex items-center justify-between border ${
                  orderState.completedSteps.includes("pix")
                    ? "bg-white/15 border-white/25 text-white"
                    : orderState.activeStep === "pix"
                    ? "bg-yellow-primary border-yellow-primary text-green-deep shadow-xl translate-x-1"
                    : !isStepUnlocked("pix")
                    ? "opacity-40 cursor-not-allowed bg-black/20 border-white/5 text-white/30"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    orderState.activeStep === "pix" ? "border-green-deep" : "border-white/20"
                  }`}>
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm leading-none">Pix Automático</p>
                    <p className={`text-[10px] mt-1 leading-none ${
                      orderState.activeStep === "pix" ? "text-green-deep/70" : "text-white/40"
                    }`}>
                      Garantia de transação
                    </p>
                  </div>
                </div>
                {orderState.completedSteps.includes("pix") && <CheckCheck className="w-4 h-4 text-yellow-primary" />}
              </button>

              <div className="bracket-connector"></div>

              {/* Passo: Revisão */}
              <button
                type="button"
                onClick={() => handleStepClick("review")}
                disabled={!isStepUnlocked("review") && !orderState.completedSteps.includes("review")}
                className={`bracket-node text-left w-full rounded-2xl p-3 flex items-center justify-between border ${
                  orderState.completedSteps.includes("review")
                    ? "bg-white/15 border-white/25 text-white"
                    : orderState.activeStep === "review"
                    ? "bg-yellow-primary border-yellow-primary text-green-deep shadow-xl translate-x-1"
                    : !isStepUnlocked("review")
                    ? "opacity-40 cursor-not-allowed bg-black/20 border-white/5 text-white/30"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    orderState.activeStep === "review" ? "border-green-deep" : "border-white/20"
                  }`}>
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm leading-none">Revisão Geral</p>
                    <p className={`text-[10px] mt-1 leading-none ${
                      orderState.activeStep === "review" ? "text-green-deep/70" : "text-white/40"
                    }`}>
                      Análise de dados físicos
                    </p>
                  </div>
                </div>
                {orderState.completedSteps.includes("review") && <CheckCheck className="w-4 h-4 text-yellow-primary" />}
              </button>
            </div>

            {/* FASE FINAL */}
            <div className="bracket-round text-white">
              <p className="mono round-title">FINAL REVEAL</p>

              {/* Passo: Produção */}
              <button
                type="button"
                onClick={() => handleStepClick("production")}
                disabled={!isStepUnlocked("production") && !orderState.completedSteps.includes("production")}
                className={`bracket-node text-left w-full rounded-2xl p-3 flex items-center justify-between border ${
                  orderState.completedSteps.includes("production")
                    ? "bg-white/15 border-white/25 text-white"
                    : orderState.activeStep === "production"
                    ? "bg-gradient-to-r from-yellow-primary to-yellow-primary/80 border-yellow-primary text-green-deep shadow-xl translate-x-1"
                    : !isStepUnlocked("production")
                    ? "opacity-40 cursor-not-allowed bg-black/20 border-white/5 text-white/30"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                    orderState.activeStep === "production" ? "border-green-deep" : "border-white/20"
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm leading-none">Esteira de Design</p>
                    <p className={`text-[10px] mt-1 leading-none ${
                      orderState.activeStep === "production" ? "text-green-deep/70" : "text-white/40"
                    }`}>
                      Rumo aos Campeões
                    </p>
                  </div>
                </div>
                {orderState.completedSteps.includes("production") && <CheckCheck className="w-4 h-4 text-green-primary" />}
              </button>
            </div>
          </aside>

          {/* PAINEL DINÂMICO CENTRAL DO PASSO SELECIONADO */}
          <section className="order-panel min-h-[560px] bg-white border border-[#e0e8e1] rounded-[28px] shadow-lg overflow-hidden relative">
            <AnimatePresence mode="wait">
              {/* ETAPA 1: SELEÇÃO DE PACOTES */}
              {orderState.activeStep === "package" && (
                <motion.div
                  key="package-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="panel-inner p-6 md:p-8"
                >
                  <p className="mono panel-kicker text-xs font-bold text-green-primary">ETAPA 01 — SEU INGRESSO</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-green-deep tracking-tight mt-3">
                    Selecione o seu pacote oficial.
                  </h2>
                  <p className="text-muted-text mt-2 font-medium">
                    Defina agora quantas figurinhas você quer que nossa equipe trate e produza nesta campanha.
                  </p>

                  <div className="grid md:grid-cols-3 gap-5 mt-8">
                    {/* Opção Individual */}
                    <button
                      type="button"
                      onClick={() => handleSelectPackage("individual")}
                      className={`choice-card text-left p-6 border rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                        orderState.packageId === "individual"
                          ? "border-green-primary bg-green-primary/5 shadow-md scale-102"
                          : "border-line-border bg-white hover:border-green-primary/50 hover:shadow-md"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-green-primary/10 text-green-primary flex items-center justify-center">
                        <Ticket className="w-5 h-5" />
                      </div>
                      <div className="mt-4">
                        <span className="inline-flex bg-slate-100 text-green-deep rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-wider mb-2">
                          Arte individual
                        </span>
                        <h3 className="font-extrabold text-green-deep text-lg leading-tight">Individual</h3>
                        <p className="text-muted-text text-[11px] font-semibold mt-1">1 figurinha exclusiva</p>
                        <p className="text-[10px] text-green-primary font-bold mt-1">R$ 14,90 por FanCard</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-line-border/40 flex items-baseline justify-between w-full">
                        <span className="font-mono text-xs text-muted-text font-bold">INVESTIMENTO</span>
                        <span className="font-black text-green-primary text-xl">R$ 14,90</span>
                      </div>
                    </button>

                    {/* Opção Trio (Ancoragem) */}
                    <button
                      type="button"
                      onClick={() => handleSelectPackage("trio")}
                      className={`choice-card text-left p-6 border rounded-2xl cursor-pointer transition-all duration-300 relative flex flex-col justify-between ${
                        orderState.packageId === "trio"
                          ? "border-yellow-primary bg-yellow-primary/5 shadow-md scale-102"
                          : "border-line-border bg-white hover:border-[#103c27]/40 hover:shadow-md"
                      }`}
                    >
                      <div className="absolute top-3 right-3 bg-yellow-primary/30 text-[#103c27] rounded px-2 py-0.5 text-[8px] font-black tracking-wider uppercase">
                        GANHE QUASE 40% OFF
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-yellow-primary/10 text-yellow-primary flex items-center justify-center">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div className="mt-4">
                        <span className="text-[9px] text-red-500 font-bold line-through">De R$ 44,70</span>
                        <h3 className="font-extrabold text-[#113a23] text-lg leading-tight">Trio Tático</h3>
                        <p className="text-muted-text text-[11px] font-semibold mt-1">3 figurinhas individuais</p>
                        <p className="text-[10px] text-green-primary font-bold mt-1">R$ 8,99 por FanCard</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-line-border/40 flex items-baseline justify-between w-full">
                        <span className="font-mono text-xs text-muted-text font-bold">VALOR</span>
                        <span className="font-black text-[#103c27] text-xl">R$ 26,97</span>
                      </div>
                    </button>

                    {/* Opção Família (O GANHADOR DE VENDAS / EXTREMO BEST SELLER) */}
                    <button
                      type="button"
                      onClick={() => handleSelectPackage("familia")}
                      className={`choice-card text-left p-6 border rounded-2xl cursor-pointer transition-all duration-300 bg-[#092916] relative flex flex-col justify-between ${
                        orderState.packageId === "familia"
                          ? "border-yellow-primary shadow-2xl scale-[1.02] text-white ring-2 ring-yellow-primary/45"
                          : "border-yellow-primary/40 hover:border-yellow-primary hover:shadow-xl hover:translate-y-[-2px]"
                      }`}
                    >
                      <div className="absolute top-3 right-3 bg-yellow-primary text-green-deep rounded px-2 py-0.5 text-[8px] font-black tracking-wider uppercase animate-pulse">
                        RECOMENDADO • 51% OFF
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-yellow-primary text-green-deep flex items-center justify-center shadow-md">
                        <Shield className="w-5 h-5 text-green-deep" />
                      </div>
                      <div className="mt-4">
                        <span 
                          className={`text-[9.5px] font-black line-through block mb-0.5 ${orderState.packageId === "familia" ? "text-red-300" : "text-red-400"}`}
                        >
                          De R$ 74,50 se compradas separadamente
                        </span>
                        <h3 
                          className="font-black text-lg leading-tight text-white"
                        >
                          Seleção Completa
                        </h3>
                        <p 
                          className="text-[11px] font-bold mt-1 text-white/50"
                        >
                          5 figurinhas de uma vez • Unidade de Equipe
                        </p>
                        <p className="text-[11px] text-yellow-primary font-bold mt-1">R$ 7,19 por FanCard</p>
                      </div>

                      {/* Caixa de Explanação do Combo para impulsionar */}
                      <div className="mt-3 p-2.5 rounded-xl text-[10px] leading-relaxed font-semibold border bg-white/10 border-white/15 text-white/95 flex items-start gap-2">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-primary" />
                        <span>
                          Por apenas <strong className="text-yellow-primary">R$ 9,00 adicionais</strong> em relação ao Trio, você garante <strong className="text-yellow-primary">+2 figurinhas extras</strong> para sua seleção oficial de clube.
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline justify-between w-full">
                        <span className="font-mono text-xs font-bold text-white/60">INVESTIMENTO</span>
                        <span 
                          className="font-black text-xl text-white"
                        >
                          R$ 35,97
                        </span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 2: PERSONALIZAR FIGURINHA (FOTO + DADOS + ATRIBUTOS NO MESMO PAINEL) */}
              {orderState.activeStep === "photo" && (
                <motion.div
                  key="photo-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="panel-inner p-6 md:p-8"
                >
                  <p className="mono panel-kicker text-xs font-bold text-green-primary">ETAPA 02 — CONFIGURAR SEU JOGADOR</p>
                  
                  {/* Seletor de figurinhas se for pacote múltiplo */}
                  {orderState.packageId && packageMap[orderState.packageId].quantity > 1 && (
                    <div className="flex items-center gap-2 mt-4 mb-6 bg-slate-100 p-2.5 rounded-xl border border-line-border/30 overflow-x-auto">
                      <span className="text-[10px] font-black text-green-deep uppercase tracking-wider whitespace-nowrap mr-2">
                        Escalação do Pacote:
                      </span>
                      {(orderState.items || []).map((item, idx) => {
                        const hasFullData = !!item.photo && !!item.cardData.name.trim() && !!item.cardData.city.trim();
                        const isActive = idx === orderState.activeItemIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              saveState({
                                ...orderState,
                                activeItemIndex: idx,
                              });
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                              isActive
                                ? "bg-yellow-primary border-yellow-primary text-green-deep font-black shadow-sm scale-102"
                                : "bg-white border-line-border text-green-deep hover:bg-soft-bg"
                            }`}
                          >
                            <span>Figurinha #{idx + 1}</span>
                            {hasFullData && (
                              <span className="w-2 h-2 rounded-full bg-green-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <h2 className="text-2xl sm:text-3xl font-black text-green-deep tracking-tight mt-3">
                    {orderState.packageId && packageMap[orderState.packageId].quantity > 1 
                      ? `Customize a Figurinha #${orderState.activeItemIndex + 1} do seu Pacote`
                      : "Customize sua Foto e Atributos Técnicos"
                    }
                  </h2>
                  <p className="text-muted-text mt-2 font-medium">
                    Envie uma foto em alta definição e configure as informações com os atributos táticos que vão estampar seu cromo.
                  </p>

                  <div className="mt-8 grid lg:grid-cols-12 gap-8 items-start">
                    
                    {/* COLUNA ESQUERDA: FOTO (5 colunas) */}
                    <div className="lg:col-span-5 space-y-6">
                      <span className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                        1. Envie a Imagem Oficial do Craque
                      </span>

                      {/* Box da Foto Atualmente Carregada (se houver) */}
                      {currentItem.photo ? (
                        <div className="relative border border-green-primary/30 rounded-2xl p-4 bg-green-primary/5 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-green-primary/20 shrink-0 bg-white">
                            <img src={currentItem.photo} className="w-full h-full object-cover" alt="Foto Carregada" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-green-deep uppercase leading-none">Imagem Carregada</p>
                            <p className="text-[10px] text-muted-text mt-1.5 truncate">Você já enviou o arquivo oficial.</p>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(orderState.items || [])];
                                updated[orderState.activeItemIndex] = {
                                  ...updated[orderState.activeItemIndex],
                                  photo: null
                                };
                                saveState({
                                  ...orderState,
                                  items: updated
                                });
                                showToast("Foto removida. Envie outra imagem.");
                              }}
                              className="text-[10px] font-black text-red-600 hover:text-red-700 underline mt-2 block cursor-pointer transition"
                            >
                              Remover e Enviar Outra
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed border-line-border rounded-3xl p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] ${
                            dragActive ? "border-green-primary bg-green-primary/5" : "bg-soft-bg/30 hover:border-green-primary"
                          }`}
                        >
                          <input
                            id="photo-upload-input"
                            type="file"
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                          />
                          <div className="w-10 h-10 rounded-full bg-green-primary/5 flex items-center justify-center text-green-primary mb-3 shadow-inner">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="font-extrabold text-green-deep text-sm">Arraste ou clique abaixo para enviar</p>
                          <label
                            htmlFor="photo-upload-input"
                            className="mt-3 inline-flex items-center gap-1.5 bg-green-primary text-white px-4 py-2.5 rounded-full text-xs font-black shadow-md hover:bg-green-deep cursor-pointer transition"
                          >
                            Procurar arquivo de imagem
                          </label>
                          <p className="text-[9px] text-muted-text font-bold mt-3">SUPORTA: JPG, PNG OU WEBP</p>
                        </div>
                      )}

                      {/* Bloco Premium de Recomendações e Dicas de Foto */}
                      <div className="p-5 bg-gradient-to-br from-cream to-white border border-yellow-primary/20 rounded-2xl space-y-3.5 shadow-sm">
                        <span className="block text-xs font-black text-green-deep uppercase tracking-wider flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-green-primary" />
                          Dicas de Copa para a Foto Perfeita:
                        </span>
                        <ul className="space-y-2 text-xs font-semibold text-muted-text">
                          <li className="flex items-start gap-2">
                            <span className="text-green-primary mt-0.5">•</span>
                            <span><strong>Rosto Nítido:</strong> Escolha uma foto que mostre bem o rosto, de preferência de frente.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-primary mt-0.5">•</span>
                            <span><strong>Boa Iluminação:</strong> Evite fotos extremamente escuras, tremidas ou com sombras pesadas.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-primary mt-0.5">•</span>
                            <span><strong>Sem Acessórios:</strong> Evite óculos escuros de sol ou bonés que cubram totalmente o rosto.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* COLUNA DIREITA: FORMULÁRIO DE DADOS + ATRIBUTOS (7 colunas) */}
                    <form onSubmit={handleSavePersonalization} className="lg:col-span-7 space-y-6">
                      <span className="block text-xs font-black text-green-deep uppercase tracking-wider mb-4">
                        2. Dados Básicos do Craque
                      </span>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Nome do Jogador */}
                        <div>
                          <label htmlFor="cardName" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            Nome na figurinha (máx. 12 letras) *
                          </label>
                          <input
                            id="cardName"
                            type="text"
                            maxLength={12}
                            required
                            placeholder="Ex: MARTA ou SEU NOME"
                            value={currentItem.cardData.name || ""}
                            onChange={(e) => {
                              const updated = [...orderState.items];
                              if (updated[orderState.activeItemIndex]) {
                                updated[orderState.activeItemIndex] = {
                                  ...updated[orderState.activeItemIndex],
                                  cardData: { ...updated[orderState.activeItemIndex].cardData, name: e.target.value }
                                };
                              }
                              saveState({ ...orderState, items: updated });
                            }}
                            className="w-full min-h-[44px] border border-line-border rounded-xl px-4 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition"
                          />
                        </div>

                        {/* Data de Nascimento */}
                        <div>
                          <label htmlFor="birthDate" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            Data de Nascimento *
                          </label>
                          <input
                            id="birthDate"
                            type="date"
                            required
                            value={currentItem.cardData.birthDate || ""}
                            onChange={(e) => {
                              const updated = [...orderState.items];
                              if (updated[orderState.activeItemIndex]) {
                                updated[orderState.activeItemIndex] = {
                                  ...updated[orderState.activeItemIndex],
                                  cardData: { ...updated[orderState.activeItemIndex].cardData, birthDate: e.target.value }
                                };
                              }
                              saveState({ ...orderState, items: updated });
                            }}
                            className="w-full min-h-[44px] border border-line-border rounded-xl px-4 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition cursor-pointer"
                          />
                        </div>

                        {/* Cidade ou Time */}
                        <div>
                          <label htmlFor="city" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            Cidade ou Time *
                          </label>
                          <input
                            id="city"
                            type="text"
                            required
                            placeholder="Ex: São Paulo ou Flamengo FC"
                            value={currentItem.cardData.city || ""}
                            onChange={(e) => {
                              const updated = [...orderState.items];
                              if (updated[orderState.activeItemIndex]) {
                                updated[orderState.activeItemIndex] = {
                                  ...updated[orderState.activeItemIndex],
                                  cardData: { ...updated[orderState.activeItemIndex].cardData, city: e.target.value }
                                };
                              }
                              saveState({ ...orderState, items: updated });
                            }}
                            className="w-full min-h-[44px] border border-line-border rounded-xl px-4 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition"
                          />
                        </div>

                        {/* UF Dropdown */}
                        <div>
                          <label htmlFor="uf" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            Estado (UF) *
                          </label>
                          <select
                            id="uf"
                            required
                            value={currentItem.cardData.uf || ""}
                            onChange={(e) => {
                              const updated = [...orderState.items];
                              if (updated[orderState.activeItemIndex]) {
                                updated[orderState.activeItemIndex] = {
                                  ...updated[orderState.activeItemIndex],
                                  cardData: { ...updated[orderState.activeItemIndex].cardData, uf: e.target.value }
                                };
                              }
                              saveState({ ...orderState, items: updated });
                            }}
                            className="w-full min-h-[44px] border border-line-border rounded-xl px-4 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map((uf) => (
                              <option key={uf} value={uf}>{uf}</option>
                            ))}
                          </select>
                        </div>

                        {/* Altura */}
                        <div>
                          <label htmlFor="height" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            Altura (Ex: 1,77) *
                          </label>
                          <div className="relative">
                            <input
                              id="height"
                              type="text"
                              required
                              placeholder="Ex: 1,77"
                              value={currentItem.cardData.height || ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const cleaned = raw.replace(/m/gi, "").replace(/[^0-9,.]/g, "");
                                const updated = [...orderState.items];
                                if (updated[orderState.activeItemIndex]) {
                                  updated[orderState.activeItemIndex] = {
                                    ...updated[orderState.activeItemIndex],
                                    cardData: { ...updated[orderState.activeItemIndex].cardData, height: cleaned }
                                  };
                                }
                                saveState({ ...orderState, items: updated });
                              }}
                              className="w-full min-h-[44px] border border-line-border rounded-xl pl-4 pr-10 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition"
                            />
                            {currentItem.cardData.height && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-green-primary">
                                m
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Peso */}
                        <div>
                          <label htmlFor="weight" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            Peso (Ex: 66) *
                          </label>
                          <div className="relative">
                            <input
                              id="weight"
                              type="text"
                              required
                              placeholder="Ex: 66"
                              value={currentItem.cardData.weight || ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const cleaned = raw.replace(/kg/gi, "").replace(/[^0-9]/g, "");
                                const updated = [...orderState.items];
                                if (updated[orderState.activeItemIndex]) {
                                  updated[orderState.activeItemIndex] = {
                                    ...updated[orderState.activeItemIndex],
                                    cardData: { ...updated[orderState.activeItemIndex].cardData, weight: cleaned }
                                  };
                                }
                                saveState({ ...orderState, items: updated });
                              }}
                              className="w-full min-h-[44px] border border-line-border rounded-xl pl-4 pr-10 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition"
                            />
                            {currentItem.cardData.weight && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-green-primary">
                                kg
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botões do Formulário de Configuração */}
                      <div className="pt-6 border-t border-line-border/40 flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-2 bg-green-primary text-white px-6 py-3 rounded-full text-sm font-black hover:bg-green-deep transition hover:translate-y-[-1px] active:translate-y-0 cursor-pointer shadow-md"
                        >
                          {orderState.packageId && orderState.activeItemIndex < packageMap[orderState.packageId].quantity - 1 
                            ? "Salvar e ir para próxima figurinha" 
                            : "Confirmar personalização e continuar"
                          }
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBackStep("package")}
                          className="inline-flex items-center justify-center gap-2 border border-line-border text-green-primary bg-white px-5 py-3 rounded-full text-sm font-black hover:bg-soft-bg transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Voltar ao Pacote
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 3: DADOS DE ENTREGA */}
              {orderState.activeStep === "delivery" && (
                <motion.div
                  key="delivery-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="panel-inner p-6 md:p-8"
                >
                  <p className="mono panel-kicker text-xs font-bold text-green-primary">ETAPA 03 — DADOS DE ENTREGA DIGITAL</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-green-deep tracking-tight mt-3">
                    Onde devemos enviar suas figurinhas oficiais?
                  </h2>
                  <p className="text-muted-text mt-2 font-medium">
                    Suas figurinhas finais em alta fidelidade serão disponibilizadas no link do pedido. Você também pode acompanhar tudo na Minha Arquibancada e ativar alerta do navegador quando a arte ficar pronta.
                  </p>

                  <div className="mt-8 grid lg:grid-cols-12 gap-8 items-start">
                    {/* COLUNA ESQUERDA: Formulário de Contato */}
                    <form onSubmit={handleSaveDelivery} className="lg:col-span-7 space-y-6">
                      <div className="space-y-4">
                        {/* Nome do Comprador */}
                        <div>
                          <label htmlFor="buyerName" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            Seu Nome Completo
                          </label>
                          <input
                            id="buyerName"
                            type="text"
                            required
                            placeholder="Digite seu nome completo"
                            value={orderState.deliveryData.buyerName || ""}
                            onChange={(e) => {
                              saveState({
                                ...orderState,
                                intent: orderState.intent || "",
                                deliveryData: {
                                  ...orderState.deliveryData,
                                  buyerName: e.target.value
                                }
                              });
                            }}
                            className="w-full min-h-[44px] border border-line-border rounded-xl px-4 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition"
                          />
                        </div>

                        {/* Telefone opcional */}
                        <div className="hidden">
                          <label htmlFor="buyerPhone" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            Telefone opcional com DDD
                          </label>
                          <input
                            id="buyerPhone"
                            type="tel"
                            placeholder="Ex: (11) 99999-9999"
                            value={orderState.deliveryData.phone || ""}
                            onChange={(e) => {
                              saveState({
                                ...orderState,
                                intent: orderState.intent || "",
                                deliveryData: {
                                  ...orderState.deliveryData,
                                  phone: e.target.value
                                }
                              });
                            }}
                            className="w-full min-h-[44px] border border-line-border rounded-xl px-4 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition"
                          />
                        </div>

                        {/* E-mail de entrega */}
                        <div>
                          <label htmlFor="buyerEmail" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            E-mail de Notificação
                          </label>
                          <input
                            id="buyerEmail"
                            type="email"
                            required
                            placeholder="Ex: seuemail@dominio.com"
                            value={orderState.deliveryData.buyerEmail || ""}
                            onChange={(e) => {
                              saveState({
                                ...orderState,
                                intent: orderState.intent || "",
                                deliveryData: {
                                  ...orderState.deliveryData,
                                  buyerEmail: e.target.value
                                }
                              });
                            }}
                            className="w-full min-h-[44px] border border-line-border rounded-xl px-4 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition"
                          />
                        </div>

                        {/* Confirmar E-mail */}
                        <div className="hidden">
                          <label htmlFor="confirmEmail" className="block text-xs font-black text-green-deep uppercase tracking-wider mb-2">
                            Confirme seu E-mail
                          </label>
                          <input
                            id="confirmEmail"
                            type="email"
                            required
                            placeholder="Digite o mesmo e-mail novamente"
                            value={orderState.deliveryData.confirmEmail || ""}
                            onChange={(e) => {
                              saveState({
                                ...orderState,
                                intent: orderState.intent || "",
                                deliveryData: {
                                  ...orderState.deliveryData,
                                  confirmEmail: e.target.value
                                }
                              });
                            }}
                            className="w-full min-h-[44px] border border-line-border rounded-xl px-4 py-2.5 bg-soft-bg/20 text-green-deep font-bold focus:border-green-primary focus:bg-white outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Botões do Formulário */}
                      <div className="pt-6 border-t border-line-border/40 flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-2 bg-[#ffc526] hover:bg-white text-[#103c27] px-6 py-3 rounded-full text-sm font-black hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md"
                        >
                          Confirmar Informações e Continuar
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBackStep("photo")}
                          className="inline-flex items-center justify-center gap-2 border border-line-border text-green-primary bg-white px-5 py-3 rounded-full text-sm font-black hover:bg-soft-bg transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Voltar à Personalização
                        </button>
                      </div>
                    </form>

                    {/* COLUNA DIREITA: Resumo rápido do pacote / Segurança */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="p-6 bg-gradient-to-br from-cream to-white border border-yellow-primary/20 rounded-3xl space-y-4 shadow-sm">
                        <span className="block text-xs font-black text-green-deep uppercase tracking-wider">
                          Resumo do Pedido Atual
                        </span>
                        
                        <div className="space-y-3 divide-y divide-line-border/20 text-xs text-muted-text font-bold">
                          <div className="flex justify-between py-2 items-center">
                            <span>Pacote Selecionado:</span>
                            <span className="text-green-deep text-sm font-black">{packageInfo.name}</span>
                          </div>
                          <div className="flex justify-between py-2 items-center">
                            <span>Quantidade de figurinhas:</span>
                            <span className="text-green-deep text-sm font-black">{packageInfo.quantity} unidades</span>
                          </div>
                          <div className="flex justify-between py-2 items-center">
                            <span>Status da Customização:</span>
                            <span className="text-green-primary text-sm font-black">Figurinha(s) prontas</span>
                          </div>
                          <div className="flex justify-between py-2 pt-3 items-center">
                            <span className="text-green-deep font-extrabold">Valor do Pacote:</span>
                            <span className="text-green-primary text-lg font-black">{packageInfo.price}</span>
                          </div>
                        </div>
                      </div>

                      {/* Box de Segurança */}
                      <div className="p-5 border border-line-border/40 rounded-2xl bg-white space-y-3">
                        <span className="block text-xs font-black text-green-deep uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-green-primary" />
                          Segurança e Sigilo de Dados
                        </span>
                        <p className="text-[11px] font-semibold text-muted-text leading-relaxed">
                          Nossos sistemas operam sob conexão criptografada SSL segura. Suas imagens, contatos e informações financeiras estão totalmente resguardados conforme as diretrizes da LGPD brasileira.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ETAPA EXTRA: PAGAMENTO COM CARTÃO */}
              {orderState.activeStep === "card" && (
                <motion.div
                  key="card-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="panel-inner p-6 md:p-8"
                >
                  <h2 className="text-2xl font-black text-green-deep">Pagamento via Cartão</h2>
                  <MercadoPagoCard 
                    publicKey={import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || ""}
                    onPaymentSubmit={(token, paymentMethodId) => {
                       console.log("Token:", token, "Method:", paymentMethodId);
                    }}
                  />
                </motion.div>
              )}

              {/* ETAPA 6: RESUMO TÉCNICO */}
              {orderState.activeStep === "summary" && (
                <motion.div
                  key="summary-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="panel-inner p-6 md:p-8"
                >
                  <p className="mono panel-kicker text-xs font-bold text-green-primary">ETAPA 06 — SÚMULA DE JOGO</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-green-deep tracking-tight mt-3">
                    Tudo conferido e pronto para entrar em campo.
                  </h2>
                  <p className="text-muted-text mt-2 font-medium">
                    Abaixo está a súmula final do seu pedido. Após a confirmação, o Pix conectará seus dados com segurança.
                  </p>

                  <div className="mt-8 space-y-4 max-w-3xl">
                    <div className="p-6 bg-white border border-line-border/85 rounded-3xl divide-y divide-line-border/40">
                      <div className="flex items-center justify-between py-3.5 first:pt-0">
                        <span className="text-xs font-extrabold text-muted-text uppercase">Pacote do Torcedor</span>
                        <strong className="text-sm font-black text-green-deep">{packageInfo.name} ({packageInfo.quantity} un)</strong>
                      </div>
                      
                      {/* Grid de figurinhas criadas */}
                      <div className="py-3.5">
                        <span className="text-xs font-extrabold text-muted-text uppercase block mb-3">Figurinhas Customizadas:</span>
                        <div className="grid gap-2">
                          {(orderState.items || []).map((item, idx) => (
                            <div key={item.id} className="flex items-center justify-between bg-soft-bg/30 px-3.5 py-2 rounded-xl border border-line-border/40">
                              <span className="text-xs font-bold text-green-deep"># {idx + 1} . {item.cardData.name || "Sem Nome"}</span>
                              <span className="text-xs font-black text-green-primary">CRAQUE</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3.5">
                        <span className="text-xs font-extrabold text-muted-text uppercase">E-mail de Notificação</span>
                        <strong className="text-sm font-bold text-green-deep">{orderState.deliveryData.buyerEmail || "—"}</strong>
                      </div>
                      <div className="flex items-center justify-between py-3.5 last:pb-0">
                        <span className="text-xs font-extrabold text-muted-text uppercase">Preço Estimado</span>
                        <strong className="text-xl font-black text-green-primary">{packageInfo.price}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-line-border/40 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={isSubmittingOrder}
                      onClick={handleSubmitOrder}
                      className="inline-flex items-center justify-center gap-2 bg-[#ffc526] hover:bg-white text-[#103c27] px-6 py-3 rounded-full text-sm font-black hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isSubmittingOrder ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processando Pedido Seguro...
                        </>
                      ) : (
                        <>
                          Ir para Pagamento Seguro Mercado Pago
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBackStep("delivery")}
                      className="inline-flex items-center justify-center gap-2 border border-line-border text-green-primary bg-white px-5 py-3 rounded-full text-sm font-black hover:bg-soft-bg transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar à Entrega
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 7: PAGAMENTO INTEGRADO (CHECKOUT TRANSPARENTE VIA PIX) */}
              {orderState.activeStep === "pix" && (
                <motion.div
                  key="pix-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -25 }}
                  transition={{ duration: 0.3 }}
                  className="panel-inner p-6 md:p-8"
                >
                  <p className="mono panel-kicker text-xs font-bold text-green-primary">ETAPA 07 — PAGAMENTO NO PIX ATALHO</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-green-deep tracking-tight mt-3">
                    Checkout Transparente via Pix
                  </h2>
                  <p className="text-muted-text mt-2 font-medium">
                    Conclua seu faturamento de forma instantânea e segura dentro do nosso portal sem redirecionamentos.
                  </p>

                  <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* COLUNA ESQUERDA: Form (CPF) + QR Code (7 colunas) */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Cartão de CPF do Sacador/Comprador */}
                      <div className="p-5 bg-white border border-line-border/50 rounded-2xl shadow-sm">
                        <span className="text-[10px] font-black uppercase text-green-primary tracking-widest block mb-2">Segurança Cadastral (Banco Central)</span>
                        <label className="block text-xs font-extrabold text-green-deep uppercase mb-2">CPF do Pagador (Requisitado pela API Pix)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={buyerCpf}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, "");
                              if (val.length > 11) val = val.slice(0, 11);
                              // Aplicar máscara básica de CPF XX.XXX.XXX-XX
                              let masked = val;
                              if (val.length > 9) {
                                masked = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6, 9)}-${val.slice(9)}`;
                              } else if (val.length > 6) {
                                masked = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6)}`;
                              } else if (val.length > 3) {
                                masked = `${val.slice(0, 3)}.${val.slice(3)}`;
                              }
                              setBuyerCpf(masked);
                            }}
                            placeholder="000.000.000-00"
                            className="bg-soft-bg/80 border border-line-border/65 rounded-xl px-4 py-2.5 text-sm font-mono text-green-deep font-extrabold focus:ring-2 focus:ring-green-primary/50 focus:outline-none w-full"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              // Forçar regeneração do Pix limpando o anterior
                              setTransparentPixData(null);
                              showToast("Re-gerando Pix com o novo CPF...");
                            }}
                            className="bg-green-deep text-yellow-primary px-4 py-2.5 rounded-xl text-xs font-black shadow hover:bg-green-primary transition cursor-pointer shrink-0 uppercase tracking-wider"
                          >
                            Atualizar
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-text font-medium mt-2 leading-relaxed">
                          Para testes de homologação rápida, você pode manter o CPF fictício acima ou digitar o seu CPF para fins síncronos.
                        </p>
                      </div>

                      {/* Box Principal de Escaneamento do Pix */}
                      <div className="p-6 bg-gradient-to-br from-[#0c311c] to-[#041a0e] border border-yellow-primary/35 rounded-3xl text-white shadow-xl flex flex-col items-center text-center relative overflow-hidden">
                        
                        {/* Brilho de fundo decorativo */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-primary/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex items-center gap-2 bg-yellow-primary/10 border border-yellow-primary/20 px-3.5 py-1.5 rounded-full mb-5">
                          <BadgeCheck className="w-4 h-4 text-yellow-primary" />
                          <span className="text-[10px] font-black tracking-widest text-yellow-primary uppercase">PAGAMENTO INSTANTÂNEO SEGURO</span>
                        </div>

                        {/* RENDERIZADOR DE QR CODE TRANSPARENTE NAS CORES CORRETAS */}
                        {mpStatus === "loading" ? (
                          <div className="w-48 h-48 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 mb-5">
                            <Compass className="w-10 h-10 text-yellow-primary animate-spin-slow mb-3" />
                            <span className="text-xs font-bold text-white/80 animate-pulse">Gerando Pix síncrono...</span>
                          </div>
                        ) : mpStatus === "error" ? (
                          <div className="w-48 h-48 bg-red-950/20 border border-red-900/30 rounded-2xl flex flex-col items-center justify-center p-4 mb-5">
                            <ShieldAlert className="w-10 h-10 text-red-500 mb-2" />
                            <span className="text-xs font-bold text-red-200">Falha ao requisitar API</span>
                          </div>
                        ) : (
                          <div className="relative w-48 h-48 border-2 border-yellow-primary/45 rounded-2xl p-3 bg-white shadow-lg flex items-center justify-center mb-5 hover:scale-[1.02] transition-transform duration-300">
                            {transparentPixData?.qrCodeBase64 ? (
                              <img
                                src={`data:image/jpeg;base64,${transparentPixData.qrCodeBase64}`}
                                className="w-full h-full object-contain pointer-events-none"
                                alt="QR Code Pix Oficial"
                              />
                            ) : (
                              /* QR Code Customizado Estilizado nas Cores do Brasil */
                              <div className="w-full h-full">
                                <svg viewBox="0 0 100 100" className="w-full h-full text-[#024523]">
                                  <rect width="100" height="100" fill="transparent" />
                                  <rect x="5" y="5" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4.5" />
                                  <rect x="10" y="10" width="12" height="12" fill="#ffd900" />
                                  
                                  <rect x="73" y="5" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4.5" />
                                  <rect x="78" y="10" width="12" height="12" fill="#ffd900" />
                                  
                                  <rect x="5" y="73" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4.5" />
                                  <rect x="10" y="78" width="12" height="12" fill="#ffd900" />

                                  <rect x="38" y="8" width="6" height="6" fill="currentColor" />
                                  <rect x="52" y="12" width="10" height="4" fill="#ffd900" />
                                  <rect x="38" y="22" width="10" height="6" fill="currentColor" />
                                  <rect x="42" y="38" width="16" height="16" fill="#ffd900" />
                                  <rect x="12" y="42" width="8" height="10" fill="currentColor" />
                                  <rect x="78" y="42" width="10" height="10" fill="currentColor" />
                                  <rect x="73" y="73" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4.5" />
                                  <rect x="78" y="78" width="12" height="12" fill="#ffd900" />

                                  {/* Logotipo Pix do Banco Central Centralizado */}
                                  <g transform="translate(35, 35) scale(0.6)">
                                    <rect width="50" height="50" rx="12" fill="#024523" />
                                    <path d="M25 8 L42 25 L25 42 L8 25 Z" fill="#00c053" />
                                    <circle cx="25" cy="25" r="5" fill="#ffd900" stroke="#024523" strokeWidth="1.5" />
                                  </g>
                                </svg>
                              </div>
                            )}
                          </div>
                        )}

                        <span className="text-xs font-black text-yellow-primary uppercase tracking-widest leading-none mb-1">Pix Copia e Cola</span>
                        <p className="text-[10px] text-white/60 mb-3.5">Copie o código completo abaixo no aplicativo do seu banco para pagar.</p>
                        
                        <div className="flex gap-2 w-full max-w-md bg-black/45 border border-white/10 rounded-xl p-1.5 pl-3">
                          <input
                            type="text"
                            readOnly
                            value={transparentPixData?.qrCode || ""}
                            className="bg-transparent border-none text-xs font-mono text-yellow-primary/95 font-extrabold focus:outline-none flex-1 truncate select-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (transparentPixData?.qrCode) {
                                navigator.clipboard.writeText(transparentPixData.qrCode);
                                setPixCopiado(true);
                                showToast("Código Pix Copiado com sucesso!");
                                setTimeout(() => setPixCopiado(false), 2000);
                              }
                            }}
                            className="bg-yellow-primary text-green-deep hover:bg-white px-4 py-2 rounded-lg text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer shrink-0 uppercase tracking-wider"
                          >
                            {pixCopiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {pixCopiado ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* COLUNA DIREITA: Valores + Passo a Passo de Integração (5 colunas) */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* Box de Resumo e Valor */}
                      <div className="p-5 bg-white border border-line-border/60 rounded-3xl divide-y divide-line-border/15">
                        <h4 className="text-sm font-black text-green-deep uppercase tracking-wider mb-3">Resumo da Compra</h4>
                        <div className="flex justify-between items-center py-2.5">
                          <span className="text-xs font-extrabold text-muted-text uppercase">Pacote</span>
                          <strong className="text-xs font-black text-green-deep">{packageInfo.name}</strong>
                        </div>
                        <div className="flex justify-between items-center py-2.5">
                          <span className="text-xs font-extrabold text-muted-text uppercase">Comprador</span>
                          <strong className="text-xs font-bold text-green-deep truncate max-w-[150px]">{orderState.deliveryData.buyerName}</strong>
                        </div>
                        <div className="flex justify-between items-center pt-3">
                          <span className="text-xs font-extrabold text-green-deep uppercase">VALOR INTEGRADO</span>
                          <strong className="text-xl font-black text-green-primary">{packageInfo.price}</strong>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Banners Finais e Botões de Etapa */}
                  <div className="mt-10 pt-6 border-t border-line-border/40 flex flex-wrap gap-3.5 items-center justify-between">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={isVerifyingPayment}
                        onClick={handleConfirmPix}
                        className={`inline-flex items-center justify-center gap-2 bg-green-primary text-white px-7 py-3.5 rounded-full text-sm font-black hover:bg-green-deep transition hover:translate-y-[-1px] active:translate-y-0 cursor-pointer shadow-md ${
                          isVerifyingPayment ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                      >
                        {isVerifyingPayment ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Verificando Banco...</span>
                          </>
                        ) : (
                          <>
                            <span>{mpStatus === "success" ? "Confirmar Pagamento e Prosseguir" : "Confirmar Pix e Avançar"}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBackStep("summary")}
                        className="inline-flex items-center justify-center gap-2 border border-line-border text-green-primary bg-white px-5 py-3 rounded-full text-sm font-black hover:bg-soft-bg transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao Resumo
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-primary" />
                      <span className="text-[10px] text-muted-text font-black uppercase tracking-widest">GATEWAY OFICIAL INTEGRADO</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 8: REVISÃO DE PRODUÇÃO */}
              {orderState.activeStep === "review" && (
                <motion.div
                  key="review-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="panel-inner p-6 md:p-8"
                >
                  <p className="mono panel-kicker text-xs font-bold text-green-primary">ETAPA 08 — ANÁLISE INTEGRAL</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-green-deep tracking-tight mt-3">
                    Última verificação dos dados fiscais de fabricação.
                  </h2>
                  <p className="text-muted-text mt-2 font-medium">
                    Antes de encaminharmos sua figurinha para a esteira oficial dos nossos designers gráficos, faça a leitura atenciosa dos dados.
                  </p>

                  <div className="mt-8 space-y-4 max-w-3xl">
                    <div className="p-6 bg-white border border-line-border rounded-3xl divide-y divide-line-border/40">
                      <div className="flex justify-between items-center py-3 first:pt-0">
                        <span className="text-xs font-extrabold text-muted-text">Pacote Contratado</span>
                        <strong className="text-sm font-black text-green-deep">{packageInfo.name} ({packageInfo.quantity} un)</strong>
                      </div>
                      <div className="flex flex-col py-3 gap-2">
                        <span className="text-xs font-extrabold text-muted-text">Figurinha(s) Customizada(s)</span>
                        <div className="space-y-2 mt-1">
                          {(orderState.items || []).map((item, idx) => (
                            <div key={item.id} className="flex justify-between items-center bg-soft-bg/50 p-3 rounded-xl border border-line-border/35">
                              <span className="text-xs font-bold text-green-primary">#{(idx + 1).toString().padStart(2, "0")} — {item.cardData.name || "Sem Nome"}</span>
                              <span className="text-xs font-extrabold text-green-deep font-mono bg-yellow-primary/10 text-yellow-600 px-2.5 py-1 rounded-md border border-yellow-primary/20">
                                CRAQUE
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-xs font-extrabold text-muted-text">Destinatário do Pedido</span>
                        <strong className="text-sm font-black text-green-deep uppercase">{orderState.deliveryData.buyerName}</strong>
                      </div>
                      <div className="flex justify-between items-center py-3 last:pb-0">
                        <span className="text-xs font-extrabold text-muted-text">Meio de Notificação</span>
                        <strong className="text-sm font-bold text-green-deep">{orderState.deliveryData.buyerEmail}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-line-border/40 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSendToProduction}
                      className="inline-flex items-center justify-center gap-2 bg-green-primary text-white px-7 py-3.5 rounded-full text-base font-black hover:bg-green-deep hover:scale-103 transition-all duration-200 cursor-pointer shadow-lg"
                    >
                      Enviar para linha de produção
                      <Sparkles className="w-5 h-5 text-yellow-primary" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBackStep("pix")}
                      className="inline-flex items-center justify-center gap-2 border border-line-border text-green-primary bg-white px-5 py-3 rounded-full text-sm font-black hover:bg-soft-bg transition-all cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar ao Pix
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ETAPA 9: ESTEIRA DE PRODUÇÃO REAL-TIME */}
              {orderState.activeStep === "production" && (
                <motion.div
                  key="production-panel"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="panel-inner p-6 md:p-8"
                >
                  <Logo size={56} className="shadow-md hover:scale-105 transition-transform duration-300" />
                  <p className="mono panel-kicker text-xs font-bold text-green-primary mt-6">ACOMPANHAMENTO DO PEDIDO</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-green-deep tracking-tight mt-3">
                    Pedido recebido com sucesso!
                  </h2>
                  <p className="text-muted-text mt-2 font-medium">
                    Seu cromo entrou na nossa esteira oficial de design técnico. Acompanhe abaixo o progresso de tratamento.
                  </p>

                  {/* Barra de Progresso Realista */}
                  <div className="mt-8 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-green-deep tracking-wider uppercase">Esteira de Produção</span>
                      <span className="font-mono text-sm font-black text-green-primary">{productionPercent}%</span>
                    </div>
                    <div className="w-full h-3 bg-soft-bg rounded-full overflow-hidden border border-line-border/30">
                      <div
                        className="h-full bg-gradient-to-r from-green-primary to-green-deep transition-all duration-300"
                        style={{ width: `${productionPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Fluxograma de Status */}
                  <div className="space-y-4 mt-8">
                    {/* Status 1 */}
                    <div className="status-row flex gap-4 done text-green-primary">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all bg-green-primary text-white">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm leading-none text-green-deep">1. Pedido Recebido</p>
                        <p className="text-xs text-muted-text font-semibold mt-1">Sua transação foi aprovada e integrada com sucesso nos nossos servidores.</p>
                      </div>
                    </div>

                    {/* Status 2 */}
                    <div className={`status-row flex gap-4 ${productionPercent >= 25 ? "done text-green-primary" : "text-white/50 animate-pulse"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all ${
                        productionPercent >= 25 ? "bg-green-primary text-white" : "bg-yellow-primary text-green-deep border border-yellow-primary"
                      }`}>
                        {productionPercent >= 25 ? <Check className="w-4 h-4" /> : "2"}
                      </div>
                      <div>
                        <p className={`font-extrabold text-sm leading-none ${productionPercent >= 25 ? "text-green-deep" : "text-[#8b998f]"}`}>
                          2. Atributos Técnicos Conferidos
                        </p>
                        <p className="text-xs text-muted-text font-semibold mt-1">Conferência dos atributos táticos escolhidos e checagem de dimensões da foto.</p>
                      </div>
                    </div>

                    {/* Status 3 */}
                    <div className={`status-row flex gap-4 ${productionPercent >= 55 ? "done text-green-primary" : "text-white/50"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all ${
                        productionPercent >= 55 ? "bg-green-primary text-white" : "bg-yellow-primary text-green-deep"
                      }`}>
                        {productionPercent >= 55 ? <Check className="w-4 h-4" /> : "3"}
                      </div>
                      <div>
                        <p className={`font-extrabold text-sm leading-none ${productionPercent >= 55 ? "text-green-deep" : "text-[#8b998f]"}`}>
                          3. Arte Visual e Recorte Digital
                        </p>
                        <p className="text-xs text-muted-text font-semibold mt-1">Nossos designers gráficos iniciam o recorte profissional do fundo com refinamento.</p>
                      </div>
                    </div>

                    {/* Status 4 */}
                    <div className={`status-row flex gap-4 ${productionPercent >= 85 ? "done text-green-primary" : "text-white/50"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all ${
                        productionPercent >= 85 ? "bg-green-primary text-white" : "bg-yellow-primary text-green-deep"
                      }`}>
                        {productionPercent >= 85 ? <Check className="w-4 h-4" /> : "4"}
                      </div>
                      <div>
                        <p className={`font-extrabold text-sm leading-none ${productionPercent >= 85 ? "text-green-deep" : "text-[#8b998f]"}`}>
                          4. Acabamento Gold Premium
                        </p>
                        <p className="text-xs text-muted-text font-semibold mt-1">Aplicação dos filtros profissionais e renderização final do mockup com brilho.</p>
                      </div>
                    </div>

                    {/* Status 5 */}
                    <div className={`status-row flex gap-4 ${productionPercent >= 92 ? "text-yellow-600 font-bold animate-pulse" : "text-white/50"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-all ${
                        productionPercent >= 92 ? "bg-yellow-primary text-green-deep border border-yellow-primary" : "bg-soft-bg text-[#819087]"
                      }`}>
                        {productionPercent >= 92 ? <Compass className="w-4 h-4 animate-spin-slow" /> : "5"}
                      </div>
                      <div>
                        <p className={`font-extrabold text-sm leading-none ${productionPercent >= 92 ? "text-green-deep" : "text-[#8b998f]"}`}>
                          5. Em processamento — em breve você receberá seu arquivo por e-mail
                        </p>
                        <p className="text-xs text-muted-text font-semibold mt-1">
                          Seu cromo dourado está sendo revisado e finalizado pelo designer. Fique atento à sua caixa de entrada!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quadro Informativo de Finalização de Compra */}
                  <div className="mt-8 p-6 bg-gradient-to-tr from-green-deep to-green-primary border border-yellow-primary/30 rounded-3xl text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-yellow-primary">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-yellow-primary tracking-wider leading-none">CANAL DE ENVIO OFICIAL</p>
                        <p className="text-sm font-black mt-1 leading-tight">Entrega Garantida</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/80 mt-3 font-semibold leading-relaxed">
                      Nossos profissionais especializados estão tratando e removendo de forma cirúrgica o fundo das fotos carregadas. Suas artes em ultra-definição de Copa serão enviadas para o endereço cadastrado:
                    </p>
                    <div className="bg-black/35 px-4 py-3 rounded-xl border border-white/10 mt-3 text-center">
                      <code className="text-yellow-primary font-mono text-sm font-black whitespace-nowrap overflow-hidden text-ellipsis block">
                        {orderState.deliveryData.buyerEmail || "seuemail@exemplo.com"}
                      </code>
                    </div>
                  </div>

                  {/* Botões Finais de Navegação para o Usuário Final */}
                  <div className="mt-10 pt-6 border-t border-line-border/40 flex flex-wrap gap-4 items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        // Limpar o progresso salvo para permitir um novo pedido
                        localStorage.removeItem("fancardProgressData");
                        onBackHome();
                      }}
                      className="inline-flex items-center justify-center gap-2.5 bg-yellow-primary text-green-deep px-8 py-4 rounded-full font-black text-sm md:text-base hover:bg-white tracking-wide cursor-pointer shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                      <span>Voltar ao Site / Iniciar Novo Pedido</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-xs text-muted-text font-black uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-primary" />
                      FanCard Brasil • Transação Segura
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Flutuador Toast para alertas robustos e feedbacks de copa */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`fixed bottom-6 right-6 z-55 max-w-sm bg-green-deep border border-yellow-primary text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3.5`}
            style={{ width: "calc(100% - 48px)", maxWidth: "340px" }}
          >
            <Logo size={32} className="shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="text-xs font-black tracking-wider uppercase text-yellow-primary leading-none">Notificação do Copa</p>
              <p className="text-xs text-white/90 mt-1 font-semibold leading-relaxed">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
