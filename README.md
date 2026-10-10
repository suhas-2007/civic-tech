# CivicTech: Public Works Intelligence & Coordination Platform
> **Bits & Bytes Hackathon 2026**

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Vercel-success?style=flat&logo=vercel)](https://civic-tech-eta.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/suhas-2007/civic-tech)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?logo=next.js)](https://nextjs.org)

CivicTech is an autonomous intelligence and coordination platform for public works transparency. It solves a real-world municipal problem: **uncoordinated road digging, overlapping trenching across departments, and delayed public works**.

---

## 🌐 Live Deployments & Links

- 🚀 **Live Production App**: [https://civic-tech-eta.vercel.app](https://civic-tech-eta.vercel.app)
- 🗺️ **Interactive Workspace**: [https://civic-tech-eta.vercel.app/workspace](https://civic-tech-eta.vercel.app/workspace)
- 💻 **GitHub Repository**: [https://github.com/suhas-2007/civic-tech](https://github.com/suhas-2007/civic-tech)
- 🗄️ **Supabase Database**: Project `civictech` (`kxixgmfudpozwpqhewds.supabase.co`) — PostgreSQL with Row Level Security (RLS)
- 🌿 **Git Branch Preview**: [https://civic-tech-git-main-suhas-raavi.vercel.app](https://civic-tech-git-main-suhas-raavi.vercel.app)


---

## 🌟 Key Features

- **⚡ Supabase PostgreSQL Backend**: Live cloud database storage for public works projects, citizen observations, and coordination logs with Row Level Security (RLS). Automatically falls back to in-memory demo mode if credentials are unset.
- **🗺️ Interactive Map with Spatial Detection**: Status-coded Leaflet pins (Ongoing, Delayed, Planned, Completed) plus community observation pins. Click anywhere on the map to drop a coordinate pin.
- **⚠️ Deterministic Coordination Engine**: Detects physical proximity and timeline overlaps between departments (e.g. Water Bureau vs Fiber Telecom digging the same street within 3 weeks) and flags high-severity clash alerts.
- **📢 Citizen Voice & Issue Reporting**: Residents can submit reports of potholes, broken pavement, or uncoordinated digging with upvote tracking and location tagging.
- **🤖 Bounded AI Investigation Agent**: Controlled Gemini 2.5 Flash assistant that queries project schedules, contractors, and conflicts using real database tools.
- **📄 AI Notice Ingestion**: Upload unstructured PDF public tenders/notices; Gemini extracts structured project metadata and saves it directly to the database.
- **📊 Audit Report Export**: One-click download of all detected clashes and projects as a JSON audit log for hackathon judges and municipal oversight.

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

## 🚀 Quick Setup & Run Locally

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://kxixgmfudpozwpqhewds.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```
*(Note: If you run without keys, CivicTech will automatically run in Demo DB Mode with rich sample data!)*

### 3. Database Setup (Supabase)
1. Go to your Supabase project's **SQL Editor**.
2. Run the SQL script located in `supabase/schema.sql` to initialize tables, indexes, RLS policies, and seed data.

### 4. Run Unit Tests
```bash
node ./node_modules/vitest/vitest.mjs run
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

