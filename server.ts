import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import {
  loadOrders,
  saveOrders,
  saveBase64Image,
  getUploadsDir,
  Order,
  FanCardItem,
  FinalFile,
} from "./server_db.js";
import { buildFanCardPrompt } from "./src/lib/promptBuilder.js";

dotenv.config();

type CreateAppOptions = {
  serveClient?: boolean;
};

export async function createApp(options: CreateAppOptions = {}) {
  const serveClient = options.serveClient ?? process.env.NODE_ENV === "production";
  const app = express();

  // Increase payload limit for Base64 image uploads during purchase
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Static serving of uploaded customer files and final FanCards
  app.use("/uploads", express.static(getUploadsDir()));

  // Static assets
  app.use("/assets", express.static(path.join(process.cwd(), "public/assets")));

  // Admin Sessions Store (In-Memory)
  interface AdminSession {
    token: string;
    expiresAt: number;
  }
  const adminSessions = new Map<string, AdminSession>();
  const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

  const base64UrlEncode = (value: string) => Buffer.from(value).toString("base64url");

  const getAdminSessionSecret = () => {
    return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "fancard_local_session_secret";
  };

  const signAdminPayload = (payload: string) => {
    return crypto.createHmac("sha256", getAdminSessionSecret()).update(payload).digest("base64url");
  };

  const createAdminToken = () => {
    const payload = base64UrlEncode(JSON.stringify({
      exp: Date.now() + SESSION_DURATION_MS,
      nonce: crypto.randomBytes(12).toString("hex"),
    }));
    return `adm_${payload}.${signAdminPayload(payload)}`;
  };

  const verifyAdminSessionToken = (token: string) => {
    if (!token.startsWith("adm_")) return false;
    const [payload, signature] = token.slice(4).split(".");
    if (!payload || !signature) return false;

    const expectedSignature = signAdminPayload(payload);
    const received = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
      return false;
    }

    try {
      const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
      return typeof decoded.exp === "number" && Date.now() <= decoded.exp;
    } catch {
      return false;
    }
  };

  // Helper middleware for Admin Authentication
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Acesso negado. Token de sessão ausente." });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const session = adminSessions.get(token);
    if (!session && verifyAdminSessionToken(token)) {
      return next();
    }

    if (!session) {
      return res.status(401).json({ error: "Sessão inválida ou expirada." });
    }

    if (Date.now() > session.expiresAt) {
      adminSessions.delete(token);
      return res.status(401).json({ error: "Sessão expirada. Faça login novamente." });
    }

    // Refresh expiration on activity
    session.expiresAt = Date.now() + SESSION_DURATION_MS;
    next();
  };

  // Official structural pricing definition
  const PRICES: Record<string, number> = {
    individual: 14.90,
    trio: 26.97,
    familia: 35.97,
  };

  const PACK_NAMES: Record<string, string> = {
    individual: "Individual (1 Figurinha)",
    trio: "Trio Seleção (3 Figurinhas)",
    familia: "Família / Amigos (5 Figurinhas)",
  };



  // ==================== ADMINISTRATIVE LOGIN API ====================

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "fancard123";

    if (password !== adminPassword) {
      return res.status(401).json({ error: "Senha administrativa incorreta." });
    }

    const token = createAdminToken();
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    adminSessions.set(token, { token, expiresAt });

    return res.json({
      status: "success",
      token,
      expiresIn: SESSION_DURATION_MS,
    });
  });

  app.post("/api/admin/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "").trim();
      adminSessions.delete(token);
    }
    return res.json({ status: "success" });
  });

  // Verify currently logged in admin state
  app.get("/api/admin/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.json({ authenticated: false });
    const token = authHeader.replace("Bearer ", "").trim();
    const session = adminSessions.get(token);
    if (!session && verifyAdminSessionToken(token)) {
      return res.json({ authenticated: true });
    }
    if (!session || Date.now() > session.expiresAt) {
      return res.json({ authenticated: false });
    }
    return res.json({ authenticated: true });
  });

  // ==================== ORDER CREATION WITH MERCADO PAGO PREFERENCE ====================

  // POST /api/orders/create
  app.post("/api/orders/create", async (req, res) => {
    try {
      const { packageId, buyer, items } = req.body;

      if (!packageId || !buyer || !buyer.name || !buyer.email || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Dados incompletos para criação do pedido." });
      }

      // 1. Recalcular e validar preço no backend
      const price = PRICES[packageId];
      if (!price) {
        return res.status(400).json({ error: "Pacote inválido ou preço não cadastrado." });
      }

      const expectedCount = packageId === "individual" ? 1 : packageId === "trio" ? 3 : 5;
      if (items.length !== expectedCount) {
        return res.status(400).json({
          error: `Divergência de pacotes: esperado ${expectedCount} figurinhas, recebido ${items.length}.`,
        });
      }

      // 2. Criar chaves únicas de segurança para consulta pública
      const orderId = "FC" + Math.floor(100000 + Math.random() * 900000);
      const accessToken = "tok_" + Math.random().toString(36).substring(2, 15);

      // 3. Processar e decodificar Base64 de cada foto, salvando localmente e validando campos obrigatórios
      const processedItems: FanCardItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.photo) {
          return res.status(400).json({ error: `Falta enviar a foto da FanCard ${i + 1}.` });
        }
        if (!item.cardData.name || !item.cardData.name.trim()) {
          return res.status(400).json({ error: `Falta preencher o nome da FanCard ${i + 1}.` });
        }
        if (!item.cardData.birthDate || !item.cardData.birthDate.trim()) {
          return res.status(400).json({ error: `Falta preencher a data de nascimento da FanCard ${i + 1}.` });
        }
        if (!item.cardData.city || !item.cardData.city.trim()) {
          return res.status(400).json({ error: `Falta preencher a cidade da FanCard ${i + 1}.` });
        }
        if (!item.cardData.uf || !item.cardData.uf.trim()) {
          return res.status(400).json({ error: `Selecione a UF da FanCard ${i + 1}.` });
        }
        if (!item.cardData.height || !item.cardData.height.trim()) {
          return res.status(400).json({ error: `Falta preencher a altura da FanCard ${i + 1}.` });
        }
        if (!item.cardData.weight || !item.cardData.weight.trim()) {
          return res.status(400).json({ error: `Falta preencher o peso da FanCard ${i + 1}.` });
        }

        // Save native image file to uploads storage and get static link
        const fileName = `item_${i + 1}.png`;
        const photoUrl = await saveBase64Image(item.photo, "original", fileName);

        // Generate custom instruction prompt
        const promptText = buildFanCardPrompt(item.cardData);

        processedItems.push({
          id: item.id || `item_${Date.now()}_${i}`,
          index: i + 1,
          photoUrl,
          originalPhotoName: item.originalPhotoName || `foto_${i + 1}.png`,
          cardData: {
            name: item.cardData.name,
            birthDate: item.cardData.birthDate,
            city: item.cardData.city,
            uf: item.cardData.uf,
            height: item.cardData.height,
            weight: item.cardData.weight,
          },
          generatedPrompt: promptText,
        });
      }

      // Assemble new database order object
      const newOrder: Order = {
        id: orderId,
        accessToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        packageId,
        packageName: PACK_NAMES[packageId],
        quantity: expectedCount,
        price,
        buyer: {
          name: buyer.name,
          email: buyer.email,
        },
        items: processedItems,
        payment: {
          provider: "mercadopago",
          status: "not_started",
          externalReference: orderId,
        },
        production: {
          status: "waiting_payment",
          finalFiles: [],
        },
      };

      // 4. Mercado Pago Preference Creation Setup
      const accessTokenMP = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
      const hostUrl = process.env.APP_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

      // Validação de configuração obrigatória
      if (!accessTokenMP || !hostUrl || accessTokenMP === "SEU_ACCESS_TOKEN_AQUI" || accessTokenMP.trim() === "") {
        console.error(`[Mercado Pago] Configuração incompleta: ACCESS_TOKEN ou APP_BASE_URL ausentes.`);
        return res.status(500).json({ error: "Serviço de pagamento indisponível. Verifique as configurações do servidor." });
      }

      // Sanitize host url to avoid hash fragments, query params or trailing slash
      let cleanHostUrl = hostUrl.split("#")[0].split("?")[0].trim();
      if (cleanHostUrl.endsWith("/")) {
        cleanHostUrl = cleanHostUrl.slice(0, -1);
      }
      
      // Garante que a URL possua protocolo https:// ou http:// para que o webhook e back_urls do Mercado Pago sejam válidos
      if (!cleanHostUrl.startsWith("http://") && !cleanHostUrl.startsWith("https://")) {
        cleanHostUrl = `https://${cleanHostUrl}`;
      }

      // Real Checkout Pro payload
      const payload: any = {
        items: [
          {
            id: packageId,
            title: `FanCard Brasil - Pacote ${PACK_NAMES[packageId]}`,
            quantity: 1,
            unit_price: Number(price),
            currency_id: "BRL",
            category_id: "art",
            description: `Montagem de figurinha colecionável esportiva digital Premium para ${buyer.name}.`,
          },
        ],
        payer: {
          name: buyer.name,
          email: buyer.email,
        },
        back_urls: {
          success: `${cleanHostUrl}/#/pedido/${orderId}?token=${accessToken}&status=success`,
          failure: `${cleanHostUrl}/#/pedido/${orderId}?token=${accessToken}&status=failure`,
          pending: `${cleanHostUrl}/#/pedido/${orderId}?token=${accessToken}&status=pending`,
        },
        auto_return: "all",
        statement_descriptor: "FANCARDBRASIL",
        external_reference: orderId,
        notification_url: `${cleanHostUrl}/api/mercadopago/webhook`,
      };

      try {
        console.log(`[Mercado Pago Real] Iniciando criação de preferência para o pedido ${orderId}...`);
        const mpResponse = await fetch("https://api.mercadopago.com/v1/checkout/preferences", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessTokenMP}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!mpResponse.ok) {
          const errorData = await mpResponse.json();
          console.error("Erro na resposta da API Mercado Pago:", errorData);
          throw new Error(errorData.message || "Erro desconhecido ao requisitar Checkout Pro.");
        }

        const prefData = await mpResponse.json();
        newOrder.payment.preferenceId = prefData.id;
        newOrder.payment.checkoutUrl = prefData.init_point;
        newOrder.payment.status = "pending";

        const orders = await loadOrders();
        orders.push(newOrder);
        await saveOrders(orders);

        return res.json({
          status: "success",
          orderId,
          accessToken,
          checkoutUrl: prefData.init_point,
        });
      } catch (mpErr: any) {
        console.warn(`[Mercado Pago] Falha na comunicação com gateway de pagamento (${mpErr?.message || mpErr}). Usando modo simulado de fallback.`);
        
        if (process.env.NODE_ENV === "production") {
          return res.status(502).json({
            error: "Não foi possível gerar o checkout do Mercado Pago agora. Tente novamente em alguns minutos.",
          });
        }

        newOrder.payment.checkoutUrl = `${cleanHostUrl}/#pedido/${orderId}?token=${accessToken}&payment_status=simulated`;
        newOrder.payment.status = "pending";

        const orders = await loadOrders();
        orders.push(newOrder);
        await saveOrders(orders);

        return res.json({
          status: "success",
          orderId,
          accessToken,
          checkoutUrl: newOrder.payment.checkoutUrl,
        });
      }

    } catch (err: any) {
      console.error("Erro na criação do pedido:", err);
      return res.status(500).json({ error: "Erro interno no servidor ao criar pedido.", details: err?.message });
    }
  });

  // ==================== COBRANÇA PIX AUTOMÁTICA INTEGRADA ====================
  // APENAS PARA DESENVOLVIMENTO
  if (process.env.NODE_ENV !== 'production') {
    app.post("/api/mercado-pago/create-payment-pix", (req, res) => {
      try {
        const { packageId, priceValue, buyerName, buyerEmail, cpf } = req.body;
        console.log(`[Simulated Pix] Gerando recebimento Pix para o e-mail: ${buyerEmail || "cliente"}...`);
        
        // Retorna uma simulação bem sucedida e integrada do Pix Copia e Cola para a carteira
        return res.json({
          status: "simulated",
          paymentId: Math.floor(1000000 + Math.random() * 9000000),
          qrCode: "00020101021226870014br.gov.bcb.pix2565pix.fancard.brasil/cobranca/digital/2603202652040000530398654049.955802BR5914FanCardBrasil6009SaoPaulo62070503fcd",
        });
      } catch (err: any) {
        console.error("Erro ao processar criação de Pix transparente:", err);
        return res.status(500).json({ error: "Erro ao gerar código Pix para pagamento." });
      }
    });
  }

  // ==================== PUBLIC ENDPOINT: RETRIEVE SINGLE ORDER STATUS ====================

  // GET /api/orders/public/:publicOrderId
  app.get("/api/orders/public/:publicOrderId", async (req, res) => {
    const { publicOrderId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ error: "Token de acesso obrigatório ausente." });
    }

    const orders = await loadOrders();
    const order = orders.find((o) => o.id === publicOrderId);

    if (!order) {
      return res.status(404).json({ error: "Pedido não localizado." });
    }

    // Access control validation check
    if (order.accessToken !== token) {
      return res.status(401).json({ error: "Acesso não autorizado para visualizar o pedido." });
    }

    const safeOrder = {
      id: order.id,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      packageId: order.packageId,
      packageName: order.packageName,
      quantity: order.quantity,
      price: order.price,
      buyer: order.buyer,
      items: order.items.map((item) => ({
        id: item.id,
        index: item.index,
        photoUrl: item.photoUrl,
        originalPhotoName: item.originalPhotoName,
        cardData: item.cardData,
      })),
      payment: {
        provider: order.payment.provider,
        status: order.payment.status,
        checkoutUrl: order.payment.checkoutUrl,
      },
      production: {
        status: order.production.status,
        finalFiles: order.production.finalFiles,
      },
      feedback: order.feedback,
    };

    return res.json(safeOrder);
  });

  // ==================== MERCADO PAGO WEBHOOK ====================

  const parseMercadoPagoSignature = (signatureHeader: string) => {
    return signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    }, {});
  };

  const isValidMercadoPagoSignature = (
    signatureHeader: string,
    requestId: string,
    paymentId: string,
    secret: string
  ) => {
    const signatureParts = parseMercadoPagoSignature(signatureHeader);
    const ts = signatureParts.ts;
    const receivedHash = signatureParts.v1;
    if (!ts || !receivedHash) return false;

    const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
    const expectedHash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    const received = Buffer.from(receivedHash);
    const expected = Buffer.from(expectedHash);
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  };

  // POST /api/mercadopago/webhook (with GET support for verification)
  app.all("/api/mercadopago/webhook", async (req, res) => {
    // If it's a GET request, just acknowledge for MP verification
    if (req.method === 'GET') {
      return res.status(200).send("OK");
    }

    try {
      const sig = req.headers["x-signature"] as string;
      const requestId = req.headers["x-request-id"] as string;
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

      if (secret && (!sig || !requestId)) {
        console.warn("[Webhook] Assinatura ausente.");
        return res.sendStatus(403);
      }

      if (secret && sig && requestId) {
        const data = req.body;
        const paymentId = String(data.data?.id || data.id || req.query.id || "");
        if (!paymentId || !isValidMercadoPagoSignature(sig, requestId, paymentId, secret)) {
          console.warn("[Webhook] Assinatura inválida.");
          return res.sendStatus(403);
        }
      }

      console.log("Recebendo chamada webhook do Mercado Pago (POST):", JSON.stringify(req.body));
      const { action, type, data } = req.body;
      const paymentId = data?.id || req.query.id;
      const topic = type || req.query.topic;

      // Filter only for payment updates
      if (topic === "payment" || action?.startsWith("payment")) {
        const accessTokenMP = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!accessTokenMP || accessTokenMP === "SEU_ACCESS_TOKEN_AQUI") {
          console.warn("Mercado Pago token não configurado. Impossível consultar pagamento no webhook.");
          return res.sendStatus(200);
        }

        console.log(`Buscando dados do pagamento ${paymentId} no Mercado Pago...`);
        const queryResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${accessTokenMP}` },
        });

        if (!queryResponse.ok) {
          console.warn(`[Webhook Warning] Erro ao consultar pagamento ${paymentId} no gateway: ${queryResponse.status}. Retornando sucesso para o teste.`);
          return res.status(200).send({ message: "Notificação recebida, mas pagamento irreconhecível no gateway." });
        }

        const paymentInfo = await queryResponse.json();
        const orderId = paymentInfo.external_reference;
        const mpStatus = paymentInfo.status; // approved, pending, rejected etc

        if (orderId) {
          const orders = await loadOrders();
          const orderIdx = orders.findIndex((o) => o.id === orderId);

          if (orderIdx !== -1) {
            const order = orders[orderIdx];
            console.log(`Atualizando status de pagamento do pedido ${orderId} para [${mpStatus}]`);

            order.payment.paymentId = String(paymentId);
            order.payment.status = mpStatus;
            order.updatedAt = new Date().toISOString();

            if (mpStatus === "approved") {
              order.production.status = "waiting_admin_production";
            }

            orders[orderIdx] = order;
            await saveOrders(orders);
          } else {
            console.warn(`Webhook: Pedido correspondente ${orderId} não encontrado no sistema.`);
          }
        }
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error("Erro interno no processamento do webhook:", err);
      return res.sendStatus(500);
    }
  });

  // ==================== SIMULATION ROUTE: INSTANT LOCAL PAYMENT FOR TESTING ====================
  // APENAS PARA DESENVOLVIMENTO
  if (process.env.NODE_ENV !== 'production') {
    app.post("/api/admin/simulate-pay/:id", async (req, res) => {
      const { id } = req.params;
      const orders = await loadOrders();
      const idx = orders.findIndex((o) => o.id === id);

      if (idx === -1) {
        return res.status(404).json({ error: "Pedido não localizado." });
      }

      const order = orders[idx];
      order.payment.status = "approved";
      order.production.status = "waiting_admin_production";
      order.updatedAt = new Date().toISOString();

      orders[idx] = order;
      await saveOrders(orders);

      console.log(`[Simulação] Pagamento do pedido ${id} aprovado via rota interna sandbox.`);
      return res.json({ status: "success", message: `Pedido ${id} simulado com sucesso.`, order });
    });
  }

  // ==================== ENDPOINT: SUBMIT FEEDBACK ====================

  app.post("/api/orders/:orderId/feedback", async (req, res) => {
    const { orderId } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || !comment || comment.length < 10) {
      return res.status(400).json({ error: "Avaliação incompleta ou comentário muito curto." });
    }

    const orders = await loadOrders();
    const idx = orders.findIndex((o) => o.id === orderId);

    if (idx === -1) {
      return res.status(404).json({ error: "Pedido não localizado." });
    }

    orders[idx].feedback = {
      rating,
      comment,
      createdAt: new Date().toISOString()
    };
    
    await saveOrders(orders);
    return res.json({ status: "success" });
  });


  // GET /api/admin/orders - list all orders
  app.get("/api/admin/orders", adminAuth, async (req, res) => {
    const orders = await loadOrders();
    return res.json(orders);
  });

  // GET /api/admin/orders/:id - detail specific order
  app.get("/api/admin/orders/:id", adminAuth, async (req, res) => {
    const { id } = req.params;
    const orders = await loadOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    return res.json(order);
  });

  // PATCH /api/admin/orders/:id - edit / update cardData or status
  app.patch("/api/admin/orders/:id", adminAuth, async (req, res) => {
    const { id } = req.params;
    const updatePayload = req.body;

    const orders = await loadOrders();
    const idx = orders.findIndex((o) => o.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }

    const order = orders[idx];

    // Allowed fields to update recursively
    if (updatePayload.buyer) {
      order.buyer = { ...order.buyer, ...updatePayload.buyer };
    }

    if (updatePayload.productionStatus) {
      order.production.status = updatePayload.productionStatus;
    }

    if (updatePayload.adminNotes !== undefined) {
      order.production.adminNotes = updatePayload.adminNotes;
    }

    if (updatePayload.items && Array.isArray(updatePayload.items)) {
      updatePayload.items.forEach((itemPatch: any) => {
        const itemIdx = order.items.findIndex((item) => item.id === itemPatch.id);
        if (itemIdx !== -1) {
          const item = order.items[itemIdx];
          if (itemPatch.cardData) {
            item.cardData = { ...item.cardData, ...itemPatch.cardData };

            // Recalculate prompt automatically on edit
            item.generatedPrompt = buildFanCardPrompt(item.cardData);
          }
        }
      });
    }

    order.updatedAt = new Date().toISOString();
    orders[idx] = order;
    await saveOrders(orders);

    console.log(`[Admin] Pedido ${id} editado com sucesso.`);
    return res.json({ status: "success", order });
  });

  // POST /api/admin/orders/:id/final-files - upload generated FanCard for an item
  app.post("/api/admin/orders/:id/final-files", adminAuth, async (req, res) => {
    const { id } = req.params;
    const { itemId, fileBase64, fileName } = req.body;

    if (!itemId || !fileBase64 || !fileName) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes: itemId, fileBase64, fileName." });
    }

    const orders = await loadOrders();
    const orderIdx = orders.findIndex((o) => o.id === id);

    if (orderIdx === -1) {
      return res.status(404).json({ error: "Pedido não encontrado no sistema." });
    }

    const order = orders[orderIdx];

    // Verify item exists
    const itemExists = order.items.some((it) => it.id === itemId);
    if (!itemExists) {
      return res.status(404).json({ error: "Item de figurinha correspondente não localizado." });
    }

    // Save final uploaded asset
    const savedUrl = await saveBase64Image(fileBase64, "final", fileName);

    const newFinalFile: FinalFile = {
      id: "final_" + Math.random().toString(36).substring(2, 9),
      itemId,
      url: savedUrl,
      fileName,
      uploadedAt: new Date().toISOString(),
    };

    // Filter out old upload for this itemId if it exists (allows overwrite)
    order.production.finalFiles = order.production.finalFiles.filter((ff) => ff.itemId !== itemId);
    order.production.finalFiles.push(newFinalFile);

    // Dynamic auto-handling of status transitions
    const totalItems = order.items.length;
    const finishedItemsCount = order.production.finalFiles.length;

    if (finishedItemsCount === totalItems) {
      order.production.status = "ready";
    } else if (finishedItemsCount > 0) {
      order.production.status = "in_production";
    }

    order.updatedAt = new Date().toISOString();
    orders[orderIdx] = order;
    await saveOrders(orders);

    console.log(`[Admin] Figurinhas finalizada adicionada para o item ${itemId} do pedido ${id}.`);
    return res.json({ status: "success", order });
  });

  // ==================== CLIENT VITE INTEGRATION BIND ====================

  if (!serveClient) {
    return app;
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("Integrando middleware do Vite no Express...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Iniciando arquivos estáticos compilados em produção...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

async function startServer() {
  const app = await createApp({ serveClient: true });
  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FanCard Brasil] Servidor ativo na porta ${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}
