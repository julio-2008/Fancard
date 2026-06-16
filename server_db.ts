import fs from "fs";
import path from "path";

// Define storage paths
// WARNING: Local filesystem on Cloud Run is ephemeral.
// TODO: Replace with permanent storage (Google Cloud Firestore + Google Cloud Storage Bucket) in production.
const DATA_DIR = path.join(process.cwd(), "storage");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const ORIGINAL_UPLOADS_DIR = path.join(UPLOADS_DIR, "original");
const FINAL_UPLOADS_DIR = path.join(UPLOADS_DIR, "final");

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORIGINAL_UPLOADS_DIR)) {
    fs.mkdirSync(ORIGINAL_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(FINAL_UPLOADS_DIR)) {
    fs.mkdirSync(FINAL_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

// Interfaces
export interface FanCardItem {
  id: string;
  index: number;
  photoUrl: string;
  originalPhotoName?: string;
  cardData: {
    name: string;
    birthDate?: string;
    city: string;
    uf?: string;
    height?: string;
    weight?: string;
  };
  generatedPrompt: string;
}

export interface FinalFile {
  id: string;
  itemId: string;
  url: string;
  fileName: string;
  uploadedAt: string;
}

export interface Order {
  id: string;
  accessToken: string;
  createdAt: string;
  updatedAt: string;
  packageId: "individual" | "trio" | "familia";
  packageName: string;
  quantity: number;
  price: number;
  buyer: {
    name: string;
    email: string;
  };
  items: FanCardItem[];
  payment: {
    provider: "mercadopago";
    preferenceId?: string;
    paymentId?: string;
    status: "not_started" | "pending" | "approved" | "rejected" | "cancelled" | "refunded";
    checkoutUrl?: string;
    externalReference: string;
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

// Setup directories
ensureDirs();

// Read all orders
export function loadOrders(): Order[] {
  try {
    ensureDirs();
    const data = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading orders:", err);
    return [];
  }
}

// Write orders to file
export function saveOrders(orders: Order[]): void {
  try {
    ensureDirs();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing orders:", err);
  }
}

// Help save images from Base64 data
export function saveBase64Image(
  base64Data: string,
  type: "original" | "final",
  fileName: string
): string {
  ensureDirs();
  // Strip standard mime-type header if present
  const base64Prefix = /^data:image\/[a-zA-Z+.-]+;base64,/;
  const cleanBase64 = base64Data.replace(base64Prefix, "");
  const buffer = Buffer.from(cleanBase64, "base64");

  const targetDir = type === "original" ? ORIGINAL_UPLOADS_DIR : FINAL_UPLOADS_DIR;
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${fileName}`;
  const filePath = path.join(targetDir, uniqueName);

  fs.writeFileSync(filePath, buffer);

  // Return the web-accessible static serving URL
  return `/uploads/${type}/${uniqueName}`;
}
