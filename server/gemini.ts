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
  assistantMode: 'gemini' | 'jenny' | 'duo' = 'gemini'
): Promise<AIChatResponse> {
  const activeProducts = db.getProducts().filter(p => !p.isHiddenFromAi && !p.isDisabled);
  const activeFaqs = db.getFaqs().filter(f => f.isActive);
  const knowledgeDocs = db.getKnowledgeDocs();
  const websiteSettings = db.getWebsiteSettings();
  const aiSettings = db.getAiSettings();

  // Format concise product catalog
  const productCatalogText = activeProducts
    .map(
      p => `• ID: "${p.id}" | "${p.title}" | Price: Rs. ${p.price}${p.salePrice ? ` (Sale: Rs. ${p.salePrice})` : ''} | Cat: ${p.category} | Sizes: ${p.sizes.join('/')} | ${p.inStock ? 'In Stock' : 'Out of Stock'}`
    )
    .join('\n');

  const faqText = activeFaqs.map(f => `[${f.category}] Q: ${f.question} -> A: ${f.answer}`).join('\n');
  const kbText = knowledgeDocs.map(k => `[${k.title}]\n${k.content}`).join('\n\n');

  // Build persona-specific system instruction
  let personaInstruction = '';
  if (assistantMode === 'jenny') {
    personaInstruction = `You are "Jenny", the Lead Streetwear Stylist & Aesthetic Curator for ${websiteSettings.brandName} (Lab11 Studio). 
Your vibe is warm, effortlessly chic, enthusiastic, and human. You talk like a real fashion-forward friend giving personalized outfit advice, aesthetic vibes, silhouette styling, and hype recommendations.`;
  } else if (assistantMode === 'duo') {
    personaInstruction = `You are simulating a lively, collaborative fashion & technical discussion between TWO specialists at ${websiteSettings.brandName} (Lab11 Studio):
1. **Jenny (Lead Stylist)**: Focuses on aesthetics, outfit curation, color coordination, and streetwear vibes.
2. **Gemini (Technical & Logistics Specialist)**: Focuses on 240-280 GSM fabric specs, Japanese Tatami stitch counts, sizing measurements, Lahore 1-2 days / Nationwide 2-5 days delivery, and 100% free damaged replacement.

Format your response clearly as a dialogue with speaker headers:
**Jenny (Stylist):** [Jenny's friendly styling advice & vibe]

**Gemini (Concierge):** [Gemini's specs, sizing fit, delivery timeline, or policy breakdown]`;
  } else {
    personaInstruction = `You are "${aiSettings.aiName}" (Lab11 Concierge), the dedicated AI Assistant & Streetwear Concierge for ${websiteSettings.brandName}.
You speak like a knowledgeable, polite, stylish human specialist from Lahore. Be conversational, natural, empathetic, and direct. Avoid generic corporate robotic replies.`;
  }

  const systemPrompt = `${personaInstruction}

BRAND IDENTITY & ORIGIN:
- Brand Name: ${websiteSettings.brandName} (Lab11 Studio / oblyvyon.com)
- Founders / Owners: Vertex Lab was founded by an independent creative collective of apparel designers and artisanal embroidery craftsmen based in Lahore, Pakistan. We design heavyweight architectural streetwear inspired by anime, Renaissance fine art, and contemporary subcultures.
- Craftsmanship: 240–280 GSM luxury compact combed cotton tees, 450 GSM French Terry hoodies, and 85,000–100,000 stitch high-density Japanese Tatami embroidery.
- Delivery: Lahore (1-2 days, next-day available via PostEx). Nationwide Pakistan (2-5 days across Karachi, Islamabad, Rawalpindi, Peshawar, Multan, Faisalabad, etc.). Flat Rs. 200 fee, FREE Shipping over Rs. 4,999.
- Return Policy: Strict No Return / No Refund for change of mind. 100% FREE REPLACEMENT if an item is damaged, defective, or incorrect within 7 days.
- Sizing: Relaxed oversized streetwear cut. True size for oversized drape, size down 1 for standard fitted look.
- WhatsApp: ${websiteSettings.whatsappNumber} | Email: ${websiteSettings.contactEmail}

CONVERSATION DIRECTIVES:
1. GREETINGS & SMALL TALK: If the user says "hello", "how are you", "what's up", or asks casual questions, answer warmly like a real human! Do NOT repeat a stiff generic introduction every time.
2. BRAND & OWNER QUESTIONS: If asked "Who is the brand owner?", "Who made Vertex Lab / Lab11?", "Where are you from?", explain our Lahore roots, independent designer collective, and passion for heavyweight embroidered apparel.
3. PRODUCT RECOMMENDATIONS: Always return matching Product IDs in "recommendedProductIds" when recommending items.
4. LANGUAGES: Seamlessly understand and reply in English or natural Roman Urdu (e.g. "kya delivery free hai?", "size guide bata do", "toji wali shirt dikhao").
5. ESCALATION: If the customer reports a damaged parcel or explicitly asks for a human agent, set "escalateToHuman": true.

CATALOG:
${productCatalogText}

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
  return generateGroundedFallbackResponse(userMessage, activeProducts, activeFaqs, websiteSettings, assistantMode);
}

function generateGroundedFallbackResponse(
  query: string,
  products: Product[],
  faqs: any[],
  settings: any,
  mode: 'gemini' | 'jenny' | 'duo' = 'gemini'
): AIChatResponse {
  const q = query.toLowerCase().trim();

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

  // 2. Chat between Gemini and Jenny / Jenny persona request
  if (
    mode === 'duo' ||
    q.includes('jenny') ||
    q.includes('chat between') ||
    q.includes('gemini and jenny') ||
    q.includes('duo') ||
    q.includes('stylist')
  ) {
    return {
      replyText: `**Jenny (Lead Stylist):**
"Hey! So thrilled you asked! I love styling our oversized heavy-knit pieces. If you're going for an effortless streetwear silhouette, our Spider-Man Brand New Day tee paired with relaxed dark cargo pants and chunky sneakers is an absolute 10/10 fit."

**Gemini (Technical Concierge):**
"To add to Jenny's recommendation, that piece is crafted from 240 GSM luxury compact combed cotton with over 90,000 stitches of Japanese Tatami embroidery. Delivery to Lahore is 1–2 days (Next-day available), and 2–5 days nationwide across Pakistan with Cash on Delivery (COD)!"`,
      recommendedProductIds: ['prod-spiderman', 'prod-toji', 'prod-vertexhoodie'],
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
      recommendedProductIds: ['prod-toji', 'prod-spiderman', 'prod-goku'],
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
      `Hey there! I'm doing great, thanks for asking! 😊 I'm here to help you with anything from styling advice, sizing on our oversized drops, to tracking delivery times across Pakistan. What can I do for you today?`,
      `Walaikum Assalam! Doing wonderfully! Welcome to ${settings.brandName}. Are you looking for a specific anime drop, styling recommendations, or do you have a question about delivery in your city?`,
      `Hey! Great to connect with you! Everything is running smoothly at the studio. Looking to check out our latest heavyweight embroidered streetwear drops or need help picking your size?`,
    ];
    const chosenGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    return {
      replyText: chosenGreeting,
      recommendedProductIds: ['prod-spiderman', 'prod-toji'],
      escalateToHuman: false,
      mode,
    };
  }

  // 5. Anime & Pop-Culture Designs
  if (q.includes('spider') || q.includes('spiderman') || q.includes('miles') || q.includes('marvel')) {
    const spider = products.filter(p => p.id.includes('spiderman') || p.title.toLowerCase().includes('spider'));
    return {
      replyText:
        '🕷️ Check out our best-selling **Spider-Man: Brand New Day Embroidered Heavyweight Tee** (Rs. 3,499 on sale). Features 90,000 stitch count Japanese Tatami embroidery on 240 GSM combed cotton with a signature boxy streetwear drape.',
      recommendedProductIds: spider.length > 0 ? spider.map(p => p.id) : ['prod-spiderman'],
      escalateToHuman: false,
      mode,
    };
  }

  if (q.includes('toji') || q.includes('zenin') || q.includes('jujutsu') || q.includes('jjk')) {
    const toji = products.filter(p => p.id.includes('toji') || p.title.toLowerCase().includes('toji'));
    return {
      replyText:
        "⚔️ Here is our iconic **TOJI: GHOST OF ZEN'IN Oversized Embroidered Tee** (Rs. 3,299). Vintage acid-washed heavy cotton with textured inverted spear Tatami embroidery. Available in sizes S to XL.",
      recommendedProductIds: toji.length > 0 ? toji.map(p => p.id) : ['prod-toji'],
      escalateToHuman: false,
      mode,
    };
  }

  if (q.includes('goku') || q.includes('ultra instinct') || q.includes('dragon ball') || q.includes('dbs')) {
    const goku = products.filter(p => p.id.includes('goku') || p.title.toLowerCase().includes('goku'));
    return {
      replyText:
        '⚡ Here is our **GOKU: ULTRA INSTINCT Metallic Thread Embroidery Tee** (Rs. 3,499). Detailed dual-thread silver metallic aura embroidery on 240 GSM jet black cotton.',
      recommendedProductIds: goku.length > 0 ? goku.map(p => p.id) : ['prod-goku'],
      escalateToHuman: false,
      mode,
    };
  }

  if (q.includes('kokushibo') || q.includes('demon slayer') || q.includes('kimetsu')) {
    const kokushibo = products.filter(p => p.id.includes('kokushibo') || p.title.toLowerCase().includes('kokushibo'));
    return {
      replyText:
        '🌙 Check out the **BLADE OF KOKUSHIBO Demon Slayer Embroidered Drop-Shoulder Tee** (Rs. 2,999). 12-color threadwork depicting Upper Moon One on 240 GSM heavy jersey cotton.',
      recommendedProductIds: kokushibo.length > 0 ? kokushibo.map(p => p.id) : ['prod-kokushibo'],
      escalateToHuman: false,
      mode,
    };
  }

  if (q.includes('batman') || q.includes('dark knight') || q.includes('gotham')) {
    const batman = products.filter(p => p.id.includes('batman') || p.title.toLowerCase().includes('batman'));
    return {
      replyText:
        '🦇 Check out the **BATMAN: REQUIEM Minimalist Dark Knight Embroidered Tee** (Rs. 2,299). Subtle noir aesthetic with high-precision chest emblem on 240 GSM combed cotton.',
      recommendedProductIds: batman.length > 0 ? batman.map(p => p.id) : ['prod-batman'],
      escalateToHuman: false,
      mode,
    };
  }

  if (q.includes('starry') || q.includes('van gogh') || q.includes('adam') || q.includes('michelangelo') || q.includes('mona lisa') || q.includes('art')) {
    const artTees = products.filter(p =>
      p.id.includes('starry') ||
      p.id.includes('adam') ||
      p.id.includes('monalisa') ||
      p.title.toLowerCase().includes('art')
    );
    return {
      replyText:
        '🎨 Here are our **Renaissance & Fine Art Embroidered Streetwear Tees** featuring Van Gogh, Michelangelo, and Mona Lisa with intricate micro-stitch threadwork on heavy cotton:',
      recommendedProductIds: artTees.map(p => p.id),
      escalateToHuman: false,
      mode,
    };
  }

  if (q.includes('hoodie') || q.includes('hoodies')) {
    const hoodies = products.filter(p => p.category.toLowerCase().includes('hoodie') || p.title.toLowerCase().includes('hoodie'));
    return {
      replyText:
        '🧥 Here are our **Vertex Architectural 450 GSM Heavyweight French Terry Hoodies** (Rs. 4,499 on sale). Built with ultra-heavy 450 GSM cotton, double-lined architectural hood, and relaxed boxy drape. Qualifies for **FREE Nationwide Delivery**!',
      recommendedProductIds: hoodies.length > 0 ? hoodies.map(p => p.id) : ['prod-vertexhoodie'],
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

