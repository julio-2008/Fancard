import fs from "fs";
import os from "os";
import path from "path";
import { BlobNotFoundError, get, put } from "@vercel/blob";

const LOCAL_STORAGE_ROOT = process.env.VERCEL
  ? path.join(os.tmpdir(), "fancard")
  : process.cwd();
const DATA_DIR = path.join(LOCAL_STORAGE_ROOT, "storage");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const UPLOADS_DIR = path.join(LOCAL_STORAGE_ROOT, "uploads");
const ORIGINAL_UPLOADS_DIR = path.join(UPLOADS_DIR, "original");
const FINAL_UPLOADS_DIR = path.join(UPLOADS_DIR, "final");
const ORDERS_BLOB_PATH = "fancard/database/orders.json";

const shouldUseBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export const getUploadsDir = () => UPLOADS_DIR;

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

async function streamToText(stream: ReadableStream<Uint8Array>) {
  const response = new Response(stream);
  return response.text();
}

function contentTypeFromFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

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
    team?: string;
    country?: string;
    position?: string;
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
    phone?: string;
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

const rewritePrivateBlobUrl = (url: string) => {
  if (!url) return url;
  if (url.includes("vercel-storage.com") && !url.includes("/api/blob-proxy")) {
    return `/api/blob-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export async function loadOrders(): Promise<Order[]> {
  const mapOrdersToProxy = (orders: Order[]) => {
    return orders.map((order) => ({
      ...order,
      items: (order.items || []).map((item) => ({
        ...item,
        photoUrl: rewritePrivateBlobUrl(item.photoUrl),
      })),
      production: {
        ...order.production,
        finalFiles: (order.production?.finalFiles || []).map((file) => ({
          ...file,
          url: rewritePrivateBlobUrl(file.url),
        })),
      },
    }));
  };

  if (shouldUseBlob()) {
    try {
      const result = await get(ORDERS_BLOB_PATH, { access: "private", useCache: false });
      if (result.statusCode !== 200 || !result.stream) return [];
      const text = await streamToText(result.stream);
      const orders = JSON.parse(text || "[]");
      return mapOrdersToProxy(orders);
    } catch (err) {
      if (err instanceof BlobNotFoundError) return [];
      console.error("Error reading orders from Vercel Blob:", err);
      return [];
    }
  }

  try {
    ensureDirs();
    const data = fs.readFileSync(ORDERS_FILE, "utf-8");
    const orders = JSON.parse(data);
    return mapOrdersToProxy(orders);
  } catch (err) {
    console.error("Error reading local orders:", err);
    return [];
  }
}

export async function saveOrders(orders: Order[]): Promise<void> {
  if (shouldUseBlob()) {
    try {
      await put(ORDERS_BLOB_PATH, JSON.stringify(orders, null, 2), {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json",
      });
      return;
    } catch (err) {
      console.error("Error writing orders to Vercel Blob:", err);
      throw err;
    }
  }

  try {
    ensureDirs();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local orders:", err);
    throw err;
  }
}

export async function saveBase64Image(
  base64Data: string,
  type: "original" | "final",
  fileName: string
): Promise<string> {
  const base64Prefix = /^data:image\/[a-zA-Z+.-]+;base64,/;
  const cleanBase64 = base64Data.replace(base64Prefix, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  const safeFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeFileName}`;

  if (shouldUseBlob()) {
    const blob = await put(`fancard/uploads/${type}/${uniqueName}`, buffer, {
      access: "private",
      contentType: contentTypeFromFileName(safeFileName),
      addRandomSuffix: false,
    });
    return `/api/blob-proxy?url=${encodeURIComponent(blob.url)}`;
  }

  if (process.env.VERCEL) {
    const contentType = contentTypeFromFileName(safeFileName);
    return `data:${contentType};base64,${cleanBase64}`;
  }

  ensureDirs();
  const targetDir = type === "original" ? ORIGINAL_UPLOADS_DIR : FINAL_UPLOADS_DIR;
  const filePath = path.join(targetDir, uniqueName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${type}/${uniqueName}`;
}
