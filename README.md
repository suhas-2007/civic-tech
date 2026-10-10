# Civorium
> Infrastructure made legible.

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Vercel-success?style=flat&logo=vercel)](https://civic-tech-eta.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github)](https://github.com/suhas-2007/civic-tech)

Civorium connects public notices, project records, geography, and schedules so residents can understand nearby disruption and public teams can deterministically spot work conflicts.

---

## 🛑 The Problem
Public-works information is scattered across obscure notices, disconnected municipal departments, contractors, and informal updates. Residents struggle to learn what is happening, who is responsible, and when work may finish. Simultaneously, municipal departments may unknowingly plan overlapping work on the same street (e.g., Water Bureau and Fiber Telecom digging the same road weeks apart), causing repeat excavation and avoidable community disruption.

## 💡 Our Solution
Civorium acts as an autonomous public-works intelligence and coordination platform. It ingests unstructured municipal notices, extracts structured project data using generative AI, and maps them geospatially. 

**The differentiator:** It is *not* just a chatbot. Civorium relies on a **deterministic coordination engine** to mathematically calculate spatial proximity and timeline overlaps, ensuring that flagged conflicts are based on verifiable data relationships, while relying on AI only for document extraction and evidence-grounded explanation.

## 🌟 Key Features
- **Deterministic Coordination Engine:** Detects physical proximity (via Haversine formula) and timeline overlaps between departments, flagging active coordination clashes (e.g., Uncoordinated Digging).
- **Interactive Geospatial Workspace:** Status-coded Leaflet pins representing ongoing, delayed, planned, or completed projects.
- **AI Notice Ingestion Pipeline:** Upload unstructured PDF public tenders/notices; Gemini 3.8 Flash extracts structured project metadata and saves it directly to the database.
- **Bounded Civorium AI Analyst:** A controlled AI assistant that queries project schedules, contractors, and conflicts using real database tools to answer operational questions.
- **Citizen Signal Reporting:** Residents can submit observations (e.g., abandoned trenches, uncoordinated crews) tagged to specific coordinates with a community confirmation (upvote) system.

## 📸 Screenshots / Demo
*(Note: A required 2-5 minute demo video is currently missing from this repository. This must be added prior to final hackathon submission.)*

## ⚙️ How it Works
1. **Data Ingestion:** PDFs are parsed via `unpdf`. Google Gemini 3.8 Flash extracts structured metadata (dates, departments, coordinates) using strict `zod` schemas.
2. **Persistence:** Data is stored in Supabase PostgreSQL. If Supabase is unavailable, the application gracefully degrades to an in-memory fallback state with demo data.
3. **Conflict Detection (`src/lib/conflicts.ts`):** Client-side logic deterministically compares all active projects. A conflict is flagged if projects are within a 200m radius and their planned active windows overlap.
4. **Interface:** The frontend is a strictly designed, typography-driven React application built on Next.js 16 (App Router) avoiding generic UI patterns to emphasize data legibility.

## 🛠️ Technology Stack
- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Database Backend:** Supabase (PostgreSQL with RLS)
- **Mapping:** Leaflet, `react-leaflet`, `leaflet-geosearch`
- **Generative AI:** Google Gemini 3.8 Flash (`@google/genai`)
- **Document Processing:** `unpdf`
- **Validation:** `zod`
- **Testing:** `vitest`

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Supabase Project (optional for demo mode)
- Google Gemini API Key

### Installation
Clone the repository and install dependencies. Note the legacy peer deps flag required for React 19 compatibility.
```bash
git clone https://github.com/suhas-2007/civic-tech.git
cd civic-tech
npm install --legacy-peer-deps
```

### Environment Setup
Copy the example environment file:
```bash
cp .env.example .env.local
```
Provide your keys in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```
*(If no Supabase URL is provided, Civorium automatically boots into a local In-Memory Demo mode).*

### Database Setup
If using Supabase, execute `supabase/schema.sql` in your project's SQL Editor to create tables and apply RLS policies.

### Running the App
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

## 📊 Data, Evidence, and Limitations
- **Simulated vs. Live Data:** When running without Supabase credentials, the application explicitly labels all data origin as "demo". 
- **Deterministic vs AI:** Coordination clashes (red alerts) are deterministically calculated. AI is solely used to extract text from notices and answer queries based *only* on the structured database records.
- **Geospatial Limitations:** Proximity detection currently uses Haversine point-radius approximation (200m) rather than precise PostGIS line-string segment overlaps.
- **Impact Claims:** The application does not claim to know live traffic conditions or verified physical delays unless explicitly reported.

## ✅ Testing and Validation
Civorium includes a comprehensive unit testing suite for its core domain logic (conflict detection, timelines, agent tools, and DB adapter).

Run tests:
```bash
npm run test
```
*Current coverage:* 14 unit tests passing across 5 domain files.

## 🌍 Impact and Achievements
Civorium provides immediate, practical value:
- **For Residents:** Translates obscure municipal notices into an understandable visual map of their neighborhood.
- **For Municipal Teams:** Automates the detection of cross-department schedule clashes, potentially saving thousands in repeat excavation costs.

## 🔮 Future Work
- Migration from point-based Haversine distance to precise PostGIS line-string geometry for exact street segment overlaps.
- Direct integration with open municipal data portals (e.g., Socrata) for automated live data ingestion, removing the need for manual PDF uploads.

## 🤝 Team, Acknowledgments, and License
Built for the Bits & Bytes Hackathon 2026.
Open-source software used in accordance with their respective licenses (React, Next.js, Leaflet).
