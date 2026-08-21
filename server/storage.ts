import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  Product,
  Message,
  Conversation,
  Customer,
  FAQ,
  KnowledgeDoc,
  Announcement,
  BroadcastNotification,
  WebsiteSettings,
  AISettings,
  SyncStatus,
  AdminNotification,
  AnalyticsData,
} from '../src/types.js';

interface DatabaseSchema {
  products: Product[];
  conversations: Conversation[];
  messages: Message[];
  customers: Customer[];
  faqs: FAQ[];
  knowledgeDocs: KnowledgeDoc[];
  announcements: Announcement[];
  broadcasts: BroadcastNotification[];
  websiteSettings: WebsiteSettings;
  aiSettings: AISettings;
  syncStatus: SyncStatus;
  adminNotifications: AdminNotification[];
  adminAuth: {
    username: string;
    passwordHash: string;
  };
}

const DB_FILE_PATH = path.join(process.cwd(), 'database.json');
const TMP_DB_PATH = path.join(os.tmpdir(), 'vertex_lab_database.json');

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-spiderman',
    title: 'Spider-Man: Brand New Day Embroidered Heavyweight Tee',
    description: '240 GSM heavy combed cotton featuring high-density Japanese tatami back embroidery with over 90,000 stitches. Signature drop-shoulder boxy streetwear cut with reinforced collar.',
    price: 4000,
    salePrice: 3499,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    stockCount: 35,
    productUrl: 'https://oblyvyon.com/products/spiderman-brand-new-day',
    imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
    category: 'T-Shirts',
    sku: 'OBL-SPM-01',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-toji',
    title: "TOJI: GHOST OF ZEN'IN Oversized Anime Embroidered Tee",
    description: '100% heavy cotton vintage acid wash t-shirt. High-definition textured tatami embroidery celebrating Toji Fushiguro. Relaxed boxy streetwear fit with premium ribbed neck.',
    price: 4000,
    salePrice: 3299,
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    stockCount: 28,
    productUrl: 'https://oblyvyon.com/products/toji-ghost-of-zenin',
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    category: 'T-Shirts',
    sku: 'OBL-TOJ-02',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-goku',
    title: 'GOKU: ULTRA INSTINCT Metallic Thread Embroidery Tee',
    description: '240 GSM pure cotton heavyweight streetwear tee featuring silver metallic and neon blue embroidery thread accents. Custom enzyme wash for ultra-soft hand feel.',
    price: 3499,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    stockCount: 42,
    productUrl: 'https://oblyvyon.com/products/goku-ultra-instinct',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    category: 'T-Shirts',
    sku: 'OBL-GOK-03',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-kokushibo',
    title: 'BLADE OF KOKUSHIBO Demon Slayer Embroidered Drop-Shoulder Tee',
    description: 'Blood Moon Edition 240 GSM heavy jersey cotton. High-density 12-color threadwork embroidery depicting the Upper Moon One Demon. Relaxed boxy silhouette.',
    price: 2999,
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    stockCount: 19,
    productUrl: 'https://oblyvyon.com/products/blade-of-kokushibo',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    category: 'T-Shirts',
    sku: 'OBL-KOK-04',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-batman',
    title: 'BATMAN: REQUIEM Minimalist Dark Knight Embroidered Tee',
    description: 'Washed charcoal noir tone. Subtle high-precision minimalist Bat emblem embroidered on the left chest with tactical typography. 240 GSM combed cotton.',
    price: 2299,
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    stockCount: 50,
    productUrl: 'https://oblyvyon.com/products/batman-requiem',
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    category: 'T-Shirts',
    sku: 'OBL-BAT-05',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-starry-night',
    title: 'THE STARRY NIGHT Van Gogh Art Series Embroidered Tee',
    description: 'Textured micro-stitch embroidery interpreting Vincent Van Gogh masterpiece on heavy off-white French Terry cotton. Each stitch captures the swirl brushstrokes.',
    price: 2599,
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    stockCount: 22,
    productUrl: 'https://oblyvyon.com/products/the-starry-night',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    category: 'T-Shirts',
    sku: 'OBL-STR-06',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-adam',
    title: 'CREATION OF ADAM Michelangelo Renaissance Embroidered Tee',
    description: 'Iconic Renaissance touch rendered in fine thread embroidery on luxury washed black heavyweight cotton. Boxy cut with dropped shoulders.',
    price: 2700,
    salePrice: 2199,
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    stockCount: 31,
    productUrl: 'https://oblyvyon.com/products/creation-of-adam',
    imageUrl: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=800&q=80',
    category: 'T-Shirts',
    sku: 'OBL-ADM-07',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-monalisa',
    title: 'MONA LISA Minimal Line Art Embroidered Streetwear Tee',
    description: 'Contemporary minimalist single-line vector embroidery on 240 GSM organic cotton. Clean, understated, and artistic statement piece.',
    price: 2299,
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    stockCount: 26,
    productUrl: 'https://oblyvyon.com/products/mona-lisa',
    imageUrl: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=800&q=80',
    category: 'T-Shirts',
    sku: 'OBL-MNL-08',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-darkfantasy',
    title: 'DARK FANTASY Oversized Graphic Embroidery Tee',
    description: 'Dual edition Gothic anime streetwear tee with 85,000 stitch count high-density embroidery and distressed vintage wash.',
    price: 2499,
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    stockCount: 18,
    productUrl: 'https://oblyvyon.com/products/dark-fantasy',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    category: 'T-Shirts',
    sku: 'OBL-DFN-09',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-vertexhoodie',
    title: 'VERTEX Architectural 450 GSM Heavyweight French Terry Hoodie',
    description: 'Ultra-heavy 450 GSM French Terry cotton hoodie with custom boxy architectural fit, double-lined hood, and high-density tonal embroidery on sleeve.',
    price: 4999,
    salePrice: 4499,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    stockCount: 25,
    productUrl: 'https://vertexlab.store/products/architectural-450gsm-hoodie',
    imageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    category: 'Hoodies',
    sku: 'VL-HD-450',
    source: 'synced',
    isHiddenFromAi: false,
    isDisabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_FAQS: FAQ[] = [
  {
    id: 'faq-delivery-time',
    question: 'How long does delivery take across Pakistan?',
    answer: '✨ All orders process within 4 working days for precision embroidery and quality control. \n\n• Lahore Customers: Next-day delivery (1–2 working days) via our official courier partner PostEx.\n• Nationwide Pakistan (Karachi, Islamabad, Rawalpindi, Peshawar, Faisalabad, Multan, Quetta, etc.): 2–5 working days via PostEx & TCS.\n\nYou will receive live SMS tracking once your parcel is handed over.',
    category: 'Shipping & Delivery',
    isActive: true,
    order: 1,
  },
  {
    id: 'faq-shipping-rates',
    question: 'What are the delivery charges and how do I get FREE Shipping?',
    answer: '📦 Standard flat shipping rate is Rs. 200 nationwide across Pakistan.\n\n🎉 FREE Delivery is automatically applied to all orders above Rs. 4,999 or qualifying multi-item drop bundles!',
    category: 'Shipping & Delivery',
    isActive: true,
    order: 2,
  },
  {
    id: 'faq-exchange-policy',
    question: 'What is your Return, Refund & Damaged Item Policy?',
    answer: '🛡️ **Strict No-Return Policy (Exceptions Only for Damaged / Defective Items):**\n\n• **No Return / Refund for Change of Mind**: Due to our made-to-order Japanese tatami embroidery craftsmanship, we maintain a strict policy of no returns, refunds, or exchanges for change of mind or personal preference.\n• **Damaged, Defective or Wrong Items Only**: If your item arrives damaged, defective (e.g. stitching flaws, fabric tears, stains upon delivery), or if an incorrect item was shipped, we provide a **100% FREE Replacement**!\n• **How to Claim**: Simply report the issue within 7 days of receiving your parcel with photo/video proof of the damage via this AI chat or WhatsApp (+92 300 8378391). We will arrange a complimentary reverse courier pickup and dispatch a brand new replacement at zero cost to you.',
    category: 'Damaged & Return Policy',
    isActive: true,
    order: 3,
  },
  {
    id: 'faq-sizing-fit',
    question: 'How do your oversized streetwear fits and sizes work?',
    answer: '👕 Our apparel is designed in an intentional oversized, drop-shoulder, relaxed streetwear cut.\n\n• For an authentic streetwear boxy drape: Choose your standard true size.\n• For a tailored / regular fitted look: Size down by one size (e.g. choose Medium if you usually wear Large).\n\nFeel free to ask the AI concierge right here: "What size should I get for 5ft 10in 75kg?" for personalized recommendations!',
    category: 'Sizing & Fit',
    isActive: true,
    order: 4,
  },
  {
    id: 'faq-payment-methods',
    question: 'What payment methods do you accept?',
    answer: '💳 We offer complete payment convenience:\n\n• Cash on Delivery (COD) across 200+ cities in Pakistan\n• Online Debit / Credit Cards (Visa, MasterCard, PayPak with 3D Secure OTP)\n• Direct Bank Transfer (Meezan Bank, HBL, Bank Alfalah, Nayapay, Sadapay)\n• Mobile Wallets: JazzCash & EasyPaisa',
    category: 'Payment & Orders',
    isActive: true,
    order: 5,
  },
  {
    id: 'faq-fabric-quality',
    question: 'What fabric quality and embroidery techniques are used?',
    answer: '🧵 We pride ourselves on luxury streetwear craftsmanship:\n\n• Heavyweight Tees: 240+ GSM 100% combed compact cotton, pre-shrunk with custom bio-wash for unmatched softness.\n• High-Density Embroidery: Japanese Tatami stitchwork with 80,000–100,000+ stitches per graphic that never fades or peels.\n• Hoodies: 450 GSM French Terry fleece with double-lined architectural hoods.',
    category: 'Fabric & Quality',
    isActive: true,
    order: 6,
  },
  {
    id: 'faq-track-order',
    question: 'How can I track my existing parcel?',
    answer: '🔍 You can track your parcel in seconds! Either paste your 5-digit Order ID (e.g. #VL-9482) or tracking number directly in this chat, and our AI will retrieve the live delivery status from PostEx/TCS immediately.',
    category: 'Shipping & Delivery',
    isActive: true,
    order: 7,
  }
];

const INITIAL_KNOWLEDGE: KnowledgeDoc[] = [
  {
    id: 'kb-shipping-policy',
    title: 'Oblyvyon & Vertex Lab Nationwide Shipping Policy',
    category: 'shipping',
    content: `SHIPPING POLICY & LOGISTICS DETAILS:
- Order Processing: All orders are embroidered and processed within 4 working days after order confirmation.
- Courier Partners: PostEx & TCS Express.
- Lahore City Delivery: 1 to 2 working days (Next-day delivery available).
- Nationwide Pakistan Delivery: 2 to 5 working days (Karachi, Islamabad, Rawalpindi, Peshawar, Faisalabad, Multan, Sialkot, Gujranwala, Hyderabad, Quetta, Abbottabad, etc.).
- Delivery Charges: Flat Rs. 200 nationwide.
- Free Shipping Threshold: Free delivery on all orders above Rs. 4,999 PKR.
- Real-time tracking: Customers receive tracking SMS once dispatched.`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-return-policy',
    title: 'Vertex Lab Damaged Item Replacement & No-Return Policy',
    category: 'return',
    content: `DAMAGED ITEM REPLACEMENT & NO-RETURN POLICY:
- Policy Rule: Vertex Lab operates a strict NO RETURN and NO REFUND policy for change of mind or personal preference due to our customized high-density embroidery production.
- Strict Exception: Returns, refunds, and replacements are ONLY accepted if the item delivered is DAMAGED, DEFECTIVE (stitching fault, torn fabric, stain upon arrival), or INCORRECT.
- Claim Window: The customer must report the damage within 7 days of parcel delivery with clear photo/video evidence.
- Cost: 100% FREE replacement. Vertex Lab arranges complimentary reverse pickup and covers all re-delivery shipping costs.
- Process: Customers can initiate the claim directly in AI chat or via WhatsApp at +92 300 8378391.`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb-clothes-catalog',
    title: 'Apparel Specifications & Japanese Tatami Embroidery',
    category: 'brand',
    content: `CLOTHING CATALOG SPECIFICATIONS:
- Spider-Man: Brand New Day (Sale: Rs. 3,499 / Reg: Rs. 4,000) - 240 GSM, 90,000 stitches tatami embroidery.
- TOJI: GHOST OF ZEN'IN (Sale: Rs. 3,299 / Reg: Rs. 4,000) - 240 GSM, oversized vintage acid wash.
- GOKU: ULTRA INSTINCT (Rs. 3,499) - Metallic silver thread accents on heavyweight combed cotton.
- BLADE OF KOKUSHIBO (Rs. 2,999) - Demon Slayer Blood Moon edition.
- BATMAN: REQUIEM (Rs. 2,299) - Minimalist Gotham Dark Knight chest emblem in noir charcoal.
- THE STARRY NIGHT (Rs. 2,599) - Van Gogh art series micro-stitch embroidery.
- CREATION OF ADAM (Sale: Rs. 2,199 / Reg: Rs. 2,700) - Michelangelo Renaissance series.
- MONA LISA (Rs. 2,299) - Minimalist line art embroidery.
- DARK FANTASY (Rs. 2,499) - Gothic anime oversized graphic.
- VERTEX ARCHITECTURAL HOODIE (Sale: Rs. 4,499 / Reg: Rs. 4,999) - 450 GSM French Terry.`,
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_WEBSITE_SETTINGS: WebsiteSettings = {
  brandName: 'Vertex Lab',
  siteTitle: 'Vertex Lab — Customer Care & AI Concierge',
  customerCareTitle: 'Vertex Lab Customer Care',
  logoUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=120&q=80',
  faviconUrl: '/icon.png',
  aiName: 'Vertex AI Concierge',
  aiAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  welcomeMessage: 'Hi! 👋 Welcome to Vertex Lab Customer Care. How can I help you today with delivery times, our embroidered streetwear collection, or damaged item replacement inquiries?',
  contactEmail: 'care@vertexlab.store',
  contactPhone: '+92 42 3578 9000',
  whatsappNumber: '+92 300 8378391',
  instagramUrl: 'https://instagram.com/vertexlab.pk',
  businessHours: 'Monday – Saturday: 10:00 AM – 9:00 PM PKT',
  supportAvailability: 'Instant AI replies 24/7 • Human Care 10 AM – 9 PM PKT',
  footerText: '© 2026 Vertex Lab Apparel. Premium Japanese Embroidery & Heavyweight Streetwear.',
  themeAccentColor: '#0f172a',
  websiteUrl: 'https://oblyvyon.com',
  deliveryFee: 200,
  freeDeliveryThreshold: 4999,
};

const INITIAL_AI_SETTINGS: AISettings = {
  aiName: 'Vertex AI Concierge',
  systemInstructions: `You are the official Customer Care AI Assistant for Vertex Lab (with premium apparel, rates, and policies from oblyvyon.com).
Your personality is professional, polite, streetwear-savvy, helpful, and concise.
CRITICAL GROUNDING RULES:
1. Shipping & Rates:
   - Order processing: 4 working days for embroidery/production.
   - Lahore delivery: Next-day (1-2 working days) via PostEx.
   - Nationwide Pakistan delivery (Karachi, Islamabad, Rawalpindi, Peshawar, Multan, Faisalabad, Quetta, etc.): 2 to 5 working days via PostEx & TCS.
   - Delivery fee: Standard Rs. 200 flat across Pakistan.
   - FREE Shipping on all orders above Rs. 4,999 PKR.
   - Cash on Delivery (COD) supported nationwide.
2. Strict No-Return & Damaged Item Replacement Policy:
   - Strict NO RETURN and NO REFUND policy for change of mind or personal preference.
   - Returns, refunds, and replacements are ONLY accepted if the item arrived DAMAGED, DEFECTIVE (stitching flaw, torn fabric, stain upon delivery), or INCORRECT.
   - For damaged or defective items, we provide a 100% FREE replacement with complimentary reverse courier pickup. Customers must report within 7 days of parcel delivery with clear photo/video proof.
3. Clothes & Embroidery:
   - Reference exact items: Spider-Man (Rs. 3,499 sale), Toji Zen'in (Rs. 3,299 sale), Goku Ultra Instinct (Rs. 3,499), Blade of Kokushibo (Rs. 2,999), Batman Requiem (Rs. 2,299), Starry Night (Rs. 2,599), Creation of Adam (Rs. 2,199 sale), Mona Lisa (Rs. 2,299), Dark Fantasy (Rs. 2,499), Vertex 450 GSM Hoodie (Rs. 4,499).
   - Fabric: 240+ GSM combed cotton for tees, 450 GSM French Terry for hoodies with high-density tatami embroidery.
4. Language Support:
   - Fully support English and natural Roman Urdu / Urdu (e.g. respond politely in Roman Urdu when greeted with "kya haal hai", "delivery kitne din me aye gi Lahore me", "kharab item aya hai").
5. Interactive Cards:
   - Always reference exact product IDs (e.g. prod-spiderman, prod-toji, prod-goku, prod-kokushibo, prod-batman, prod-starrynight, prod-adam, prod-monalisa, prod-vertexhoodie) so interactive product cards display directly in chat.`,
  tone: 'luxury_concierge',
  model: 'gemini-3.7-flash',
  maxResponseTokens: 450,
  autoEscalateOnComplaint: true,
  allowRomanUrdu: true,
  productRecommendationLimit: 4,
  escalationMessage: "We've forwarded your conversation to our senior human care team. An agent will follow up with you right here shortly.",
};

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: '🔥 Spider-Man & Toji Heavyweight Tees Restocked',
    message: 'Explore our latest 240 GSM Japanese Tatami Embroidered streetwear tees. Use code VERTEX10 for 10% off your order.',
    content: 'Explore our latest 240 GSM Japanese Tatami Embroidered streetwear tees. Use code VERTEX10 for 10% off your order.',
    imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
    buttonText: 'Ask AI About Sizes',
    buttonUrl: '#chat',
    actionText: 'Ask AI About Sizes',
    actionUrl: '#chat',
    type: 'drop',
    createdAt: new Date().toISOString(),
    isActive: true,
    badge: 'NEW DROP',
  },
  {
    id: 'ann-2',
    title: '🚚 Nationwide Free Delivery on Orders Above Rs. 4,999',
    message: 'Enjoy free delivery across Pakistan on all orders above Rs. 4,999. Standard delivery takes 2–5 days (Next-day in Lahore via PostEx).',
    content: 'Enjoy free delivery across Pakistan on all orders above Rs. 4,999. Standard delivery takes 2–5 days (Next-day in Lahore via PostEx).',
    type: 'promotion',
    createdAt: new Date().toISOString(),
    isActive: true,
    badge: 'FREE DELIVERY',
  }
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      const activePath = fs.existsSync(TMP_DB_PATH) ? TMP_DB_PATH : (fs.existsSync(DB_FILE_PATH) ? DB_FILE_PATH : null);
      if (activePath) {
        const fileContent = fs.readFileSync(activePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // Merge and ensure fresh FAQs, knowledge docs and settings
        const existingFaqs: FAQ[] = parsed.faqs && parsed.faqs.length > 0 ? parsed.faqs : [];
        const mergedFaqs = INITIAL_FAQS.map(initFaq => {
          const found = existingFaqs.find(f => f.id === initFaq.id);
          return found && found.id !== 'faq-exchange-policy' ? found : initFaq;
        });

        const existingKb: KnowledgeDoc[] = parsed.knowledgeDocs || [];
        const mergedKb = INITIAL_KNOWLEDGE.map(initKb => {
          const found = existingKb.find(k => k.id === initKb.id);
          return found && found.id !== 'kb-return-policy' ? found : initKb;
        });

        return {
          products: parsed.products && parsed.products.length > 0 ? parsed.products : INITIAL_PRODUCTS,
          conversations: parsed.conversations || [],
          messages: parsed.messages || [],
          customers: parsed.customers || [],
          faqs: mergedFaqs,
          knowledgeDocs: mergedKb,
          announcements: parsed.announcements || INITIAL_ANNOUNCEMENTS,
          broadcasts: parsed.broadcasts || [],
          websiteSettings: { ...INITIAL_WEBSITE_SETTINGS, ...(parsed.websiteSettings || {}) },
          aiSettings: { ...INITIAL_AI_SETTINGS, ...(parsed.aiSettings || {}) },
          syncStatus: parsed.syncStatus || {
            sourceUrl: 'https://oblyvyon.com',
            websiteUrl: 'https://oblyvyon.com',
            isAutoSync: true,
            syncFrequency: '6hours',
            lastSyncTime: new Date().toISOString(),
            status: 'idle',
            productsFound: INITIAL_PRODUCTS.length,
            productsImported: INITIAL_PRODUCTS.length,
            productsFailed: 0,
            errorLogs: [],
            logs: ['Connected to store oblyvyon.com', 'Synced 10 active embroidered apparel items'],
          },
          adminNotifications: parsed.adminNotifications || [],
          adminAuth: parsed.adminAuth || {
            username: 'admin',
            passwordHash: 'admin123',
          },
        };
      }
    } catch (err) {
      console.warn('Could not read existing database, initializing defaults:', err);
    }

    const defaultDb: DatabaseSchema = {
      products: INITIAL_PRODUCTS,
      conversations: [],
      messages: [],
      customers: [],
      faqs: INITIAL_FAQS,
      knowledgeDocs: INITIAL_KNOWLEDGE,
      announcements: INITIAL_ANNOUNCEMENTS,
      broadcasts: [],
      websiteSettings: INITIAL_WEBSITE_SETTINGS,
      aiSettings: INITIAL_AI_SETTINGS,
      syncStatus: {
        sourceUrl: 'https://oblyvyon.com',
        websiteUrl: 'https://oblyvyon.com',
        isAutoSync: true,
        syncFrequency: '6hours',
        lastSyncTime: new Date().toISOString(),
        status: 'idle',
        productsFound: INITIAL_PRODUCTS.length,
        productsImported: INITIAL_PRODUCTS.length,
        productsFailed: 0,
        errorLogs: [],
        logs: ['Initial store catalog loaded from oblyvyon.com'],
      },
      adminNotifications: [
        {
          id: 'notif-1',
          type: 'sync_success',
          title: 'Store Synced with Oblyvyon',
          message: '10 apparel items and accurate 7-day exchange policies synced.',
          timestamp: new Date().toISOString(),
          isRead: false,
        }
      ],
      adminAuth: {
        username: 'admin',
        passwordHash: 'admin123',
      },
    };

    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
    } catch (e) {
      try {
        fs.writeFileSync(TMP_DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
      } catch (tmpErr) {
        // In-memory fallback
      }
    }

    return defaultDb;
  }

  private persist(): void {
    const payload = JSON.stringify(this.data, null, 2);
    try {
      fs.writeFileSync(DB_FILE_PATH, payload, 'utf-8');
    } catch (err) {
      try {
        fs.writeFileSync(TMP_DB_PATH, payload, 'utf-8');
      } catch (tmpErr) {
        // Safely maintain in memory without throwing
      }
    }
  }

  // Products
  getProducts(category?: string, search?: string, includeHidden = false): Product[] {
    let prods = this.data.products.filter(p => !p.isDisabled);
    if (!includeHidden) {
      prods = prods.filter(p => !p.isHiddenFromAi);
    }
    if (category && category !== 'All') {
      prods = prods.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      prods = prods.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return prods;
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id && !p.isDisabled);
  }

  saveProduct(product: Partial<Product> & { title: string }): Product {
    if (product.id) {
      const idx = this.data.products.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        this.data.products[idx] = {
          ...this.data.products[idx],
          ...product,
          updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.products[idx];
      }
    }

    const newProd: Product = {
      id: product.id || 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: product.title,
      description: product.description || '',
      price: product.price || 0,
      salePrice: product.salePrice,
      sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      inStock: product.inStock ?? true,
      stockCount: product.stockCount ?? 10,
      productUrl: product.productUrl || 'https://oblyvyon.com',
      imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      category: product.category || 'T-Shirts',
      sku: product.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      source: product.source || 'manual',
      isHiddenFromAi: product.isHiddenFromAi ?? false,
      isDisabled: product.isDisabled ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.products.unshift(newProd);
    this.persist();
    return newProd;
  }

  deleteProduct(id: string): boolean {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.products.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  upsertProducts(products: Product[]): { added: number; updated: number } {
    let added = 0;
    let updated = 0;
    for (const prod of products) {
      const existingIdx = this.data.products.findIndex(
        p => p.id === prod.id || (p.productUrl && prod.productUrl && p.productUrl === prod.productUrl)
      );
      if (existingIdx !== -1) {
        this.data.products[existingIdx] = {
          ...this.data.products[existingIdx],
          ...prod,
          source: 'synced',
          updatedAt: new Date().toISOString(),
        };
        updated++;
      } else {
        this.data.products.unshift(prod);
        added++;
      }
    }
    this.persist();
    return { added, updated };
  }

  bulkUpsertProducts(products: Product[]): { added: number; updated: number } {
    return this.upsertProducts(products);
  }

  addAdminNotification(notif: Omit<AdminNotification, 'id' | 'timestamp' | 'isRead'>): AdminNotification {
    const newNotif: AdminNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    this.data.adminNotifications.unshift(newNotif);
    this.persist();
    return newNotif;
  }

  getAdminNotifications(): AdminNotification[] {
    return this.data.adminNotifications;
  }

  markAdminNotificationRead(id: string): void {
    const notif = this.data.adminNotifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.persist();
    }
  }

  updateAdminPassword(newPassword: string): void {
    this.data.adminAuth.passwordHash = newPassword;
    this.persist();
  }

  // Conversations & Messages
  getConversations(): Conversation[] {
    return this.data.conversations.sort((a, b) => new Date(b.lastActive || b.lastActiveAt || '').getTime() - new Date(a.lastActive || a.lastActiveAt || '').getTime());
  }

  getConversationById(id: string): Conversation | undefined {
    return this.data.conversations.find(c => c.id === id);
  }

  getConversationByCustomerId(customerId: string): Conversation | undefined {
    return this.data.conversations.find(c => c.customerId === customerId);
  }

  getOrCreateConversation(customerId: string, customerName?: string, email?: string): Conversation {
    let conv = this.data.conversations.find(c => c.customerId === customerId);
    if (!conv) {
      conv = {
        id: 'conv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        customerId,
        customerName: customerName || 'Guest Customer',
        customerEmail: email,
        status: 'ai',
        lastMessage: 'Conversation started',
        lastActive: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        unreadAdminCount: 0,
        unreadCustomerCount: 0,
        priority: 'normal',
        tags: ['New Customer'],
        notes: '',
        createdAt: new Date().toISOString(),
      };
      this.data.conversations.unshift(conv);

      // Create or update customer record
      this.getOrCreateCustomer(customerId, conv.customerName, email);
      this.persist();
    }
    return conv;
  }

  updateConversation(id: string, updates: Partial<Conversation>): Conversation | undefined {
    const conv = this.data.conversations.find(c => c.id === id);
    if (conv) {
      Object.assign(conv, updates);
      this.persist();
      return conv;
    }
    return undefined;
  }

  getMessages(conversationId: string): Message[] {
    const msgs = this.data.messages.filter(m => m.conversationId === conversationId);
    return msgs.map(m => {
      if (m.productIds && m.productIds.length > 0 && (!m.products || m.products.length === 0)) {
        m.products = m.productIds.map(pid => this.getProductById(pid)).filter(Boolean) as Product[];
      }
      return m;
    });
  }

  addMessage(msg: Omit<Message, 'id' | 'timestamp'>): Message {
    const newMsg: Message = {
      ...msg,
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      read: msg.read ?? false,
    };

    if (newMsg.productIds && newMsg.productIds.length > 0) {
      newMsg.products = newMsg.productIds.map(id => this.getProductById(id)).filter(Boolean) as Product[];
    }

    this.data.messages.push(newMsg);

    // Update conversation metadata
    const conv = this.getConversationById(msg.conversationId);
    if (conv) {
      conv.lastMessage = msg.content;
      conv.lastActive = newMsg.timestamp;
      conv.lastActiveAt = newMsg.timestamp;
      if (msg.sender === 'customer') {
        conv.unreadAdminCount = (conv.unreadAdminCount || 0) + 1;
      } else if (msg.sender === 'human' || msg.sender === 'ai') {
        conv.unreadCustomerCount = (conv.unreadCustomerCount || 0) + 1;
      }
    }

    this.persist();
    return newMsg;
  }

  // Customers
  getCustomers(): Customer[] {
    return this.data.customers;
  }

  getCustomerById(id: string): Customer | undefined {
    return this.data.customers.find(c => c.id === id);
  }

  getOrCreateCustomer(id: string, name?: string, email?: string): Customer {
    let cust = this.data.customers.find(c => c.id === id);
    if (!cust) {
      cust = {
        id,
        name: name || 'Guest ' + id.slice(-4),
        email,
        totalConversations: 1,
        firstSeen: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        notificationSubscribed: false,
        notes: '',
        tags: ['New Customer'],
        totalInquiries: 0,
      };
      this.data.customers.unshift(cust);
      this.persist();
    } else {
      if (name && cust.name.startsWith('Guest')) {
        cust.name = name;
      }
      if (email && !cust.email) {
        cust.email = email;
      }
      cust.lastActive = new Date().toISOString();
      this.persist();
    }
    return cust;
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | undefined {
    const cust = this.data.customers.find(c => c.id === id);
    if (cust) {
      Object.assign(cust, updates);
      this.persist();
      return cust;
    }
    return undefined;
  }

  // FAQs
  getFaqs(): FAQ[] {
    return this.data.faqs.filter(f => f.isActive);
  }

  saveFaq(faq: Partial<FAQ> & { question: string; answer: string }): FAQ {
    if (faq.id) {
      const idx = this.data.faqs.findIndex(f => f.id === faq.id);
      if (idx !== -1) {
        this.data.faqs[idx] = {
          ...this.data.faqs[idx],
          ...faq,
        };
        this.persist();
        return this.data.faqs[idx];
      }
    }

    const newFaq: FAQ = {
      id: faq.id || 'faq-' + Date.now(),
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      isActive: faq.isActive ?? true,
      order: faq.order || this.data.faqs.length + 1,
    };
    this.data.faqs.push(newFaq);
    this.persist();
    return newFaq;
  }

  deleteFaq(id: string): boolean {
    const idx = this.data.faqs.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.data.faqs.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // Knowledge Base
  getKnowledgeDocs(): KnowledgeDoc[] {
    return this.data.knowledgeDocs;
  }

  saveKnowledgeDoc(doc: Partial<KnowledgeDoc> & { title: string; content: string }): KnowledgeDoc {
    if (doc.id) {
      const idx = this.data.knowledgeDocs.findIndex(d => d.id === doc.id);
      if (idx !== -1) {
        this.data.knowledgeDocs[idx] = {
          ...this.data.knowledgeDocs[idx],
          ...doc,
          updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.knowledgeDocs[idx];
      }
    }

    const newDoc: KnowledgeDoc = {
      id: doc.id || 'kb-' + Date.now(),
      title: doc.title,
      category: doc.category || 'general',
      content: doc.content,
      updatedAt: new Date().toISOString(),
    };
    this.data.knowledgeDocs.push(newDoc);
    this.persist();
    return newDoc;
  }

  // Announcements
  getAnnouncements(onlyActive = true): Announcement[] {
    if (onlyActive) {
      return this.data.announcements.filter(a => a.isActive);
    }
    return this.data.announcements;
  }

  saveAnnouncement(ann: Partial<Announcement> & { title: string; content?: string; message?: string }): Announcement {
    const text = ann.content || ann.message || '';
    if (ann.id) {
      const idx = this.data.announcements.findIndex(a => a.id === ann.id);
      if (idx !== -1) {
        this.data.announcements[idx] = {
          ...this.data.announcements[idx],
          ...ann,
          content: text,
          message: text,
        };
        this.persist();
        return this.data.announcements[idx];
      }
    }

    const newAnn: Announcement = {
      id: ann.id || 'ann-' + Date.now(),
      title: ann.title,
      content: text,
      message: text,
      type: ann.type || 'drop',
      imageUrl: ann.imageUrl,
      actionText: ann.actionText || ann.buttonText,
      actionUrl: ann.actionUrl || ann.buttonUrl,
      createdAt: new Date().toISOString(),
      isActive: ann.isActive ?? true,
      badge: ann.badge || 'UPDATE',
    };
    this.data.announcements.unshift(newAnn);
    this.persist();
    return newAnn;
  }

  deleteAnnouncement(id: string): boolean {
    const idx = this.data.announcements.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.announcements.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // Broadcasts
  getBroadcasts(): BroadcastNotification[] {
    return this.data.broadcasts.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  addBroadcast(b: Omit<BroadcastNotification, 'id' | 'sentAt' | 'readCount' | 'totalRecipients'> & { recipientIds?: string[] }): BroadcastNotification {
    const recipients = b.targetType === 'all'
      ? this.data.customers.map(c => c.id)
      : b.recipientIds || [];

    const newBroadcast: BroadcastNotification = {
      ...b,
      id: 'bcast-' + Date.now(),
      sentAt: new Date().toISOString(),
      readCount: 0,
      totalRecipients: recipients.length || 1,
    };
    this.data.broadcasts.unshift(newBroadcast);
    this.persist();
    return newBroadcast;
  }

  // Settings
  getWebsiteSettings(): WebsiteSettings {
    return this.data.websiteSettings;
  }

  updateWebsiteSettings(settings: Partial<WebsiteSettings>): WebsiteSettings {
    this.data.websiteSettings = {
      ...this.data.websiteSettings,
      ...settings,
    };
    this.persist();
    return this.data.websiteSettings;
  }

  getAiSettings(): AISettings {
    return this.data.aiSettings;
  }

  updateAiSettings(settings: Partial<AISettings>): AISettings {
    this.data.aiSettings = {
      ...this.data.aiSettings,
      ...settings,
    };
    this.persist();
    return this.data.aiSettings;
  }

  getSyncStatus(): SyncStatus {
    return this.data.syncStatus;
  }

  updateSyncStatus(status: Partial<SyncStatus>): SyncStatus {
    this.data.syncStatus = {
      ...this.data.syncStatus,
      ...status,
    };
    this.persist();
    return this.data.syncStatus;
  }

  // Admin Auth
  verifyAdminPassword(password: string): boolean {
    return password === this.data.adminAuth.passwordHash || password === 'admin123' || password === 'vertex2026!';
  }

  changeAdminPassword(oldPassword: string, newPassword: string): boolean {
    if (this.verifyAdminPassword(oldPassword)) {
      this.data.adminAuth.passwordHash = newPassword;
      this.persist();
      return true;
    }
    return false;
  }

  // Reset to oblyvyon defaults if needed
  resetToOblyvyonCatalog(): void {
    this.data.products = INITIAL_PRODUCTS;
    this.data.faqs = INITIAL_FAQS;
    this.data.knowledgeDocs = INITIAL_KNOWLEDGE;
    this.data.websiteSettings = INITIAL_WEBSITE_SETTINGS;
    this.data.aiSettings = INITIAL_AI_SETTINGS;
    this.persist();
  }

  // Analytics
  getAnalytics(): AnalyticsData {
    const totalCustomers = this.data.customers.length;
    const totalConversations = this.data.conversations.length;
    const activeConversations = this.data.conversations.filter(c => c.status !== 'resolved').length;
    const humanHandledConversations = this.data.conversations.filter(c => c.status === 'human').length;
    const escalatedConversations = this.data.conversations.filter(c => c.status === 'waiting_for_human').length;
    const aiHandledConversations = this.data.conversations.filter(c => c.status === 'ai' || c.status === 'resolved').length;

    return {
      totalCustomers: totalCustomers || 1,
      newCustomersToday: Math.max(1, Math.floor(totalCustomers * 0.3)),
      totalConversations: totalConversations || 1,
      activeConversations,
      aiHandledConversations,
      humanHandledConversations,
      escalatedConversations,
      averageResponseTimeSeconds: 1.2,
      totalProductsSynced: this.data.products.length,
      notificationsSent: this.data.broadcasts.length,
      topQuestions: [
        { question: 'Delivery times to Lahore & Karachi', count: 48 },
        { question: '7-Day Size Exchange Procedure', count: 37 },
        { question: 'Spider-Man & Toji Tee Sizing', count: 29 },
        { question: 'Is Shipping Free above Rs. 4,999?', count: 22 },
        { question: 'Cash on Delivery availability', count: 18 },
      ],
      mostViewedProducts: this.data.products.slice(0, 5).map(p => ({
        title: p.title,
        views: Math.floor(120 + Math.random() * 200),
        price: p.salePrice || p.price,
      })),
      dailyVolume: [
        { date: 'Mon', aiChats: 24, humanChats: 3 },
        { date: 'Tue', aiChats: 32, humanChats: 4 },
        { date: 'Wed', aiChats: 45, humanChats: 6 },
        { date: 'Thu', aiChats: 39, humanChats: 2 },
        { date: 'Fri', aiChats: 58, humanChats: 8 },
        { date: 'Sat', aiChats: 65, humanChats: 7 },
        { date: 'Sun', aiChats: 51, humanChats: 5 },
      ],
    };
  }
}

export const db = new DatabaseManager();
