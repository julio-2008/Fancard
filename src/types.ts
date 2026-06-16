export type PackageId = "individual" | "trio" | "familia";

export interface PackageDetail {
  id: PackageId;
  name: string;
  quantity: number;
  price: string;
  priceValue: number;
  description: string;
  badge?: string;
  theme: "green" | "gold" | "blue";
}

export interface CardData {
  name: string;
  birthDate: string;
  city: string; // Representa "Cidade ou Time"
  uf: string;
  height: string;
  weight: string;
  team?: string;
  country?: string;
  position?: string; // Incluído conforme necessidade
}

export interface DeliveryData {
  buyerName: string;
  buyerEmail: string;
  confirmEmail: string;
  phone?: string;
}

export type OrderStep =
  | "package"
  | "photo"
  | "delivery"
  | "summary"
  | "card"
  | "pix"
  | "review"
  | "production";

export interface FanCardItem {
  id: string;
  photo: string | null;
  cardData: CardData;
}

export interface OrderState {
  packageId: PackageId | null;
  items: FanCardItem[];
  deliveryData: DeliveryData;
  activeStep: OrderStep;
  activeItemIndex: number;
  completedSteps: OrderStep[];
  paymentStatus: "not_started" | "awaiting_payment" | "paid" | "production" | "ready";
}

