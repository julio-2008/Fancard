import { loadMercadoPago } from "@mercadopago/sdk-js";

let mpInstance: any = null;

export const loadMercadoPagoSDK = async (publicKey: string) => {
  if (mpInstance) return mpInstance;
  
  await loadMercadoPago();
  mpInstance = new (window as any).MercadoPago(publicKey, {
    locale: "pt-BR",
  });
  return mpInstance;
};
