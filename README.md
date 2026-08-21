# Vertex Lab — AI Customer Care & Concierge

A production-ready, full-stack AI Customer Care and E-Commerce Concierge platform tailored for **Vertex Lab** (premium Pakistani heavyweight Japanese Tatami embroidered streetwear brand).

![Vertex Lab AI](https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=1200&q=80)

---

## ⚡ Highlights & Capabilities

- **AI-Powered Customer Care & Styling**:
  - Grounded in Vertex Lab's live product catalog, apparel fabric specifications (240–280 GSM luxury combed cotton, 450 GSM French Terry hoodies, 85,000+ stitch count Japanese Tatami embroidery).
  - Accurate Pakistan shipping knowledge (Lahore next-day 1–2 days delivery, nationwide 2–5 days via PostEx & TCS, flat Rs. 200 fee, Free Shipping on orders over Rs. 4,999, Cash on Delivery support).
  - Strict No-Return & 100% Free Damaged Item Replacement policy with automated resolution guidance.
  - Multilingual fluency in English, Roman Urdu (*"kya delivery free hai"*, *"size chart dikhao"*, *"kharab item aya hai"*), and Urdu.

- **Interactive Streetwear E-Commerce Experience**:
  - Embedded dynamic product recommendation cards with image previews, stock status, size badges, and direct checkout links.
  - Voice dictation with browser Speech Recognition and Text-to-Speech audio responses.
  - One-click copy, response feedback ratings (thumbs up/down), and follow-up elaboration prompts.

- **Integrated Store Management & Admin Portal**:
  - Multi-tab admin management dashboard (Product Catalog manager, Live Chat Inbox with hybrid human takeover, FAQs editor, Knowledge Base manager, Broadcasts & Announcements, Store Settings).
  - Background live catalog synchronization with auto-refresh.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend Server**: Node.js, Express, ESBuild, TSX
- **AI Engine**: `@google/genai` TypeScript SDK with grounded schema validation & multi-tier resilience
- **Storage**: Real-time JSON persistence database with auto-sync

---

## 🚀 Quick Start & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/vertex-lab-ai-concierge.git
cd vertex-lab-ai-concierge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Deployment

### Vercel Deployment (1-Click Ready)
1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and import your repository.
3. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API Key from Google AI Studio.
4. Click **Deploy**. Vercel will automatically use `vercel.json` and `/api/index.ts` to power both the React frontend and the serverless Express AI backend.

### Docker & Container Deployment
```bash
docker build -t vertex-lab-ai .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key vertex-lab-ai
```

### Traditional Node.js Server
```bash
npm run build
npm run start
```

---

## 🔐 Admin Portal Credentials

- **Default Username**: `admin`
- **Default Password**: `admin123`

---

## 📄 License
Apache-2.0
