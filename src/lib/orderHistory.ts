export interface StoredOrderHistoryItem {
  orderId: string;
  accessToken: string;
  checkoutUrl?: string;
  packageName?: string;
  packageId?: string;
  quantity?: number;
  price?: number;
  buyerName?: string;
  buyerEmail?: string;
  createdAt: string;
  updatedAt?: string;
}

const HISTORY_KEY = "fancardOrderHistory";
const LAST_ORDER_KEY = "fancardLastOrder";

export function readOrderHistory(): StoredOrderHistoryItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.orderId && item?.accessToken) : [];
  } catch {
    return [];
  }
}

export function readLastOrder(): StoredOrderHistoryItem | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAST_ORDER_KEY) || "null");
    return parsed?.orderId && parsed?.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

export function saveOrderHistoryItem(item: StoredOrderHistoryItem) {
  const current = readOrderHistory();
  const nextItem = {
    ...item,
    updatedAt: new Date().toISOString(),
  };
  const merged = [nextItem, ...current.filter((saved) => saved.orderId !== item.orderId)].slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
  localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(nextItem));
  return merged;
}
