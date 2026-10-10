# CivicTech Deployment Guide: Vercel + Supabase

This guide explains how to deploy **CivicTech**:
- **Backend Database**: Supabase (PostgreSQL)
- **Frontend & API**: Vercel (Next.js 16)

---

## 📦 Step 1: Set Up Backend in Supabase (2 Minutes)

1. Go to [https://supabase.com](https://supabase.com) and sign in (free tier is plenty).
2. Click **New project**, choose an organization, name it `civic-tech`, and pick the nearest region.
3. Once the database is ready, click **SQL Editor** in the left sidebar.
4. Click **New query**, open [`supabase/schema.sql`](file:///c:/Users/suhas/OneDrive/Desktop/Bits&bytes%20hackathon/supabase/schema.sql) from this repo, copy its contents, and click **Run**.
   - This creates the `projects` table.
   - Creates the `citizen_reports` table.
   - Sets up Row Level Security (RLS) policies.
   - Populates initial realistic seed projects & citizen reports!
5. In Supabase, go to **Project Settings** (gear icon) ➔ **API**.
6. Copy these two values:
   - **Project URL** (e.g. `https://xyzabcdefg.supabase.co`)
   - **anon public key** (starts with `eyJhbGci...`)

---

## ⚡ Step 2: Deploy Frontend to Vercel (1 Minute)

1. Push all your latest changes to your GitHub repo:
   ```bash
   git add .
   git commit -m "feat: add supabase db integration and upgraded student UI"
   git push origin main
   ```
2. Go to [https://vercel.com](https://vercel.com) and log in with GitHub.
3. Click **Add New...** ➔ **Project**.
4. Import your repository: `guna2007/civic-tech`.
5. Under **Environment Variables**, add the following:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon public key
   - `GEMINI_API_KEY` = your Google AI Studio key (from [aistudio.google.com](https://aistudio.google.com/))
6. Click **Deploy**!

Within ~60 seconds, Vercel will build and deploy your project with a live `.vercel.app` domain! 🎉

---

## 🧪 Step 3: Verify Your Live Demo

1. Open your live Vercel URL.
2. Click **Open Platform** ➔ `/workspace`.
3. Check the header status pill: it will show `🟢 Supabase Live`!
4. Test the hackathon features:
   - **Click "+ Add Project"**: Fill out a new roadwork project and verify it saves directly to your Supabase `projects` table!
   - **Click "📢 Report Issue"**: Report a simulated pothole or uncoordinated road dig and see it appear on the map and in the `citizen_reports` table.
   - **Test Conflict Engine**: Watch how overlapping roadworks between departments trigger automatic clash warnings.
   - **Download Audit Report**: Click **Export** to download the JSON report to show judges.

---

## 🛠️ Local Development

If you want to run locally on your laptop:
```bash
# 1. Copy the environment template
cp .env.example .env.local

# 2. Put your Supabase keys in .env.local

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!
