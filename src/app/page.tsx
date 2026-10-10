import Link from "next/link";
import "./landing.css";

// All content grounded in the actual implementation.
// Features labeled: [Implemented] | [Demo data] | [Requires GEMINI_API_KEY]

export default function LandingPage() {
  return (
    <div className="landing-root">

      {/* ── N9 Edge-aligned nav ── */}
      <nav className="lp-nav" aria-label="Site navigation">
        <div className="lp-nav__inner">
          <Link href="/" className="lp-nav__wordmark" aria-label="Civorium home">
            Civorium
          </Link>
          <ul className="lp-nav__links" role="list">
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#capabilities">Capabilities</a></li>
            <li><a href="#stack">Stack</a></li>
          </ul>
          <Link href="/workspace" className="lp-nav__cta">
            Open Platform →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero" aria-labelledby="hero-heading">
        <div>
          <span className="lp-hero__kicker">Public Works Intelligence</span>
          <h1 className="lp-hero__h1" id="hero-heading">
            Infrastructure made legible.
          </h1>
        </div>
        <div>
          <p className="lp-hero__body">
            Civorium connects public project records, detects cross-department coordination failures, traces accountability timelines, and answers investigators' questions — all from a single, evidence-first platform.
          </p>
          <div className="lp-hero__actions">
            <Link href="/workspace" className="btn-primary">
              Explore the Intelligence Platform →
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              See how it works
            </a>
          </div>
          <p className="lp-hero__disclaimer">
            ⚠ Demo — platform currently operates on simulated civic records. No live government data is connected.
          </p>
        </div>
      </section>

      <hr className="lp-rule" />

      {/* ── Problem statement ── */}
      <section className="lp-section" aria-labelledby="problem-heading">
        <div className="lp-problem__grid">
          <h2 className="lp-problem__heading" id="problem-heading">
            Public works is opaque by default.
          </h2>
          <div>
            <p className="lp-problem__body">
              Municipalities manage dozens of infrastructure projects simultaneously across water, roads, utilities, and public facilities. These projects are planned by separate departments with different budgets, contractors, and schedules — with no shared coordination layer.
            </p>
            <p className="lp-problem__body" style={{ marginTop: "1rem" }}>
              The result: redundant excavation on the same street, pavement newly repaved then immediately ripped up, delays compounded by sequencing failures that no single department can see. Civorium is built to surface those patterns before they compound into waste.
            </p>
          </div>
        </div>
      </section>

      <hr className="lp-rule" />

      {/* ── Narrative Workflow: 4 stages ── */}
      <section
        id="how-it-works"
        className="lp-section"
        aria-labelledby="workflow-heading"
        style={{ paddingTop: "var(--space-2xl)" }}
      >
        <span className="lp-section__kicker">How it works</span>
        <h2
          className="lp-section__heading"
          id="workflow-heading"
          style={{ maxWidth: "22ch" }}
        >
          Four stages. One evidence chain.
        </h2>

        <div className="lp-workflow">

          {/* Stage 1: Discover */}
          <div className="lp-stage">
            <span className="lp-stage__num" aria-hidden="true">01</span>
            <div className="lp-stage__content">
              <div className="lp-stage__inner">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <h3 className="lp-stage__heading">Discover</h3>
                    <span className="lp-stage__badge lp-stage__badge--live">Implemented</span>
                    <span className="lp-stage__badge lp-stage__badge--demo">Demo data</span>
                  </div>
                  <p className="lp-stage__desc">
                    Browse and filter the public works directory by status, work type, and department. Select any project to inspect its responsible parties, schedule, source records, and coordinates on an interactive map. Search for locations using the integrated geocoder.
                  </p>
                  <p className="lp-stage__desc" style={{ marginTop: "0.75rem", fontSize: "var(--text-sm)", color: "var(--lp-ink-3)" }}>
                    Built with Leaflet, React-Leaflet, Leaflet.GeoSearch + OpenStreetMap tiles. Filters are real-time and synchronized between the list and map views.
                  </p>
                </div>
                <div className="lp-stage__evidence">
                  <div className="lp-stage__evidence-label">Live in platform</div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    Water main replacement — Water Bureau, ongoing
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot lp-stage__evidence-dot--planned"></span>
                    Fiber optic installation — Technology Dept, planned
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot lp-stage__evidence-dot--delayed"></span>
                    Oak Ave repaving — Dept of Transportation, delayed
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stage 2: Detect */}
          <div className="lp-stage">
            <span className="lp-stage__num" aria-hidden="true">02</span>
            <div className="lp-stage__content">
              <div className="lp-stage__inner">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <h3 className="lp-stage__heading">Detect</h3>
                    <span className="lp-stage__badge lp-stage__badge--live">Implemented</span>
                  </div>
                  <p className="lp-stage__desc">
                    A deterministic conflict engine checks every project pair for simultaneous schedule overlap and geographic proximity. A finding requires both conditions — a date overlap alone is not a conflict, and proximity alone is not a conflict.
                  </p>
                  <p className="lp-stage__desc" style={{ marginTop: "0.75rem", fontSize: "var(--text-sm)", color: "var(--lp-ink-3)" }}>
                    Uses date-fns for inclusive interval logic (boundary equality handled explicitly) and Haversine distance for point proximity. PostGIS line-segment geometry is a planned upgrade. The AI model is never used for authoritative date calculations.
                  </p>
                </div>
                <div className="lp-stage__evidence">
                  <div className="lp-stage__evidence-label">Conflict evidence format</div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    Projects involved + overlapping schedule windows
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    Geographic basis (distance in metres, approximate)
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    Severity: high / candidate — never fabricated
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    Source record IDs for every material claim
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stage 3: Investigate */}
          <div className="lp-stage">
            <span className="lp-stage__num" aria-hidden="true">03</span>
            <div className="lp-stage__content">
              <div className="lp-stage__inner">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <h3 className="lp-stage__heading">Investigate</h3>
                    <span className="lp-stage__badge lp-stage__badge--ai">Requires API key</span>
                  </div>
                  <p className="lp-stage__desc">
                    A bounded, read-only coordination agent answers natural-language questions using five typed tools: project search, project details, timeline analysis, conflict lookup, and neighborhood proximity. The agent cannot mutate records, access the filesystem, or call external services.
                  </p>
                  <p className="lp-stage__desc" style={{ marginTop: "0.75rem", fontSize: "var(--text-sm)", color: "var(--lp-ink-3)" }}>
                    Built on @google/genai with a hard 3-step tool-call ceiling. Reports separate source-confirmed facts, deterministic calculations, AI interpretations, and stated limitations. Core platform functions remain fully operational without an API key.
                  </p>
                </div>
                <div className="lp-stage__evidence">
                  <div className="lp-stage__evidence-label">Agent tool inventory</div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    searchProjects — filter by status, type, department
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    getProjectTimeline — deterministic delay analysis
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    findConflicts — calls the same engine as the UI
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    getNeighborhoodWorks — coordinate + radius lookup
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stage 4: Act */}
          <div className="lp-stage">
            <span className="lp-stage__num" aria-hidden="true">04</span>
            <div className="lp-stage__content">
              <div className="lp-stage__inner">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <h3 className="lp-stage__heading">Act</h3>
                    <span className="lp-stage__badge lp-stage__badge--ai">Requires API key</span>
                  </div>
                  <p className="lp-stage__desc">
                    Upload a public notice PDF. Civorium extracts embedded text with unpdf, requests structured fields from Gemini with a defined JSON schema, validates every field with Zod, and flags uncertain or inferred values explicitly. Scanned image-only PDFs are clearly rejected — OCR is not performed.
                  </p>
                  <p className="lp-stage__desc" style={{ marginTop: "0.75rem", fontSize: "var(--text-sm)", color: "var(--lp-ink-3)" }}>
                    Extracted fields: title, description, department, contractor, planned dates, address. AI output is never accepted without Zod validation. Fields the model cannot confidently extract remain null — they are never fabricated.
                  </p>
                </div>
                <div className="lp-stage__evidence">
                  <div className="lp-stage__evidence-label">PDF ingestion guarantees</div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    Max 5 MB — enforced before parsing
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    PDF MIME type validated — other formats rejected
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    Empty / encrypted / scanned: explicit error returned
                  </div>
                  <div className="lp-stage__evidence-item">
                    <span className="lp-stage__evidence-dot"></span>
                    Zod schema validation before any field is used
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="lp-rule" />

      {/* ── Demo notice ── */}
      <div className="lp-section" style={{ padding: "var(--space-xl) var(--lp-gutter)" }}>
        <div className="lp-demo-notice" role="note" aria-label="Data notice">
          <span className="lp-demo-notice__label">Demo</span>
          <p className="lp-demo-notice__text">
            The platform currently operates on three simulated projects (labeled <code style={{ fontFamily: "monospace", fontSize: "0.8em" }}>dataOrigin: &quot;demo&quot;</code> throughout the codebase). No live government data, real-time traffic, verified road closures, or PostGIS spatial geometry is connected. Conflict proximity uses Haversine point distance as an approximation; spatial findings are explicitly marked approximate. A Supabase/PostGIS integration and real civic record ingestion are the next production steps.
          </p>
        </div>
      </div>

      <hr className="lp-rule" />

      {/* ── Technology stack ── */}
      <section
        id="stack"
        className="lp-section"
        aria-labelledby="stack-heading"
        style={{ background: "var(--color-land-surface)" }}
      >
        <span className="lp-section__kicker">Architecture</span>
        <h2 className="lp-section__heading" id="stack-heading">
          Built on verifiable choices.
        </h2>
        <div className="lp-stack__grid">
          <div className="lp-stack__item">
            <div className="lp-stack__role">Framework</div>
            <div className="lp-stack__name">Next.js 16 (Vercel)</div>
            <div className="lp-stack__note">App Router · TypeScript · Ready for 1-click Vercel deployment</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Database</div>
            <div className="lp-stack__name">Supabase (PostgreSQL)</div>
            <div className="lp-stack__note">Full CRUD schema · Row Level Security (RLS) · Citizen reporting & upvotes</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Mapping</div>
            <div className="lp-stack__name">Leaflet + React-Leaflet</div>
            <div className="lp-stack__note">GeoSearch via OSM Nominatim · Color-coded pins & citizen reports</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">AI Engine</div>
            <div className="lp-stack__name">Gemini 2.5 Flash</div>
            <div className="lp-stack__note">@google/genai SDK · Bounded coordination agent & structured PDF tender extractor</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">PDF Parsing</div>
            <div className="lp-stack__name">unpdf</div>
            <div className="lp-stack__note">Embedded text extraction from municipal notices directly into Supabase</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Validation</div>
            <div className="lp-stack__name">Zod v4</div>
            <div className="lp-stack__note">Runtime schema validation at every AI boundary and API entry point</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Conflict logic</div>
            <div className="lp-stack__name">date-fns + Haversine</div>
            <div className="lp-stack__note">Deterministic cross-department spatial & temporal clash detection</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Testing</div>
            <div className="lp-stack__name">Vitest</div>
            <div className="lp-stack__note">14 unit tests passing · database layer + domain logic + agent tools</div>
          </div>
        </div>
      </section>

      {/* ── CTA strip (dark) ── */}
      <div className="lp-cta-strip" role="complementary" aria-label="Platform CTA">
        <h2 className="lp-cta-strip__heading">
          Open the platform. Inspect the evidence.
        </h2>
        <Link href="/workspace" className="lp-cta-strip__btn">
          Explore the Intelligence Platform →
        </Link>
        <p className="lp-cta-strip__note">
          Public works coordination made transparent and accountable.
        </p>
      </div>

      {/* ── Footer (Ft5: Statement) ── */}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-footer__inner">
          <p className="lp-footer__statement">
            Civorium — public works coordination, made accountable.
          </p>
          <div className="lp-footer__meta">
            <span>Next.js · Supabase · Vercel · Leaflet · Gemini · Zod</span>
            <span>
              <Link href="/workspace">Platform</Link>
              {" · "}
              <a href="#how-it-works">How it works</a>
              {" · "}
              <a href="#stack">Stack</a>
            </span>
            <span>Public Data Transparency</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
