# CivicTech: Public Works Intelligence & Coordination Platform

CivicTech is an autonomous intelligence and coordination platform for public works transparency. It solves a real-world municipal problem: **uncoordinated road digging, overlapping trenching across departments, and delayed public works**.

---

## 🌟 Key Features

- **🗄️ Supabase PostgreSQL Backend**: Real database storage for projects, citizen observations, and coordination logs with Row Level Security (RLS). Works live with Supabase or in seamless fallback mode.
- **🗺️ Interactive Leaflet Map**: Custom status-coded pins (Ongoing, Delayed, Planned, Completed) plus community issue pins. Click anywhere to drop a coordinate pin!
- **⚡ Deterministic Coordination Engine**: Detects physical proximity and timeline overlaps between departments (e.g. Water Bureau vs Fiber Telecom digging the same street within 3 weeks) and raises high-severity clash alerts.
- **📢 Citizen Voice & Reporting**: Residents can submit reports of potholes, broken pavement, or uncoordinated digging with upvote tracking.
- **🤖 Bounded AI Investigation Agent**: Controlled Gemini 2.5 Flash assistant that queries project schedules, contractors, and conflicts using real database tools.
- **📄 AI Notice Ingestion**: Upload unstructured PDF public tenders/notices; Gemini extracts structured project metadata and saves it directly to the database.
- **⬇️ Audit Report Export**: One-click download of all detected clashes and projects as a JSON audit log for hackathon judges and municipal oversight.

---

## 🛠️ Technology Stack

- **Frontend & Server**: [Next.js 16](https://nextjs.org) (App Router, Turbopack, React 19)
- **Deployment**: [Vercel](https://vercel.com) (Serverless Edge)
- **Database Backend**: [Supabase](https://supabase.com) (PostgreSQL, Row Level Security)
- **Maps**: [Leaflet](https://leafletjs.com) + `react-leaflet` + `leaflet-geosearch` + OpenStreetMap
- **Generative AI**: Google Gemini 2.5 Flash via `@google/genai`
- **PDF Extraction**: `unpdf`
- **Data Validation**: `zod`
- **Testing**: `vitest` (14 unit tests passing)

---

## 🚀 Quick Setup & Run Commands

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your Supabase URL & Anon Key (see [DEPLOYMENT.md](file:///c:/Users/suhas/OneDrive/Desktop/Bits&bytes%20hackathon/DEPLOYMENT.md) for a 2-minute setup guide).  
*(Note: If you run without keys, CivicTech will automatically run in Demo DB Mode with rich sample data!)*

### 3. Run Unit Tests
```bash
# Run all 14 tests
node ./node_modules/vitest/vitest.mjs run
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## Deploying to Vercel & Supabase

Detailed step-by-step instructions for 1-click Vercel deployment and Supabase table creation are available in [DEPLOYMENT.md](file:///c:/Users/suhas/OneDrive/Desktop/Bits&bytes%20hackathon/DEPLOYMENT.md).
