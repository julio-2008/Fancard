import React, { useEffect } from "react";
import { loadMercadoPagoSDK } from "../lib/mercadoPago";

interface MercadoPagoCardProps {
  publicKey: string;
  onPaymentSubmit: (token: string, paymentMethodId: string) => void;
}

export const MercadoPagoCard: React.FC<MercadoPagoCardProps> = ({ publicKey, onPaymentSubmit }) => {
  useEffect(() => {
    const initMP = async () => {
      const mp = await loadMercadoPagoSDK(publicKey);
      
      const cardForm = mp.cardForm({
        amount: "14.90", // Example amount
        autoMount: true,
        form: {
          id: "form-checkout",
          cardholderName: { id: "form-checkout__cardholderName", placeholder: "Titular do cartão" },
          cardNumber: { id: "form-checkout__cardNumber", placeholder: "Número do cartão" },
          cardExpirationMonth: { id: "form-checkout__cardExpirationMonth", placeholder: "Mês de vencimento" },
          cardExpirationYear: { id: "form-checkout__cardExpirationYear", placeholder: "Ano de vencimento" },
          securityCode: { id: "form-checkout__securityCode", placeholder: "Código de segurança" },
          installments: { id: "form-checkout__installments", placeholder: "Parcelas" },
        },
        callbacks: {
          onFormMounted: (error: any) => {
            if (error) console.warn("Form mounted with error:", error);
          },
          onSubmit: (event: any) => {
            event.preventDefault();
            const { paymentMethodId, token } = cardForm.getCardFormData();
            onPaymentSubmit(token, paymentMethodId);
          },
        },
      });
    };
    initMP();
  }, [publicKey, onPaymentSubmit]);

  return (
    <form id="form-checkout" className="space-y-4 p-4 border rounded-xl bg-white shadow-sm">
       <div id="form-checkout__cardholderName" className="w-full" />
       <div id="form-checkout__cardNumber" className="w-full" />
       <div className="flex gap-4">
         <div id="form-checkout__cardExpirationMonth" className="w-full" />
         <div id="form-checkout__cardExpirationYear" className="w-full" />
       </div>
       <div id="form-checkout__securityCode" className="w-full" />
       <div id="form-checkout__installments" className="w-full" />
       <button type="submit" id="form-checkout__submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">
         Pagar Agora
       </button>
    </form>
  );
};
