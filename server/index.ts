import express from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync, getUncachableStripeClient, getStripePublishableKey } from './stripeClient.js';
import { WebhookHandlers } from './webhookHandlers.js';
import { getProductById, validateProductVariant, getAllProducts, invalidateProductsCache } from './products.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

// ===== PIX BR CODE GENERATOR (Banco Central EMV standard) =====
function pixTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function generatePixBRCode(pixKey: string, merchantName: string, merchantCity: string, amountCents: number, txId: string): string {
  const amountStr = (amountCents / 100).toFixed(2);
  const name = merchantName.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const city = merchantCity.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const ref = txId.substring(0, 25).replace(/[^a-zA-Z0-9]/g, '');

  const mai = pixTag('00', 'BR.GOV.BCB.PIX') + pixTag('01', pixKey);
  const adf = pixTag('05', ref || '***');

  let payload = '';
  payload += pixTag('00', '01');
  payload += pixTag('26', mai);
  payload += pixTag('52', '0000');
  payload += pixTag('53', '986');
  payload += pixTag('54', amountStr);
  payload += pixTag('58', 'BR');
  payload += pixTag('59', name);
  payload += pixTag('60', city);
  payload += pixTag('62', adf);
  payload += '6304'; // CRC placeholder

  return payload + crc16(payload);
}

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendOrderNotificationEmail(order: any) {
  const adminEmail = process.env.GMAIL_USER;
  if (!adminEmail) return;

  const formatPrice = (cents: number) =>
    `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

  const itemsHtml = order.items?.map((item: any) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
        <strong>${item.name || item.productName || 'Produto'}</strong><br/>
        <span style="color:#888;font-size:12px;">Tam: ${item.size || '-'} &nbsp;|&nbsp; Qtd: ${item.quantity || 1}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">
        ${formatPrice((item.price || 0) * (item.quantity || 1))}
      </td>
    </tr>
  `).join('') || `<tr><td colspan="2" style="padding:8px 12px;">${order.productName || 'Produto'} &mdash; ${order.size || ''}</td></tr>`;

  const total = order.totalAmount || order.amount || order.price || 0;
  const customerName = [order.firstName, order.lastName].filter(Boolean).join(' ') || order.userEmail || 'Cliente';
  const address = [order.shippingAddress, order.city, order.postalCode].filter(Boolean).join(', ') || '-';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
      <div style="background:#FACC15;padding:24px 28px;display:flex;align-items:center;gap:12px;">
        <h1 style="margin:0;font-size:22px;color:#000;letter-spacing:-0.5px;">🛒 Novo Pedido — VURO</h1>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 4px;font-size:13px;color:#888;">ID do Pedido</p>
        <p style="margin:0 0 20px;font-family:monospace;font-size:14px;color:#333;">${order.id}</p>

        <h2 style="font-size:15px;margin:0 0 12px;color:#111;">👤 Cliente</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:8px;overflow:hidden;">
          <tr><td style="padding:8px 12px;color:#888;font-size:13px;width:130px;">Nome</td><td style="padding:8px 12px;font-size:13px;">${customerName}</td></tr>
          <tr><td style="padding:8px 12px;color:#888;font-size:13px;">Email</td><td style="padding:8px 12px;font-size:13px;">${order.userEmail || '-'}</td></tr>
          <tr><td style="padding:8px 12px;color:#888;font-size:13px;">Telefone</td><td style="padding:8px 12px;font-size:13px;">${order.phone || '-'}</td></tr>
          <tr><td style="padding:8px 12px;color:#888;font-size:13px;">Endereço</td><td style="padding:8px 12px;font-size:13px;">${address}</td></tr>
        </table>

        <h2 style="font-size:15px;margin:0 0 12px;color:#111;">📦 Itens do Pedido</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#fafafa;border-radius:8px;overflow:hidden;">
          ${itemsHtml}
          <tr style="background:#fff8d6;">
            <td style="padding:12px;font-weight:bold;font-size:15px;">Total</td>
            <td style="padding:12px;font-weight:bold;font-size:15px;text-align:right;">${formatPrice(total)}</td>
          </tr>
        </table>

        <p style="font-size:12px;color:#aaa;margin:0;">Recebido em ${new Date(order.createdAt || Date.now()).toLocaleString('pt-BR')}</p>
      </div>
    </div>
  `;

  try {
    await emailTransporter.sendMail({
      from: `"VURO Loja" <${adminEmail}>`,
      to: adminEmail,
      subject: `🛒 Novo pedido — ${customerName} (${formatPrice(total)})`,
      html,
    });
    console.log('Order notification email sent to', adminEmail);
  } catch (err: any) {
    console.error('Failed to send order notification email:', err.message);
  }
}

const DATA_DIR = path.resolve(process.cwd(), 'data');

function readJsonFile(filename: string): any[] {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

function writeJsonFile(filename: string, data: any[]): boolean {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 7500;

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('DATABASE_URL not found - Stripe integration will be limited');
    return false;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();
    if (!stripeSync) {
      console.warn('Stripe Sync not available - skipping sync and webhook setup');
      return false;
    }

    console.log('Setting up managed webhook...');
    const domains = process.env.REPLIT_DOMAINS?.split(',');
    if (domains && domains[0]) {
      const webhookBaseUrl = `https://${domains[0]}`;
      try {
        const result = await stripeSync.findOrCreateManagedWebhook(
          `${webhookBaseUrl}/api/stripe/webhook`
        );
        if (result?.webhook?.url) {
          console.log(`Webhook configured: ${result.webhook.url}`);
        } else {
          console.log('Webhook setup completed');
        }
      } catch (webhookError: any) {
        console.warn('Webhook setup warning:', webhookError.message);
      }
    } else {
      console.log('Webhook setup skipped - no domain available');
    }

    console.log('Syncing Stripe data...');
    stripeSync.syncBackfill()
      .then(() => {
        console.log('Stripe data synced');
      })
      .catch((err: any) => {
        console.error('Error syncing Stripe data:', err);
      });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return false;
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);

      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fast cached products API
app.get('/api/products', async (req, res) => {
  try {
    const startTime = Date.now();
    const products = await getAllProducts();
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Local JSON products - must be before /:id route
app.get('/api/products/local', (req, res) => {
  try {
    const products = readJsonFile('products.json');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch local products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const startTime = Date.now();
    const product = await getProductById(req.params.id);
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('Cache-Control', 'public, max-age=120');
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error: any) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/api/stripe/publishable-key', async (req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    if (!publishableKey) {
       return res.status(404).json({ error: 'Stripe is not configured' });
    }
    res.json({ publishableKey });
  } catch (error: any) {
    console.error('Error getting publishable key:', error);
    res.status(500).json({ error: 'Failed to get Stripe configuration' });
  }
});

import { z } from 'zod';
import Groq from 'groq-sdk';

// AI Chat endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const groq = new Groq({ apiKey: groqApiKey });
    
    // Get products for context - compact format to stay within token limits
    const products = await getAllProducts();
    const productContext = products.slice(0, 30).map(p => `${p.id}|${p.name}|${p.brand || ''}|R$${(Number(p.price)/100).toFixed(0)}`).join('\n');

    const systemPrompt = `Voce e a Vega, assistente animada e jovem da VURO - melhor loja de tenis premium do Brasil. Seja direta, util e use emojis com moderacao 👟💛🔥.

CATALOGO (id|nome|marca|preco):
${productContext}

PRODUTOS: 100% originais, comprados de distribuidoras oficiais. Garantia 3 meses. Tamanhos 34-47. Opcoes masculino, feminino e kids. Para ver cores/tamanhos especificos, oriente a ver a pagina do produto.

MARCAS: Nike, Adidas, Jordan, New Balance, Vans, Puma, Asics, Mizuno, Converse, Reebok, Fila.
- Dia a dia: New Balance, Nike Air Max, Adidas Ultraboost
- Corrida: New Balance, Asics, Mizuno, Adidas Ultraboost
- Academia: Nike, Adidas, Asics
- Streetwear/estilo: Jordan, Vans, Nike Dunk, Adidas Originals

PAGAMENTO: Cartao credito (parcelado 12x, +3% taxa), PIX (sem taxa, aprovacao imediata), boleto.
FRETE: Gratis acima de R$300. Padrao R$20 abaixo de R$199. Entrega 7-15 dias uteis (Sul/Sudeste 7-10d, demais 10-15d).
TROCA/DEVOLUCAO: 30 dias. Produto sem uso, embalagem original. Troca de tamanho gratis. Reembolso em 7 dias uteis.
CUPONS: VURO10 (10% off), PRIMEIRA30 (30% 1a compra), SNEAKERHEAD (R$50 off), FRETEVURO/FRETE300/FRETELIVRE/ENVIOGRAT (frete gratis).
SUPORTE: So por este chat. SEM telefone/WhatsApp/email publico. Problemas com pedido: "Meus Pedidos" no perfil.
REDES: Instagram instagram.com/vuro.br | TikTok @vuro.store.br | Facebook facebook.com/share/1N44qt3Wtb/

REGRAS: Use APENAS produtos do catalogo. Recomende 2-3 por vez. Nunca invente contatos.
FORMATO: Ao recomendar produtos, adicione ao FINAL da resposta: [PRODUCTS: id1, id2] — use o id EXATO do catalogo (incluindo o - inicial). Sem recomendacao, responda normalmente.`;

    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system', content: systemPrompt },
    ];

    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: message });

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 700,
    });

    let responseText = completion.choices[0]?.message?.content || 'Desculpe, nao consegui processar sua pergunta.';
    
    // Extract all product recommendation tags from the response
    const allProductMatches = [...responseText.matchAll(/\[PRODUCTS:\s*([^\]]+)\]/gi)];
    let recommendedProducts: Array<{id: string, name: string, brand: string, price: string, image: string}> = [];
    const seenIds = new Set<string>();

    for (const match of allProductMatches) {
      const ids = match[1].split(',').map((id: string) => id.trim());
      for (const rawId of ids) {
        if (seenIds.size >= 4) break;
        // Firebase IDs start with '-', but the model may strip it — try both
        const product = products.find(p => {
          const pid = String(p.id);
          return pid === rawId || pid === '-' + rawId || pid.replace(/^-/, '') === rawId;
        });
        if (product && !seenIds.has(String(product.id))) {
          seenIds.add(String(product.id));
          recommendedProducts.push({
            id: String(product.id),
            name: product.name,
            brand: product.brand || '',
            price: String(product.price),
            image: product.image || '',
          });
        }
      }
    }

    // Remove all [PRODUCTS:...] tags and any leftover ID references from the displayed message
    responseText = responseText.replace(/\[PRODUCTS:[^\]]+\]/gi, '').trim();
    responseText = responseText.replace(/\(ID:?\s*-?[A-Za-z0-9_]+\)/gi, '').trim();

    res.json({ 
      message: responseText,
      products: recommendedProducts 
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

const CheckoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().or(z.number()),
    quantity: z.number().min(1).max(10),
    size: z.string().optional(),
    color: z.string().optional()
  })).min(1),
  customerEmail: z.string().email(),
  shippingOption: z.enum(['standard', 'express', 'overnight', 'pix_discount']).default('standard'),
  isFirstPurchase: z.boolean().optional().default(false),
  couponCode: z.string().optional(),
  couponDiscount: z.number().min(0).optional().default(0),
  isFreeShippingCoupon: z.boolean().optional().default(false),
  shippingInfo: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1)
  }).optional()
});

app.post('/api/checkout/create-session', async (req, res) => {
  try {
    const validatedData = CheckoutSchema.parse(req.body);
    const { items, customerEmail, shippingOption, shippingInfo, isFirstPurchase, couponCode, couponDiscount, isFreeShippingCoupon } = validatedData;

    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      return res.status(400).json({ error: 'Pagamentos indisponíveis no momento' });
    }
    
    // Get base URL from request headers or environment
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || '127.0.0.1:7500';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

    const lineItems: any[] = [];
    
    for (const item of items) {
      const product = await getProductById(item.productId);
      
      if (!product) {
        return res.status(400).json({ error: `Produto não encontrado: ${item.productId}` });
      }

      if (!validateProductVariant(product, item.size, item.color)) {
        return res.status(400).json({ error: `Variante inválida para o produto: ${product.name}` });
      }

      const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1));

      // Product price from database is already in CENTS (e.g., 25198 = R$251,98)
      let priceInCents: number;
      const productPrice = product.price as string | number;
      if (typeof productPrice === 'string') {
        // Parse string format like "R$ 172,00" or "172,00" — these are in reais, convert to cents
        const cleanPrice = productPrice.replace(/[R$\s.]/g, '').replace(',', '.');
        priceInCents = Math.round(parseFloat(cleanPrice) * 100);
      } else {
        // Price is already in cents — use directly, no multiplication
        priceInCents = Math.round(Number(productPrice));
      }

      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: product.name,
            description: `Tamanho: ${item.size || 'N/A'} | Cor: ${item.color || 'N/A'}`,
          },
          unit_amount: priceInCents,
        },
        quantity: quantity,
      });
    }

    // Read shipping settings
    let storeSettings: any = { freeShipping: false, standardShippingCost: 2500, expressShippingCost: 1500, overnightShippingCost: 3500 };
    try {
      const s = readJsonFile('settings.json');
      storeSettings = Array.isArray(s) ? (s[0] || storeSettings) : (s || storeSettings);
    } catch {}

    const standardCostCents = storeSettings.freeShipping ? 0 : (Number(storeSettings.standardShippingCost) || 2500);
    const expressCostCents = Number(storeSettings.expressShippingCost) || 1500;
    const overnightCostCents = Number(storeSettings.overnightShippingCost) || 3500;

    const shippingCosts: Record<string, { cost: number; name: string }> = {
      standard: { cost: standardCostCents / 100, name: storeSettings.freeShipping ? 'Frete Padrão (Grátis)' : 'Frete Padrão' },
      express: { cost: expressCostCents / 100, name: 'Frete Expresso' },
      overnight: { cost: overnightCostCents / 100, name: 'Entrega Amanhã' },
      pix_discount: { cost: 0, name: 'Pagamento via PIX (5% OFF)' },
    };

    let selectedShipping = shippingCosts[shippingOption] || shippingCosts.standard;

    // Free shipping coupon — zero out shipping
    if (isFreeShippingCoupon) {
      selectedShipping = { cost: 0, name: 'Frete Grátis (Cupom)' };
    }

    // Apply discounts
    const subtotal = lineItems.reduce((acc, item) => acc + (item.price_data.unit_amount * item.quantity), 0);
    
    // Coupon discount
    if (couponDiscount && couponDiscount > 0) {
      const couponDiscountCents = Math.round(couponDiscount * 100);
      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: couponCode ? `Cupom ${couponCode}` : 'Desconto Cupom',
          },
          unit_amount: -couponDiscountCents,
        },
        quantity: 1,
      });
    }

    // PIX discount (5%)
    const pixDiscountAmount = shippingOption === 'pix_discount' ? Math.round(subtotal * 0.05) : 0;
    if (pixDiscountAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Desconto PIX (5%)',
          },
          unit_amount: -pixDiscountAmount,
        },
        quantity: 1,
      });
    }
    
    if (selectedShipping.cost > 0) {
      lineItems.push({
        price_data: {
          currency: 'brl',
          product_data: {
            name: selectedShipping.name,
          },
          unit_amount: Math.round(Number(selectedShipping.cost) * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      currency: 'brl',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=true`,
      customer_email: customerEmail,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['BR'],
      },
      locale: 'pt-BR',
      payment_intent_data: {
        statement_descriptor: 'VURO',
      },
      metadata: {
        shippingInfo: JSON.stringify(shippingInfo || {}),
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Falha ao criar sessão de pagamento' });
  }
});

app.get('/api/checkout/verify/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      return res.status(400).json({ error: 'Pagamentos indisponíveis no momento' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      success: session.payment_status === 'paid',
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
    });
  } catch (error: any) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ===== PAGBANK PIX =====
app.post('/api/pagbank/pix', async (req, res) => {
  try {
    const { totalAmount, customerName, customerEmail, customerCpf } = req.body;

    const clientId = process.env.PAGBANK_CLIENT_ID;
    const clientSecret = process.env.PAGBANK_CLIENT_SECRET;
    const accountId = process.env.PAGBANK_ACCOUNT_ID;
    const pagbankConfigured = !!(clientId && clientSecret && accountId);

    const cpfClean = (customerCpf || '').replace(/\D/g, '');
    if (cpfClean.length !== 11) return res.status(400).json({ error: 'CPF inválido' });

    let pixCode: string | null = null;
    let qrCodeImage: string | null = null;
    let orderId: string | null = null;

    if (pagbankConfigured) {
      const isSandbox = process.env.PAGBANK_ENV === 'sandbox';
      const baseUrl = isSandbox ? 'https://sandbox.api.pagseguro.com' : 'https://api.pagseguro.com';

      // Step 1: Get OAuth access token via client_credentials
      const oauthParams = new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'payments.read payments.create'
      });
      let accessToken: string | null = null;
      try {
        const oauthAbort = new AbortController();
        const oauthTimeout = setTimeout(() => oauthAbort.abort(), 5000);
        const oauthRes = await fetch(`${baseUrl}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: oauthParams.toString(),
          signal: oauthAbort.signal
        });
        clearTimeout(oauthTimeout);
        const oauthText = await oauthRes.text();
        console.log('[PagBank] OAuth status:', oauthRes.status, '| body:', oauthText.slice(0, 200));
        if (oauthText) {
          const oauthData = JSON.parse(oauthText);
          if (oauthData.access_token) accessToken = oauthData.access_token;
        }
      } catch (e) {
        console.log('[PagBank] OAuth failed or timed out:', (e as any)?.name === 'AbortError' ? 'timeout' : e);
      }

      if (!accessToken) {
        const rawToken = process.env.PAGBANK_TOKEN;
        if (rawToken) {
          accessToken = rawToken.replace(/^Bearer\s+/i, '').trim();
          console.log('[PagBank] Using direct token, length:', accessToken.length);
        }
      }

      if (accessToken) {
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 24);
        const expirationStr = expiration.toISOString().slice(0, 19) + '-03:00';

        const body: any = {
          reference_id: `VURO-${Date.now()}`,
          customer: {
            name: customerName || 'Cliente VURO',
            email: customerEmail,
            tax_id: cpfClean
          },
          items: [{ name: 'Produtos VURO', quantity: 1, unit_amount: Math.round(Number(totalAmount)) }],
          qr_codes: [{ amount: { value: Math.round(Number(totalAmount)) }, expiration_date: expirationStr }]
        };

        const pagbankUrl = `${baseUrl}/orders`;
        console.log('[PagBank] calling URL:', pagbankUrl);

        const headers: Record<string, string> = {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'x-api-version': '4.0'
        };
        if (accountId && accountId !== 'undefined') {
          headers['x-pag-seller-account-id'] = accountId;
        }

        try {
          const orderAbort = new AbortController();
          const orderTimeout = setTimeout(() => orderAbort.abort(), 8000);
          const response = await fetch(pagbankUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: orderAbort.signal
          });
          clearTimeout(orderTimeout);
          const data = await response.json();
          console.log('[PagBank] order status:', response.status, '| response:', JSON.stringify(data));
          if (response.ok) {
            const qrCode = data.qr_codes?.[0];
            pixCode = qrCode?.text || null;
            qrCodeImage = qrCode?.links?.find((l: any) => l.rel === 'QRCODE.PNG')?.href || null;
            orderId = data.id || null;
          } else {
            console.warn('[PagBank] API failed, falling back to local BR Code generator');
          }
        } catch (e) {
          console.warn('[PagBank] API call error or timed out, falling back to local BR Code generator:', (e as any)?.name === 'AbortError' ? 'timeout' : e);
        }
      }
    } else {
      console.log('[PIX] PagBank not configured, using local BR Code generator');
    }

    // Fallback: generate PIX BR Code locally (Banco Central EMV standard)
    if (!pixCode) {
      const PIX_KEY = 'Vuro.com.br@gmail.com';
      const txId = `VURO${Date.now()}`;
      pixCode = generatePixBRCode(PIX_KEY, 'VURO', 'SAO PAULO', Math.round(Number(totalAmount)), txId);
      orderId = txId;
      console.log('[PIX] Generated local BR Code, length:', pixCode.length);
    }

    // Generate QR code image if not provided by PagBank
    if (!qrCodeImage && pixCode) {
      try {
        qrCodeImage = await QRCode.toDataURL(pixCode, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 300,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
      } catch (e) {
        console.warn('[PIX] QR code image generation failed:', e);
      }
    }

    res.json({ orderId, pixCode, qrCodeImage, expirationDate: null });
  } catch (error: any) {
    console.error('PagBank PIX error:', error);
    res.status(500).json({ error: 'Erro interno ao gerar PIX' });
  }
});

// ===== JSON DATABASE APIs =====

// Orders API
app.get('/api/orders', (req, res) => {
  try {
    console.log('Fetching orders from JSON file...');
    const { email } = req.query;
    let orders = readJsonFile('orders.json');
    console.log(`Found ${orders.length} orders`);
    if (email) {
      orders = orders.filter((o: any) => o.userEmail === email);
    }
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orders = readJsonFile('orders.json');
    const newOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...req.body,
      createdAt: Date.now()
    };
    orders.push(newOrder);
    writeJsonFile('orders.json', orders);
    // Send email notification to admin (fire-and-forget)
    sendOrderNotificationEmail(newOrder).catch(() => {});
    res.json(newOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.patch('/api/orders/:id', (req, res) => {
  try {
    const orders = readJsonFile('orders.json');
    const index = orders.findIndex((o: any) => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    orders[index] = { ...orders[index], ...req.body };
    writeJsonFile('orders.json', orders);
    res.json(orders[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  try {
    let orders = readJsonFile('orders.json');
    orders = orders.filter((o: any) => o.id !== req.params.id);
    writeJsonFile('orders.json', orders);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Store Settings API
app.get('/api/settings', (req, res) => {
  try {
    const settings = readJsonFile('settings.json');
    res.json(settings.length ? settings[0] : settings);
  } catch {
    res.json({ freeShipping: false, standardShippingCost: 2500, expressShippingCost: 1500, overnightShippingCost: 3500 });
  }
});

app.patch('/api/settings', (req, res) => {
  try {
    let settings: any = {};
    try { settings = readJsonFile('settings.json'); if (Array.isArray(settings)) settings = settings[0] || {}; } catch {}
    const updated = { ...settings, ...req.body };
    writeJsonFile('settings.json', updated);
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Refunds API
app.get('/api/refunds', (req, res) => {
  try {
    console.log('Fetching refunds from JSON file...');
    const refunds = readJsonFile('refunds.json');
    console.log(`Found ${refunds.length} refunds`);
    res.json(refunds);
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

app.post('/api/refunds', (req, res) => {
  try {
    const refunds = readJsonFile('refunds.json');
    const newRefund = {
      id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...req.body,
      status: 'pending',
      createdAt: Date.now()
    };
    refunds.push(newRefund);
    writeJsonFile('refunds.json', refunds);
    res.json(newRefund);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create refund' });
  }
});

app.patch('/api/refunds/:id', (req, res) => {
  try {
    const refunds = readJsonFile('refunds.json');
    const index = refunds.findIndex((r: any) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Refund not found' });
    }
    refunds[index] = { ...refunds[index], ...req.body };
    writeJsonFile('refunds.json', refunds);
    res.json(refunds[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update refund' });
  }
});

// Process a real Stripe refund when admin approves
app.post('/api/refunds/:id/stripe-refund', async (req, res) => {
  try {
    const refunds = readJsonFile('refunds.json');
    const refund = refunds.find((r: any) => r.id === req.params.id);
    if (!refund) return res.status(404).json({ error: 'Refund not found' });

    // Find the original order to get the Stripe session ID
    const orders = readJsonFile('orders.json');
    const order = orders.find((o: any) => o.id === refund.orderId);
    if (!order?.stripeSessionId) {
      return res.status(400).json({ error: 'Stripe session ID not found for this order. Please refund manually at dashboard.stripe.com.' });
    }

    const stripe = await getUncachableStripeClient();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe não configurado. Reembolse manualmente em dashboard.stripe.com.' });
    }

    // Retrieve the Checkout Session to get the PaymentIntent
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    const paymentIntentId = session.payment_intent as string;
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent not found. Please refund manually at dashboard.stripe.com.' });
    }

    // Create the refund on Stripe
    const stripeRefund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    // Mark the refund as processed in our system
    const idx = refunds.findIndex((r: any) => r.id === req.params.id);
    refunds[idx] = {
      ...refunds[idx],
      status: 'approved',
      processedAt: Date.now(),
      stripeRefundId: stripeRefund.id,
      stripeRefundStatus: stripeRefund.status,
    };
    writeJsonFile('refunds.json', refunds);

    // Update the order status too
    const orderIdx = orders.findIndex((o: any) => o.id === refund.orderId);
    if (orderIdx !== -1) {
      orders[orderIdx] = { ...orders[orderIdx], refundStatus: 'approved', status: 'refunded' };
      writeJsonFile('orders.json', orders);
    }

    res.json({ success: true, stripeRefundId: stripeRefund.id, status: stripeRefund.status });
  } catch (error: any) {
    console.error('Stripe refund error:', error);
    res.status(500).json({ error: error.message || 'Failed to process Stripe refund' });
  }
});

// Products API (local JSON) - POST/PATCH/DELETE
app.post('/api/products', (req, res) => {
  try {
    const products = readJsonFile('products.json');
    const newProduct = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...req.body,
      createdAt: Date.now(),
      isNew: true
    };
    products.push(newProduct);
    writeJsonFile('products.json', products);
    invalidateProductsCache();
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.patch('/api/products/:id', (req, res) => {
  try {
    const products = readJsonFile('products.json');
    const index = products.findIndex((p: any) => String(p.id) === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    products[index] = { ...products[index], ...req.body };
    writeJsonFile('products.json', products);
    invalidateProductsCache();
    res.json(products[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    let products = readJsonFile('products.json');
    products = products.filter((p: any) => String(p.id) !== req.params.id);
    writeJsonFile('products.json', products);
    invalidateProductsCache();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Users API
app.get('/api/users', (req, res) => {
  try {
    const users = readJsonFile('users.json');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const users = readJsonFile('users.json');
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...req.body,
      createdAt: Date.now()
    };
    users.push(newUser);
    writeJsonFile('users.json', users);
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

async function startServer() {
  await initStripe();

  if (process.env.NODE_ENV === 'production') {
    // Try multiple paths for dist folder compatibility
    const possiblePaths = [
      path.resolve(__dirname, '..', 'dist'),
      path.resolve(process.cwd(), 'dist'),
      path.resolve('/app', 'dist'),
    ];
    
    let distPath = possiblePaths[0];
    for (const p of possiblePaths) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(path.join(p, 'index.html'))) {
          distPath = p;
          break;
        }
      } catch (e) {}
    }
    
    console.log('Serving static files from:', distPath);
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
