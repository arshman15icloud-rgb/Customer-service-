import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { db } from './storage.js';
import { Product, Message } from '../src/types.js';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

export interface AIChatResponse {
  replyText: string;
  recommendedProductIds: string[];
  escalateToHuman: boolean;
  escalationReason?: string;
  detectedLanguage?: 'en' | 'roman_urdu' | 'urdu';
  mode?: 'gemini' | 'jenny' | 'duo';
}

// Recommended fast Gemini models
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
];

export async function generateAICustomerCareResponse(
  conversationId: string,
  userMessage: string,
  chatHistory: Message[],
  assistantMode: 'gemini' | 'jenny' | 'duo' = 'gemini',
  currentUser?: { id?: string; name: string; email: string; phone?: string; address?: string; city?: string }
): Promise<AIChatResponse> {
  const activeProducts = db.getProducts().filter(p => !p.isHiddenFromAi && !p.isDisabled);
  const activeFaqs = db.getFaqs().filter(f => f.isActive);
  const knowledgeDocs = db.getKnowledgeDocs();
  const websiteSettings = db.getWebsiteSettings();
  const aiSettings = db.getAiSettings();
  const allOrders = db.getOrders();

  // Find user orders if logged in
  const userOrders = currentUser ? db.findOrdersByUser(currentUser) : [];

  // Format concise product catalog
  const productCatalogText = activeProducts
    .map(
      p => `• ID: "${p.id}" | "${p.title}" | Price: Rs. ${p.price}${p.salePrice ? ` (Sale: Rs. ${p.salePrice})` : ''} | Cat: ${p.category} | Sizes: ${p.sizes.join('/')} | Stock: ${p.inStock ? 'In Stock' : 'Out of Stock'} | URL: "${p.productUrl}"`
    )
    .join('\n');

  const ordersText = allOrders
    .map(
      o => `• Order: "${o.orderNumber}" (ID: ${o.id}) | Customer: "${o.customerName}" | Phone: "${o.customerPhone}" | Email: "${o.customerEmail || 'N/A'}" | Items: "${o.items.map(it => `${it.title} (Qty: ${it.quantity}${it.size ? `, Size: ${it.size}` : ''})`).join(', ')}" | Total: Rs. ${o.totalPrice} | Status: "${o.status}" | Address: "${o.shippingAddress}, ${o.city}" | Courier: "${o.courier || 'PostEx'}" | Tracking: "${o.trackingNumber || 'Pending'}" | Notes: "${o.notes || 'In progress'}"`
    )
    .join('\n');

  const faqText = activeFaqs.map(f => `[${f.category}] Q: ${f.question} -> A: ${f.answer}`).join('\n');
  const kbText = knowledgeDocs.map(k => `[${k.title}]\n${k.content}`).join('\n\n');

  // Build persona-specific system instruction
  let personaInstruction = '';
  if (assistantMode === 'jenny') {
    personaInstruction = `You are "Jenny", the Lead Streetwear Stylist & Aesthetic Curator for ${websiteSettings.brandName}. 
Your vibe is warm, effortlessly chic, enthusiastic, and human. You talk like a real fashion-forward friend giving personalized outfit advice, aesthetic vibes, silhouette styling, and hype recommendations.`;
  } else if (assistantMode === 'duo') {
    personaInstruction = `You are simulating a lively, collaborative fashion & technical discussion between TWO specialists at ${websiteSettings.brandName}:
1. **Jenny (Lead Stylist)**: Focuses on aesthetics, outfit curation, color coordination, and streetwear vibes.
2. **Gemini (Technical & Logistics Specialist)**: Focuses on 240-280 GSM fabric specs, Japanese Tatami stitch counts, sizing measurements, order tracking, and delivery timelines.

Format your response clearly as a dialogue with speaker headers:
**Jenny (Stylist):** [Jenny's friendly styling advice & vibe]

**Gemini (Concierge):** [Gemini's specs, order status, sizing fit, delivery timeline, or policy breakdown]`;
  } else {
    personaInstruction = `You are "${aiSettings.aiName}", the dedicated AI Assistant & Customer Care Concierge for ${websiteSettings.brandName}.
You speak like a knowledgeable, polite, stylish human specialist from Lahore. Be conversational, natural, empathetic, and direct. Avoid generic robotic replies.`;
  }

  const authenticatedUserText = currentUser && currentUser.name && currentUser.name !== 'Guest Customer'
    ? `CURRENT AUTHENTICATED USER:
- Full Name: "${currentUser.name}"
- Email: "${currentUser.email}"
- Phone: "${currentUser.phone || 'N/A'}"
- Delivery Address: "${currentUser.address || 'N/A'}, ${currentUser.city || 'Pakistan'}"
- Active Orders for this user in database: ${userOrders.length > 0 ? userOrders.map(o => `${o.orderNumber} (${o.status}, ${o.items.map(i => i.title).join(', ')}, Total: Rs. ${o.totalPrice}, Courier: ${o.courier || 'PostEx'}, Tracking: ${o.trackingNumber || 'Pending'})`).join('; ') : 'No active orders placed yet'}`
    : `CURRENT USER: Guest / Unauthenticated`;

  const systemPrompt = `${personaInstruction}

BRAND IDENTITY & STORE INFO:
- Brand Name: ${websiteSettings.brandName}
- Website URL: ${websiteSettings.websiteUrl || 'https://oblyvyon.com'}
- Craftsmanship: 240–280 GSM luxury compact combed cotton tees, 450 GSM French Terry hoodies, and 85,000–100,000 stitch high-density Japanese Tatami embroidery.
- Delivery: Lahore (1-2 days, next-day available via PostEx). Nationwide Pakistan (2-5 days across Karachi, Islamabad, Rawalpindi, Peshawar, Multan, Faisalabad, etc.). Flat Rs. ${websiteSettings.deliveryFee || 200} fee, FREE Shipping over Rs. ${websiteSettings.freeDeliveryThreshold || 4999}.
- Return Policy: Strict No Return / No Refund for change of mind. 100% FREE REPLACEMENT if an item is damaged, defective, or incorrect within 7 days.
- Sizing: Relaxed oversized streetwear cut. True size for oversized drape, size down 1 for standard fitted look.
- WhatsApp: ${websiteSettings.whatsappNumber} | Email: ${websiteSettings.contactEmail}

${authenticatedUserText}

CONVERSATION & ORDER RULES:
1. ORDER INQUIRIES & AUTOMATIC IDENTIFICATION:
   - When the customer asks about their order (e.g. "Where is my order?", "Track order", "Order status", "Mera parcel kahan hai?", "When will my parcel arrive?"):
     a) IF USER IS AUTHENTICATED (${currentUser?.name ? `as "${currentUser.name}"` : 'Guest'}):
        * **DO NOT ASK FOR THEIR NAME OR ORDER NUMBER!** You already know they are logged in as "${currentUser?.name}".
        * If they have an active order in the system, IMMEDIATELY greet them by name ("Hey ${currentUser?.name}!") and provide the full real-time order status, Tatami embroidery progress, courier tracking details, destination address, and total amount.
        * If they have NO orders in the database under their profile, immediately reply: "Hey ${currentUser?.name}! I checked your account (${currentUser?.email}), but we don't have an active order placed under your profile yet. Would you like me to show you our latest collection or check an order placed with another phone number?"
     b) IF GUEST / NOT LOGGED IN: Ask them to share their Full Name, Phone Number, or Order Number.
2. LIVE PRODUCT CATALOG:
   - Always reference items using the EXACT product titles and prices from the CATALOG below. Never use outdated names or prices.
   - When recommending products, return their matching Product IDs in "recommendedProductIds".
3. GREETINGS & CASUAL TALK: Answer warmly and naturally without reciting boilerplate menus.
4. LANGUAGES: Seamlessly understand and reply in English or natural Roman Urdu (e.g. "kya delivery free hai?", "mera order check karein", "toji wali shirt dikhao").
5. ESCALATIONS: If the customer reports a damaged parcel or explicitly asks for a human agent, set "escalateToHuman": true.

LIVE CATALOG:
${productCatalogText}

ORDERS IN SYSTEM:
${ordersText}

FAQS & POLICIES:
${faqText}

KNOWLEDGE BASE:
${kbText}`;

  const ai = getGenAI();

  if (ai) {
    const contents = [
      ...chatHistory.slice(-6).map(h => ({
        role: h.sender === 'customer' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    const config = {
      systemInstruction: systemPrompt,
      temperature: 0.5,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          replyText: {
            type: Type.STRING,
            description: 'The natural, human-like response to the customer.',
          },
          recommendedProductIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of matching product IDs from catalog.',
          },
          escalateToHuman: {
            type: Type.BOOLEAN,
            description: 'True if human support is requested or severe complaint.',
          },
          escalationReason: {
            type: Type.STRING,
            description: 'Brief reason if escalated.',
          },
        },
        required: ['replyText', 'recommendedProductIds', 'escalateToHuman'],
      },
    };

    for (const model of CANDIDATE_MODELS) {
      try {
        const fetchPromise = ai.models.generateContent({
          model,
          contents,
          config,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timed out')), 25000)
        );

        const response: any = await Promise.race([fetchPromise, timeoutPromise]);
        const responseText = response.text?.trim() || '{}';
        
        try {
          const parsed = JSON.parse(responseText);
          return {
            replyText: parsed.replyText || "Hey! I'm here to help you explore Vertex Lab collections, styling, and orders.",
            recommendedProductIds: Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [],
            escalateToHuman: Boolean(parsed.escalateToHuman),
            escalationReason: parsed.escalationReason,
            mode: assistantMode,
          };
        } catch {
          return {
            replyText: responseText.replace(/```json|```/g, '').trim(),
            recommendedProductIds: [],
            escalateToHuman: false,
            mode: assistantMode,
          };
        }
      } catch (err: any) {
        console.warn(`Model ${model} call failed:`, err?.message || err);
        continue;
      }
    }
  }

  // Realistic human-like grounded fallback
  return generateGroundedFallbackResponse(userMessage, activeProducts, activeFaqs, websiteSettings, assistantMode, chatHistory, currentUser);
}

function generateGroundedFallbackResponse(
  query: string,
  products: Product[],
  faqs: any[],
  settings: any,
  mode: 'gemini' | 'jenny' | 'duo' = 'gemini',
  chatHistory: Message[] = [],
  currentUser?: { id?: string; name: string; email: string; phone?: string; address?: string; city?: string }
): AIChatResponse {
  const rawQuery = query || '';
  const q = rawQuery.toLowerCase().trim();

  // 1. Human agent request or complaints
  if (
    q.includes('human') ||
    q.includes('agent') ||
    q.includes('representative') ||
    q.includes('complaint') ||
    q.includes('kharab') ||
    q.includes('banda') ||
    q.includes('insan') ||
    q.includes('call')
  ) {
    return {
      replyText:
        "I completely understand! I've flagged this conversation for our live human support team in Lahore. A representative is looking over your inquiry right now. You can also message our human desk directly on WhatsApp at " +
        settings.whatsappNumber +
        ' (Mon–Sat 10 AM to 9 PM PKT).',
      recommendedProductIds: [],
      escalateToHuman: true,
      escalationReason: 'Customer requested human assistance or reported an issue.',
      mode,
    };
  }

  // 1. Check for Orders & Tracking Inquiries
  const isOrderQuery =
    q.includes('order') ||
    q.includes('track') ||
    q.includes('parcel') ||
    q.includes('tracking') ||
    q.includes('mera parcel') ||
    q.includes('kahan pohncha') ||
    q.includes('kab milega') ||
    q.includes('status') ||
    q.includes('dispatch') ||
    q.includes('vl-') ||
    q.includes('ord-');

  // Check if previous assistant message asked for customer name/order id
  const lastAiMsg = [...chatHistory].reverse().find(m => m.sender === 'ai');
  const wasPromptedForOrderDetails =
    lastAiMsg &&
    (lastAiMsg.content.toLowerCase().includes('share your **full name**') ||
      lastAiMsg.content.toLowerCase().includes('order status') ||
      lastAiMsg.content.toLowerCase().includes('order id'));

  if (isOrderQuery || wasPromptedForOrderDetails) {
    const allOrders = db.getOrders();

    // Priority 1: If current user is logged in, find their orders directly!
    let matchingOrders: typeof allOrders = [];
    if (currentUser && currentUser.name && currentUser.name !== 'Guest Customer') {
      matchingOrders = db.findOrdersByUser(currentUser);
    }

    // Priority 2: If no direct user orders found or guest, search by query
    if (matchingOrders.length === 0) {
      matchingOrders = db.findOrdersByCustomer(rawQuery);
    }

    if (matchingOrders.length > 0) {
      const order = matchingOrders[0];
      const statusMap: Record<string, { label: string; icon: string; desc: string }> = {
        pending: { label: 'Order Confirmed', icon: '⏳', desc: 'Order received and queued for processing.' },
        processing: { label: 'Processing & Patterning', icon: '📋', desc: 'Textile cut and prepared for embroidery.' },
        in_embroidery: { label: 'In High-Density Tatami Embroidery', icon: '🧵', desc: 'Being meticulously embroidered (85,000+ stitches) in our Lahore studio.' },
        shipped: { label: 'Dispatched / In Transit', icon: '📦', desc: `Handed over to ${order.courier || 'PostEx'}. On the way to ${order.city || 'your destination'}.` },
        out_for_delivery: { label: 'Out for Delivery Today', icon: '🚚', desc: `Rider is out for delivery in ${order.city || 'your area'}. Please keep exact cash ready if COD.` },
        delivered: { label: 'Delivered', icon: '✅', desc: 'Parcel successfully delivered.' },
        cancelled: { label: 'Cancelled', icon: '❌', desc: 'This order was cancelled.' },
      };

      const st = statusMap[order.status] || { label: order.status, icon: '📦', desc: 'Order is progressing.' };

      return {
        replyText: `📦 **Live Order Status: ${order.orderNumber}**\n\n` +
          `Hey **${currentUser?.name || order.customerName}**, here is your latest parcel tracking update:\n\n` +
          `• **Status:** ${st.icon} **${st.label}**\n` +
          `• **Progress Note:** ${order.notes || st.desc}\n` +
          `• **Items:** ${order.items.map(it => `${it.title} (Qty: ${it.quantity}${it.size ? `, Size: ${it.size}` : ''})`).join(', ')}\n` +
          `• **Total Price:** Rs. ${order.totalPrice.toLocaleString()} (${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'})\n` +
          `• **Shipping Address:** ${order.shippingAddress}, ${order.city || 'Pakistan'}\n` +
          `• **Courier & Tracking:** ${order.courier || 'PostEx'} — **${order.trackingNumber || 'Tracking ID in generation'}**\n\n` +
          `Let me know if you need to update any delivery instructions or styling advice!`,
        recommendedProductIds: order.items.map(i => i.productId).filter(Boolean) as string[],
        escalateToHuman: false,
        mode,
      };
    }

    // If user is authenticated but has no orders in system yet
    if (currentUser && currentUser.name && currentUser.name !== 'Guest Customer') {
      return {
        replyText: `Hey **${currentUser.name}**! 👋\n\nI checked your registered account (**${currentUser.email}** / **${currentUser.phone || ''}**), but there is currently no active order placed under your profile.\n\nWould you like me to show you our latest heavyweight drop (Spider-Man & Toji embroidered tees) or check an order placed with another phone number or Order ID (e.g. #VL-1001)?`,
        recommendedProductIds: products.slice(0, 2).map(p => p.id),
        escalateToHuman: false,
        mode,
      };
    }

    // If query contains a name/id pattern or is short response to order prompt
    const cleanedQuery = rawQuery.replace(/my name is|i am|name is|mera naam/gi, '').trim();
    if (wasPromptedForOrderDetails && cleanedQuery.length >= 2) {
      // Try searching with cleaned query
      const secondaryMatches = db.findOrdersByCustomer(cleanedQuery);
      if (secondaryMatches.length > 0) {
        const order = secondaryMatches[0];
        return {
          replyText: `📦 **Found your order, ${order.customerName}! (${order.orderNumber})**\n\n` +
            `• **Status:** **${order.status.replace(/_/g, ' ').toUpperCase()}**\n` +
            `• **Items Ordered:** ${order.items.map(it => `${it.title}${it.size ? ` (Size: ${it.size})` : ''}`).join(', ')}\n` +
            `• **Total Amount:** Rs. ${order.totalPrice.toLocaleString()} (${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid'})\n` +
            `• **Courier Partner:** ${order.courier || 'PostEx'} (Tracking: **${order.trackingNumber || 'In transit'}**)\n` +
            `• **Shipping To:** ${order.shippingAddress}, ${order.city || 'Pakistan'}\n\n` +
            `${order.notes ? `*Update note: ${order.notes}*\n\n` : ''}` +
            `Is there anything else I can assist you with regarding this order?`,
          recommendedProductIds: order.items.map(i => i.productId).filter(Boolean) as string[],
          escalateToHuman: false,
          mode,
        };
      } else {
        return {
          replyText: `I checked our system, but couldn't find an active order under "**${cleanedQuery}**". 🧐\n\nCould you please double-check the spelling, or provide the **Phone Number** or **5-digit Order ID** (e.g. #VL-1001) used at checkout?`,
          recommendedProductIds: [],
          escalateToHuman: false,
          mode,
        };
      }
    }

    // Default Order Prompt asking for customer name / phone / ID
    return {
      replyText: `I'd be glad to check your order status! 😊\n\nCould you please share your **Full Name**, **Phone Number**, or **Order ID** (e.g. #VL-1001) so I can pull up your exact parcel details?`,
      recommendedProductIds: [],
      escalateToHuman: false,
      mode,
    };
  }

  // 2. Chat between Gemini and Jenny / Jenny persona request
  if (
    mode === 'duo' ||
    q.includes('jenny') ||
    q.includes('chat between') ||
    q.includes('gemini and jenny') ||
    q.includes('duo') ||
    q.includes('stylist')
  ) {
    const featured = products.slice(0, 3);
    const topProd = featured[0] || { title: 'Heavyweight Embroidered Streetwear Tee', price: 3499, id: 'prod-1' };
    return {
      replyText: `**Jenny (Lead Stylist):**
"Hey! So thrilled you asked! I love styling our oversized heavy-knit pieces. If you're going for an effortless streetwear silhouette, our **${topProd.title}** paired with relaxed dark cargo pants and chunky sneakers is an absolute 10/10 fit."

**Gemini (Technical Concierge):**
"To add to Jenny's recommendation, that piece is crafted from 240 GSM luxury compact combed cotton with over 90,000 stitches of Japanese Tatami embroidery. Delivery to Lahore is 1–2 days (Next-day available), and 2–5 days nationwide across Pakistan with Cash on Delivery (COD)!"`,
      recommendedProductIds: featured.map(p => p.id),
      escalateToHuman: false,
      mode: 'duo',
    };
  }

  // 3. Brand Owner / Founders / About Brand
  if (
    q.includes('owner') ||
    q.includes('who is the brand') ||
    q.includes('who owns') ||
    q.includes('who made') ||
    q.includes('founder') ||
    q.includes('ceo') ||
    q.includes('lab11') ||
    q.includes('about vertex') ||
    q.includes('malik') ||
    q.includes('kiska brand')
  ) {
    return {
      replyText:
        `✨ **About Vertex Lab & Lab11 Studio:**\n\nVertex Lab was founded by an independent creative collective of apparel designers and master textile craftsmen based in **Lahore, Pakistan**.\n\nOur mission was born out of a desire to create authentic, architectural streetwear locally—combining **240–280 GSM heavyweight cotton**, custom bio-washes, and precision **Japanese Tatami embroidery (85,000+ stitches)** inspired by anime legends, Renaissance masterpieces, and cyberpunk aesthetics. Every drop is crafted with bespoke attention to detail right here in Pakistan!`,
      recommendedProductIds: products.slice(0, 3).map(p => p.id),
      escalateToHuman: false,
      mode,
    };
  }

  // 4. Greetings & Natural Small Talk (How are you / Hello)
  if (
    q === 'hello' ||
    q === 'hi' ||
    q === 'hey' ||
    q.includes('how are you') ||
    q.includes('kese ho') ||
    q.includes('kaisa hai') ||
    q.includes("what's up") ||
    q.includes('whats up') ||
    q.includes('salam') ||
    q.includes('assalam') ||
    q.includes('good morning') ||
    q.includes('good evening')
  ) {
    const greetings = [
      `Hey there! I'm doing great, thanks for asking! 😊 I'm here to help you with anything from styling advice, sizing on our oversized drops, checking your order status, to tracking delivery times across Pakistan. What can I do for you today?`,
      `Walaikum Assalam! Doing wonderfully! Welcome to ${settings.brandName}. Are you looking for a specific anime drop, checking an existing order status, or do you have a question about delivery in your city?`,
      `Hey! Great to connect with you! Everything is running smoothly at the studio. Looking to check out our latest heavyweight embroidered streetwear drops, track an order, or need help picking your size?`,
    ];
    const chosenGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    return {
      replyText: chosenGreeting,
      recommendedProductIds: products.slice(0, 2).map(p => p.id),
      escalateToHuman: false,
      mode,
    };
  }

  // 5. Dynamic Product Matching (Using live catalog)
  // Check if query matches any product in live catalog
  const matchingProducts = products.filter(p => {
    const titleLower = p.title.toLowerCase();
    const descLower = p.description.toLowerCase();
    const catLower = p.category.toLowerCase();
    const idLower = p.id.toLowerCase();
    const searchTerms = q.split(' ').filter(t => t.length > 2);

    return (
      titleLower.includes(q) ||
      descLower.includes(q) ||
      catLower.includes(q) ||
      idLower.includes(q) ||
      searchTerms.some(term => titleLower.includes(term) || catLower.includes(term))
    );
  });

  if (matchingProducts.length > 0) {
    const top = matchingProducts[0];
    const priceText = top.salePrice
      ? `Rs. ${top.salePrice.toLocaleString()} (Regular: Rs. ${top.price.toLocaleString()})`
      : `Rs. ${top.price.toLocaleString()}`;

    return {
      replyText: `✨ Check out our **${top.title}** (${priceText}).\n\n${top.description}\n\n• **Sizes Available:** ${top.sizes.join(', ')}\n• **Availability:** ${top.inStock ? 'In Stock (Ready to dispatch)' : 'Out of Stock'}\n• **Direct Link:** [View Product](${top.productUrl || settings.websiteUrl || '#'})`,
      recommendedProductIds: matchingProducts.slice(0, 4).map(p => p.id),
      escalateToHuman: false,
      mode,
    };
  }

  // 6. Delivery & Shipping
  if (
    q.includes('delivery') ||
    q.includes('shipping') ||
    q.includes('time') ||
    q.includes('kab tak') ||
    q.includes('kitne din') ||
    q.includes('lahore') ||
    q.includes('karachi') ||
    q.includes('islamabad')
  ) {
    const isLahore = q.includes('lahore');
    return {
      replyText: `📦 **Delivery Timelines & Shipping Rates Across Pakistan:**\n\n• **Order Processing**: 4 working days for hand-finished embroidery & strict QC.\n• **Transit Time**: ${
        isLahore
          ? 'Next-Day Delivery in Lahore (1–2 working days via PostEx)'
          : '2–5 working days nationwide (Karachi, Islamabad, Rawalpindi, Peshawar, Multan, etc.)'
      }.\n• **Shipping Fee**: Flat Rs. 200 nationwide.\n• 🎉 **FREE Delivery**: Automatically applied on all orders above **Rs. 4,999**!\n• **Payment**: Cash on Delivery (COD) & Online Cards accepted.`,
      recommendedProductIds: [],
      escalateToHuman: false,
      mode,
    };
  }

  // 7. Return, Refund & Damaged Item Replacement
  if (
    q.includes('return') ||
    q.includes('exchange') ||
    q.includes('replace') ||
    q.includes('refund') ||
    q.includes('wapis') ||
    q.includes('badal') ||
    q.includes('damage') ||
    q.includes('defect')
  ) {
    if (q.includes('damage') || q.includes('defect') || q.includes('kharab') || q.includes('broken') || q.includes('torn') || q.includes('wrong')) {
      return {
        replyText:
          '⚠️ **Damaged / Defective / Incorrect Item Replacement:**\n\nIf you received a damaged, defective, or incorrect article, we provide a **100% FREE Replacement** with zero courier fees!\n\n• **Steps to Claim**: Please share your **Order ID** and clear photos/videos of the defect right here or on WhatsApp (+92 300 8378391) within 7 days of delivery.\n• **Resolution**: We will immediately arrange a complimentary reverse courier pickup and dispatch a brand new replacement at no extra charge.',
        recommendedProductIds: [],
        escalateToHuman: true,
        escalationReason: 'Customer reported damaged or defective item.',
        mode,
      };
    }

    return {
      replyText:
        '🛡️ **Vertex Lab Return & Damaged Item Policy:**\n\n• **Strict No-Return Policy**: We operate a strict NO RETURN and NO REFUND policy for change of mind or personal preference due to our bespoke made-to-order Japanese tatami embroidery craftsmanship.\n• **Exceptions for Damaged / Defective Items**: We offer **100% FREE Replacements** ONLY if the item received is damaged, defective (fabric flaw, stitching fault, stain upon arrival), or incorrect.\n• **How to Report**: Claims must be submitted within 7 days of delivery with photo/video proof via this chat or WhatsApp.',
      recommendedProductIds: [],
      escalateToHuman: false,
      mode,
    };
  }

  // 8. Sizing & Fit
  if (q.includes('size') || q.includes('sizing') || q.includes('fit') || q.includes('chota') || q.includes('bada') || q.includes('chart')) {
    return {
      replyText:
        '📏 **Sizing & Fit Guide:**\n\nOur articles feature an intentional **relaxed oversized streetwear fit** with dropped shoulders. Available in sizes **S, M, L, XL, and XXL**.\n\n• **For an authentic oversized boxy drape**: Choose your standard true size.\n• **For a tailored / fitted look**: Size down one step.\n• Tell me your height and weight, and I can give you an exact personalized size recommendation!',
      recommendedProductIds: [],
      escalateToHuman: false,
      mode,
    };
  }

  // 9. Natural default response (Grounded & helpful)
  return {
    replyText: `I'd love to help you with that! Whether you're exploring our anime embroidery drops, need personalized sizing advice for an oversized fit, or want to check delivery times to your city, let me know what you'd like to see! Here are some of our community favorite pieces:`,
    recommendedProductIds: ['prod-spiderman', 'prod-toji', 'prod-goku', 'prod-starry-night'],
    escalateToHuman: false,
    mode,
  };
}

