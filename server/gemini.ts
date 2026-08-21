import { GoogleGenAI, Type } from '@google/genai';
import { puter } from '@heyputer/puter.js';
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
}

const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

export async function generateAICustomerCareResponse(
  conversationId: string,
  userMessage: string,
  chatHistory: Message[]
): Promise<AIChatResponse> {
  const activeProducts = db.getProducts().filter(p => !p.isHiddenFromAi && !p.isDisabled);
  const activeFaqs = db.getFaqs().filter(f => f.isActive);
  const knowledgeDocs = db.getKnowledgeDocs();
  const websiteSettings = db.getWebsiteSettings();
  const aiSettings = db.getAiSettings();

  // Format products list for prompt
  const productCatalogText = activeProducts
    .map(
      p => `ID: ${p.id}
Title: ${p.title}
Category: ${p.category}
Price: Rs. ${p.price}${p.salePrice ? ` (Sale Price: Rs. ${p.salePrice})` : ''}
Available Sizes: ${p.sizes.join(', ')}
In Stock: ${p.inStock ? 'YES' : 'OUT OF STOCK'} (Stock: ${p.stockCount || 'Available'})
SKU: ${p.sku || 'N/A'}
Description: ${p.description}
URL: ${p.productUrl}
Image: ${p.imageUrl}`
    )
    .join('\n---\n');

  // Format FAQs
  const faqText = activeFaqs.map(f => `[${f.category}] Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

  // Format Knowledge base
  const kbText = knowledgeDocs.map(k => `[${k.title} (${k.category})]\n${k.content}`).join('\n\n');

  // Build system prompt
  const systemPrompt = `You are "${aiSettings.aiName}", the dedicated AI Customer Care & Styling Specialist for "${websiteSettings.brandName}" (premium Pakistani heavyweight embroidered streetwear brand).

YOUR COMPREHENSIVE TRAINING & STRICT DIRECTIVES:

1. DATA ACCURACY & REAL CATALOG:
   - Use ONLY the provided product catalog, FAQs, and Knowledge Base below.
   - NEVER invent fictional products, unlisted prices, unlisted sizes, unverified discounts, or unverified courier policies.
   - All prices are strictly in Pakistani Rupees (PKR / Rs.).
   - If a customer asks about a product, price, or policy not in the database, honestly inform them that it is not currently in the catalog and offer to check with the human team or WhatsApp support (+92 300 8378391).

2. PRODUCT RECOMMENDATIONS & INTERACTIVE CARDS:
   - When customers ask for clothing, anime designs (Spider-Man, Toji Zen'in, Goku, Kokushibo, Batman), Renaissance art (Starry Night, Creation of Adam, Mona Lisa), hoodies, budget picks (e.g., "under 2500", "under 3500"), or best sellers, you MUST return matching product IDs in the "recommendedProductIds" array.
   - In your conversational text, highlight key specifications: 240–280 GSM luxury combed compact cotton, 85,000–100,000 high-density Japanese Tatami stitch count, drop-shoulder boxy streetwear drape, and available sizes (S, M, L, XL, XXL).

3. SIZING & FIT RECOMMENDATION ENGINE:
   - All Vertex Lab apparel features an intentional relaxed oversized streetwear cut with dropped shoulders.
   - General rule: Choose regular size for an oversized boxy streetwear drape; size down 1 size for a standard fitted silhouette.
   - Height / Weight guidance:
     * 5'4" to 5'7" (50–65 kg) -> Size Small (S) or Medium (M for oversized)
     * 5'8" to 5'10" (65–78 kg) -> Size Medium (M) or Large (L for oversized)
     * 5'11" to 6'1" (78–90 kg) -> Size Large (L) or Extra Large (XL for oversized)
     * 6'2"+ or 90kg+ -> Size XL or XXL

4. PAKISTAN NATIONWIDE SHIPPING & DELIVERY RULES:
   - Production / Processing: 4 working days for precision Tatami embroidery & hand-finished quality control.
   - Lahore City Delivery: 1–2 working days (Next-day delivery available) via PostEx.
   - Nationwide Delivery: 2–5 working days across Karachi, Islamabad, Rawalpindi, Peshawar, Faisalabad, Multan, Sialkot, Quetta, Gujranwala, Hyderabad, Abbottabad, and 200+ cities.
   - Shipping Rate: Flat Rs. 200 nationwide.
   - FREE Shipping Threshold: 100% Free Nationwide Delivery on all orders above Rs. 4,999!
   - Payment Options: Cash on Delivery (COD), Visa/MasterCard Credit/Debit Cards, Direct Bank Transfer (Meezan/HBL/Nayapay/Sadapay), and JazzCash/EasyPaisa.

5. STRICT NO-RETURN & 100% FREE DAMAGED ITEM REPLACEMENT:
   - Strict Policy: Due to made-to-order bespoke Japanese embroidery craftsmanship, Vertex Lab operates a strict NO RETURN and NO REFUND policy for change of mind or personal preference.
   - Damaged / Defective / Incorrect Article Exception: We provide a 100% FREE REPLACEMENT with zero courier charges if an item arrives damaged, torn, stained, defective in embroidery, or if an incorrect item was delivered.
   - How Customers Claim: Report within 7 days of parcel delivery with clear photo or video proof via this chat or WhatsApp (+92 300 8378391). Vertex Lab arranges free reverse courier pickup and dispatches a brand new article.

6. WASHING & GARMENT CARE:
   - Machine wash cold (below 30°C) inside out on gentle cycle.
   - Wash with similar dark colors; avoid bleach or harsh fabric softeners.
   - Do NOT iron directly on the embroidery threadwork; iron on the reverse side.
   - Hang dry in shade to preserve cotton density and thread luster.

7. MULTILINGUAL MASTERY (English & Natural Roman Urdu / Urdu):
   - If the customer asks in Roman Urdu (e.g. "kya delivery free hai?", "size chart batao", "lahore me kitne din lagenge?", "kharab kapra aya hai wapis hoga?", "toji wali tee kitne ki hai?"), reply in fluent, polite, courteous Roman Urdu or English matching their tone.
   - Keep answers clear, punchy, well-formatted, and helpful. Avoid overly verbose walls of text.

8. HUMAN ESCALATION RULES:
   - If the customer reports a damaged/wrong product, expresses strong frustration, asks for human support ("talk to agent", "call me", "human please", "representative"), or has a custom issue, set "escalateToHuman": true.
   - Assure them warmly that the human care team is notified and will follow up immediately.

CURRENT ACTIVE PRODUCT CATALOG:
${productCatalogText}

ACTIVE FAQS:
${faqText}

BRAND KNOWLEDGE BASE & POLICIES:
${kbText}

CONTACT & STORE INFO:
- Brand Name: ${websiteSettings.brandName}
- WhatsApp: ${websiteSettings.whatsappNumber}
- Email: ${websiteSettings.contactEmail}
- Business Hours: ${websiteSettings.businessHours}
- Delivery Standard: 4 working days processing + 1-2 days Lahore / 2-5 days nationwide (Rs. 200 fee, Free above Rs. 4,999).
- Return Policy: Strict No Return / No Refund policy for change of mind. 100% FREE replacement only if the item received is damaged or defective.`;

  // Format conversation history
  const recentHistory = chatHistory.slice(-8).map(m => ({
    role: m.sender === 'customer' ? 'user' : 'assistant',
    content: m.content,
  }));

  // 1. Try Puter.js for free Gemini access (no API keys required)
  try {
    const puterMessages = [
      {
        role: 'system',
        content: `${systemPrompt}\n\nIMPORTANT: Respond with a JSON object in this exact format:
{
  "replyText": "Your friendly, comprehensive reply in English or Roman Urdu matching the user",
  "recommendedProductIds": ["prod-id-1", "prod-id-2"],
  "escalateToHuman": false,
  "escalationReason": ""
}`,
      },
      ...recentHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const puterModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gpt-4o-mini'];
    for (const model of puterModels) {
      try {
        const puterResponse: any = await puter.ai.chat(puterMessages as any, { model });
        const textOutput = typeof puterResponse === 'string'
          ? puterResponse
          : (puterResponse?.message?.content || puterResponse?.text || JSON.stringify(puterResponse));

        if (textOutput && textOutput.trim().length > 0) {
          const cleanText = textOutput.replace(/```json\n?|```/g, '').trim();
          try {
            const parsed = JSON.parse(cleanText);
            if (parsed.replyText) {
              return {
                replyText: parsed.replyText,
                recommendedProductIds: Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [],
                escalateToHuman: Boolean(parsed.escalateToHuman),
                escalationReason: parsed.escalationReason,
              };
            }
          } catch {
            return {
              replyText: cleanText,
              recommendedProductIds: [],
              escalateToHuman: false,
            };
          }
        }
      } catch (puterErr) {
        console.warn(`Puter AI attempt with model ${model} failed, trying next:`, puterErr);
      }
    }
  } catch (outerPuterErr) {
    console.warn('Puter.js execution notice:', outerPuterErr);
  }

  // 2. Try Google GenAI client if configured
  const ai = getGenAI();

  if (ai) {
    const contents = [
      ...chatHistory.slice(-8).map(h => ({
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
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          replyText: {
            type: Type.STRING,
            description: 'The polished, helpful response to the customer.',
          },
          recommendedProductIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'List of matching Product IDs from the catalog to render as visual ecommerce cards.',
          },
          escalateToHuman: {
            type: Type.BOOLEAN,
            description: 'True if the customer requested a human or has an unresolved complaint/special case.',
          },
          escalationReason: {
            type: Type.STRING,
            description: 'Brief internal reason if escalated.',
          },
        },
        required: ['replyText', 'recommendedProductIds', 'escalateToHuman'],
      },
    };

    // Try models in sequence with resilience
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        const responseText = response.text?.trim() || '{}';
        try {
          const parsed = JSON.parse(responseText);
          return {
            replyText: parsed.replyText || "I'm here to assist you with Vertex Lab collections and orders.",
            recommendedProductIds: Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [],
            escalateToHuman: Boolean(parsed.escalateToHuman),
            escalationReason: parsed.escalationReason,
          };
        } catch {
          return {
            replyText: responseText.replace(/```json|```/g, '').trim(),
            recommendedProductIds: [],
            escalateToHuman: false,
          };
        }
      } catch (err: any) {
        const isUnavailableOrRateLimit =
          err?.status === 'UNAVAILABLE' ||
          err?.code === 503 ||
          err?.status === 503 ||
          err?.code === 429 ||
          err?.status === 429 ||
          (err?.message && (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('RESOURCE_EXHAUSTED')));

        if (isUnavailableOrRateLimit) {
          continue;
        } else {
          break;
        }
      }
    }
  }

  // 3. Intelligent fallback engine grounded on active database
  return generateGroundedFallbackResponse(userMessage, activeProducts, activeFaqs, websiteSettings);
}

function generateGroundedFallbackResponse(
  query: string,
  products: Product[],
  faqs: any[],
  settings: any
): AIChatResponse {
  const q = query.toLowerCase();

  // Check for human agent request or complaint
  if (
    q.includes('human') ||
    q.includes('agent') ||
    q.includes('representative') ||
    q.includes('complaint') ||
    q.includes('broken') ||
    q.includes('damaged') ||
    q.includes('defect') ||
    q.includes('wrong') ||
    q.includes('kharab') ||
    q.includes('banda') ||
    q.includes('insan') ||
    q.includes('call')
  ) {
    return {
      replyText:
        "I've escalated your conversation to the Vertex Lab human care team. An agent is reviewing your message and will respond right away. You can also reach our live support directly on WhatsApp at " +
        settings.whatsappNumber +
        ' (Mon–Sat 10 AM to 9 PM PKT).',
      recommendedProductIds: [],
      escalateToHuman: true,
      escalationReason: 'Customer requested human support or reported an issue.',
    };
  }

  // Anime / Specific Designs: Spider-Man, Toji, Goku, Kokushibo, Batman
  if (q.includes('spider') || q.includes('spiderman') || q.includes('miles') || q.includes('marvel')) {
    const spider = products.filter(p => p.id === 'prod-spiderman' || p.title.toLowerCase().includes('spider'));
    return {
      replyText:
        '🕷️ Check out our **SPIDER-MAN: Into The Spider-Verse Embroidered Graphic Tee** (Rs. 2,399, Sale: Rs. 2,199). Features 75,000 stitch count high-density chest embroidery on 260 GSM vintage washed cotton with an oversized boxy drape.',
      recommendedProductIds: spider.length > 0 ? spider.map(p => p.id) : ['prod-spiderman'],
      escalateToHuman: false,
    };
  }

  if (q.includes('toji') || q.includes('zenin') || q.includes('jujutsu') || q.includes('jjk')) {
    const toji = products.filter(p => p.id === 'prod-toji' || p.title.toLowerCase().includes('toji'));
    return {
      replyText:
        '⚔️ Here is our best-selling **TOJI ZEN\'IN Sorcerer Killer Embroidered Tee** (Rs. 2,599). Crafted on 280 GSM heavyweight washed cotton with inverted spear motif embroidery. Available in sizes S to XXL.',
      recommendedProductIds: toji.length > 0 ? toji.map(p => p.id) : ['prod-toji'],
      escalateToHuman: false,
    };
  }

  if (q.includes('goku') || q.includes('ultra instinct') || q.includes('dragon ball') || q.includes('dbs')) {
    const goku = products.filter(p => p.id === 'prod-goku' || p.title.toLowerCase().includes('goku'));
    return {
      replyText:
        '⚡ Here is our **GOKU Ultra Instinct Silver Aura Embroidered Tee** (Rs. 2,499). Detailed dual-thread silver aura embroidery on 260 GSM jet black cotton.',
      recommendedProductIds: goku.length > 0 ? goku.map(p => p.id) : ['prod-goku'],
      escalateToHuman: false,
    };
  }

  if (q.includes('kokushibo') || q.includes('demon slayer') || q.includes('blade') || q.includes('kimetsu')) {
    const kokushibo = products.filter(p => p.id === 'prod-kokushibo' || p.title.toLowerCase().includes('kokushibo'));
    return {
      replyText:
        '🌙 Check out the **BLADE OF KOKUSHIBO Moon Breathing Embroidered Tee** (Rs. 2,699, Sale: Rs. 2,299). Premium 280 GSM combed cotton with intricate six-eyed katana artwork.',
      recommendedProductIds: kokushibo.length > 0 ? kokushibo.map(p => p.id) : ['prod-kokushibo'],
      escalateToHuman: false,
    };
  }

  if (q.includes('batman') || q.includes('gotham') || q.includes('dark knight')) {
    const batman = products.filter(p => p.id === 'prod-batman' || p.title.toLowerCase().includes('batman'));
    return {
      replyText:
        '🦇 Check out the **BATMAN REQUIEM Dark Knight Heavyweight Embroidered Tee** (Rs. 2,450, Sale: Rs. 2,099). Features matte tonal embroidery on vintage charcoal cotton.',
      recommendedProductIds: batman.length > 0 ? batman.map(p => p.id) : ['prod-batman'],
      escalateToHuman: false,
    };
  }

  if (q.includes('starry night') || q.includes('van gogh') || q.includes('adam') || q.includes('michelangelo') || q.includes('mona lisa') || q.includes('art')) {
    const artTees = products.filter(p =>
      p.id === 'prod-starrynight' ||
      p.id === 'prod-adam' ||
      p.id === 'prod-monalisa' ||
      p.title.toLowerCase().includes('art') ||
      p.title.toLowerCase().includes('starry')
    );
    return {
      replyText:
        '🎨 Here are our **Renaissance & Fine Art Embroidered Streetwear Tees** featuring Van Gogh, Michelangelo, and Mona Lisa with detailed threadwork on heavy combed cotton:',
      recommendedProductIds: artTees.map(p => p.id),
      escalateToHuman: false,
    };
  }

  // Check for hoodies
  if (q.includes('hoodie') || q.includes('hoodies')) {
    const hoodies = products.filter(p => p.category.toLowerCase().includes('hoodie') || p.title.toLowerCase().includes('hoodie'));
    return {
      replyText:
        '🧥 Here are our **Vertex Lab Architectural 450 GSM Heavyweight French Terry Hoodies** (Rs. 4,999, Sale: Rs. 4,499). Built with ultra-heavy 450 GSM cotton, double-lined hood, and boxy streetwear drape. Qualifies for **FREE Nationwide Delivery**!',
      recommendedProductIds: hoodies.length > 0 ? hoodies.map(p => p.id) : ['prod-vertexhoodie'],
      escalateToHuman: false,
    };
  }

  // Price budget filter (e.g. under 2500 / under 3000)
  const priceMatch = q.match(/under\s+(?:rs\.?|pkr)?\s*(\d+)/i) || q.match(/(?:rs\.?|pkr)?\s*(\d+)\s*(?:se kam|under|budget)/i);
  if (priceMatch && priceMatch[1]) {
    const maxBudget = parseInt(priceMatch[1], 10);
    const affordable = products.filter(p => (p.salePrice || p.price) <= maxBudget);
    if (affordable.length > 0) {
      return {
        replyText: `Here are our Vertex Lab embroidered articles available under Rs. ${maxBudget}:`,
        recommendedProductIds: affordable.map(p => p.id),
        escalateToHuman: false,
      };
    } else {
      return {
        replyText: `Our embroidered graphic tees start at Rs. 2,099 on sale. Here are our most popular pieces under Rs. 2,500:`,
        recommendedProductIds: products.filter(p => (p.salePrice || p.price) <= 2400).map(p => p.id),
        escalateToHuman: false,
      };
    }
  }

  // General Tees inquiry
  if (q.includes('tee') || q.includes('t-shirt') || q.includes('shirt') || q.includes('collection') || q.includes('kapde')) {
    const tees = products.filter(p => p.category.toLowerCase().includes('shirt') || p.title.toLowerCase().includes('tee'));
    return {
      replyText: 'Check out our 240–280 GSM luxury combed cotton embroidered graphic tees featuring high-density anime and fine art designs:',
      recommendedProductIds: tees.map(p => p.id),
      escalateToHuman: false,
    };
  }

  // Shipping & Delivery inquiry (City specific: Lahore, Karachi, Islamabad, etc.)
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
      }.\n• **Shipping Fee**: Flat Rs. 200 nationwide.\n• 🎉 **FREE Delivery**: Automatically applied on all orders above **Rs. 4,999**!\n• Payment: Cash on Delivery (COD) & Online Cards accepted.`,
      recommendedProductIds: [],
      escalateToHuman: false,
    };
  }

  // Return, Refund & Damaged Item inquiry
  if (
    q.includes('return') ||
    q.includes('exchange') ||
    q.includes('replace') ||
    q.includes('refund') ||
    q.includes('wapis') ||
    q.includes('badal') ||
    q.includes('damage') ||
    q.includes('defect') ||
    q.includes('kharab')
  ) {
    if (q.includes('damage') || q.includes('defect') || q.includes('kharab') || q.includes('broken') || q.includes('torn') || q.includes('wrong')) {
      return {
        replyText:
          '⚠️ **Damaged / Defective / Incorrect Item Replacement:**\n\nIf you received a damaged, defective, or incorrect article, we provide a **100% FREE Replacement** with zero courier fees!\n\n• **Steps to Claim**: Please share your **Order ID** and clear photos/videos of the defect right here or on WhatsApp (+92 300 8378391) within 7 days of delivery.\n• **Resolution**: We will immediately arrange a complimentary reverse courier pickup and send you a brand new, flawless replacement at no extra charge.',
        recommendedProductIds: [],
        escalateToHuman: true,
        escalationReason: 'Customer reported damaged or defective item.',
      };
    }

    return {
      replyText:
        '🛡️ **Vertex Lab Return & Damaged Item Policy:**\n\n• **Strict No-Return Policy**: We operate a strict NO RETURN and NO REFUND policy for change of mind or personal preference due to our bespoke made-to-order Japanese tatami embroidery craftsmanship.\n• **Exceptions for Damaged / Defective Items**: We offer **100% FREE Replacements** ONLY if the item received is damaged, defective (fabric flaw, stitching fault, stain upon arrival), or incorrect.\n• **How to Report**: Claims must be submitted within 7 days of delivery with photo/video proof via this chat or WhatsApp.',
      recommendedProductIds: [],
      escalateToHuman: false,
    };
  }

  // Payment inquiry
  if (q.includes('payment') || q.includes('cod') || q.includes('cash on delivery') || q.includes('card') || q.includes('pese') || q.includes('jazzcash')) {
    return {
      replyText:
        '💳 **Accepted Payment Methods:**\n\n1. **Cash on Delivery (COD)** in 200+ cities across Pakistan.\n2. **Debit & Credit Cards** (Visa / MasterCard).\n3. **Direct Bank Transfer** & **JazzCash / EasyPaisa** for pre-paid instant orders.',
      recommendedProductIds: [],
      escalateToHuman: false,
    };
  }

  // Fabric & Quality inquiry
  if (q.includes('fabric') || q.includes('gsm') || q.includes('quality') || q.includes('embroidery') || q.includes('dhona') || q.includes('wash')) {
    return {
      replyText:
        '🧵 **Fabric & Craftsmanship Details:**\n\n• **T-Shirts**: 240–280 GSM 100% compact combed cotton with enzyme vintage washes.\n• **Hoodies**: 450 GSM ultra-heavy French Terry cotton with brushed fleece interior.\n• **Embroidery**: High-density Japanese thread embroidery up to 85,000 stitch count that never fades or peels over washes.\n• **Wash Care**: Machine wash cold inside out, iron on reverse of embroidery.',
      recommendedProductIds: [],
      escalateToHuman: false,
    };
  }

  // Sizing inquiry
  if (q.includes('size') || q.includes('sizing') || q.includes('fit') || q.includes('chota') || q.includes('bada') || q.includes('chart')) {
    return {
      replyText:
        '📏 **Sizing & Fit Guide:**\n\nOur articles feature an intentional **relaxed oversized streetwear fit** with dropped shoulders. Available in sizes **S, M, L, XL, and XXL**.\n\n• For an oversized boxy drape: Choose your standard size.\n• For a more fitted/tailored look: Size down one step.\n• If unsure, our 7-day size exchange has you completely covered!',
      recommendedProductIds: [],
      escalateToHuman: false,
    };
  }

  // Default response with top drop items
  return {
    replyText: `Hello! Welcome to ${settings.brandName}. I am your ${settings.aiName}. How can I assist you with our embroidered anime & art collections, delivery times, sizing, or 7-day exchanges today? Here are some of our top trending drops:`,
    recommendedProductIds: ['prod-spiderman', 'prod-toji', 'prod-goku', 'prod-starrynight'],
    escalateToHuman: false,
  };
}
