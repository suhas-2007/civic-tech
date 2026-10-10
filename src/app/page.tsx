import Link from "next/link";
import "./landing.css";

// Feature labels: [Implemented] | [Demo data] | [Requires GEMINI_API_KEY]
// No invented metrics. No live government data. All simulated records labeled.

export default function LandingPage() {
  return (
    <div className="lp-root">

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

      {/* ── Hero: oversized condensed headline ── */}
      <section className="lp-hero" aria-labelledby="hero-heading">
        <div className="lp-hero__left">
          <span className="lp-hero__kicker">Public Works Intelligence</span>
          <h1 className="lp-hero__h1" id="hero-heading">
            Infrastructure<br />
            <em>made</em><br />
            legible.
          </h1>
        </div>
        <div className="lp-hero__right">
          <p className="lp-hero__body">
            Civorium connects public project records, detects cross-department coordination failures, traces accountability timelines, and answers investigators&rsquo; questions — from a single evidence-first platform.
          </p>
          <div className="lp-hero__actions">
            <Link href="/workspace" className="btn-primary">
              Open the platform →
            </Link>
            <a href="#how-it-works" className="btn-ghost">
              How it works
            </a>
          </div>
          <p className="lp-hero__disclaimer">
            Demo — operating on simulated civic records. No live government data is connected.
          </p>
        </div>
      </section>

      <hr className="lp-rule" />

      {/* ── Stat rail: factual platform capabilities ── */}
      <div className="lp-stat-rail" aria-label="Platform capabilities">
        <div className="lp-stat-rail__inner">
          <div className="lp-stat-item">
            <span className="lp-stat-item__num lp-stat-item__num--green">6</span>
            <span className="lp-stat-item__label">Demo projects across Water, Roads, Electrical, Drainage, and Public Facilities</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-item__num">14</span>
            <span className="lp-stat-item__label">Unit tests on domain logic — conflict engine, delay analysis, date boundaries</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-item__num lp-stat-item__num--green">5</span>
            <span className="lp-stat-item__label">Typed read-only agent tools — no arbitrary SQL, no external API calls</span>
          </div>
        </div>
      </div>

      <hr className="lp-rule" />

      {/* ── Problem statement ── */}
      <section
        className="lp-section lp-problem"
        aria-labelledby="problem-heading"
      >
        <div className="lp-problem__grid">
          <div>
            <span className="lp-problem__label">The problem</span>
            <h2 className="lp-problem__heading" id="problem-heading">
              Public works is opaque by default.
            </h2>
          </div>
          <div>
            <p className="lp-problem__body">
              Municipalities manage dozens of infrastructure projects simultaneously across water, roads, utilities, and public facilities — planned by separate departments with different budgets, contractors, and schedules, with no shared coordination layer.
            </p>
            <p className="lp-problem__body">
              The result: redundant excavation on the same street, pavement newly repaved then immediately ripped up, delays compounded by sequencing failures that no single department can see. Civorium surfaces those patterns before they compound into waste.
            </p>
          </div>
        </div>
      </section>

      <hr className="lp-rule" />

      {/* ── Workflow: 4 numbered stages ── */}
      <section
        id="how-it-works"
        className="lp-section"
        aria-labelledby="workflow-heading"
        style={{ paddingTop: "3rem", paddingBottom: "3rem" }}
      >
        <span className="lp-section-label">How it works</span>
        <h2 className="lp-section-heading" id="workflow-heading" style={{ maxWidth: "24ch" }}>
          Four stages. One evidence chain.
        </h2>

        <div className="lp-workflow">

          {/* Stage 01 */}
          <div className="lp-stage">
            <span className="lp-stage__num" aria-hidden="true">01</span>
            <div className="lp-stage__inner">
              <div>
                <div className="lp-stage__badges">
                  <h3 className="lp-stage__heading">Discover</h3>
                  <span className="lp-badge lp-badge--live">Implemented</span>
                  <span className="lp-badge lp-badge--demo">Demo data</span>
                </div>
                <p className="lp-stage__desc">
                  Browse and filter the public works directory by status, work type, and department. Select any project to inspect its responsible parties, schedule, source records, and location on an interactive map.
                </p>
                <p className="lp-stage__desc lp-stage__desc--small" style={{ marginTop: "0.75rem" }}>
                  Built with Leaflet, React-Leaflet, Leaflet.GeoSearch + OpenStreetMap. Filters are real-time and synchronized between list and map views.
                </p>
              </div>
              <div className="lp-evidence" aria-label="Live in platform">
                <span className="lp-evidence__label">Live in platform</span>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  Water main replacement — Water Bureau, ongoing
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot lp-evidence__dot--neutral" />
                  Fiber optic installation — Technology Dept, planned
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot lp-evidence__dot--terra" />
                  Oak Ave repaving — Dept of Transportation, delayed
                </div>
              </div>
            </div>
          </div>

          {/* Stage 02 */}
          <div className="lp-stage">
            <span className="lp-stage__num" aria-hidden="true">02</span>
            <div className="lp-stage__inner">
              <div>
                <div className="lp-stage__badges">
                  <h3 className="lp-stage__heading">Detect</h3>
                  <span className="lp-badge lp-badge--live">Implemented</span>
                </div>
                <p className="lp-stage__desc">
                  A deterministic conflict engine checks every project pair for simultaneous schedule overlap and geographic proximity. A finding requires <em>both</em> conditions — a date overlap alone is not a conflict, and proximity alone is not a conflict.
                </p>
                <p className="lp-stage__desc lp-stage__desc--small" style={{ marginTop: "0.75rem" }}>
                  Uses date-fns for inclusive interval logic and Haversine distance for point proximity. The AI model is never used for authoritative date calculations.
                </p>
              </div>
              <div className="lp-evidence" aria-label="Conflict evidence format">
                <span className="lp-evidence__label">Conflict evidence format</span>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  Projects involved + overlapping schedule windows
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  Geographic basis (distance in metres, approximate)
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  Severity: high / candidate — never fabricated
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  Source record IDs for every material claim
                </div>
              </div>
            </div>
          </div>

          {/* Stage 03 */}
          <div className="lp-stage">
            <span className="lp-stage__num" aria-hidden="true">03</span>
            <div className="lp-stage__inner">
              <div>
                <div className="lp-stage__badges">
                  <h3 className="lp-stage__heading">Investigate</h3>
                  <span className="lp-badge lp-badge--requires">Requires API key</span>
                </div>
                <p className="lp-stage__desc">
                  A bounded, read-only coordination agent answers natural-language questions using five typed tools: project search, project details, timeline analysis, conflict lookup, and neighborhood proximity. The agent cannot mutate records or call external services.
                </p>
                <p className="lp-stage__desc lp-stage__desc--small" style={{ marginTop: "0.75rem" }}>
                  Built on @google/genai with a hard 3-step tool-call ceiling. Reports separate source-confirmed facts, deterministic calculations, AI interpretations, and stated limitations.
                </p>
              </div>
              <div className="lp-evidence" aria-label="Agent tool inventory">
                <span className="lp-evidence__label">Agent tool inventory</span>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  searchProjects — filter by status, type, department
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  getProjectTimeline — deterministic delay analysis
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  findConflicts — calls the same engine as the UI
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  getNeighborhoodWorks — coordinate + radius lookup
                </div>
              </div>
            </div>
          </div>

          {/* Stage 04 */}
          <div className="lp-stage">
            <span className="lp-stage__num" aria-hidden="true">04</span>
            <div className="lp-stage__inner">
              <div>
                <div className="lp-stage__badges">
                  <h3 className="lp-stage__heading">Ingest</h3>
                  <span className="lp-badge lp-badge--requires">Requires API key</span>
                </div>
                <p className="lp-stage__desc">
                  Upload a public notice PDF. Civorium extracts embedded text with unpdf, requests structured fields from Gemini with a defined JSON schema, validates every field with Zod, and flags uncertain or inferred values explicitly. Scanned image-only PDFs are clearly rejected.
                </p>
                <p className="lp-stage__desc lp-stage__desc--small" style={{ marginTop: "0.75rem" }}>
                  Extracted fields: title, description, department, contractor, planned dates, address. Fields the model cannot confidently extract remain null — they are never fabricated.
                </p>
              </div>
              <div className="lp-evidence" aria-label="PDF ingestion guarantees">
                <span className="lp-evidence__label">PDF ingestion guarantees</span>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  Max 5 MB — enforced before parsing
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  PDF MIME type validated — other formats rejected
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  Empty / encrypted / scanned: explicit error returned
                </div>
                <div className="lp-evidence__item">
                  <span className="lp-evidence__dot" />
                  Zod schema validation before any field is used
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <hr className="lp-rule" />

      {/* ── Demo notice ── */}
      <div className="lp-section" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <div className="lp-demo-notice" role="note" aria-label="Data notice">
          <span className="lp-demo-notice__label">Demo</span>
          <p className="lp-demo-notice__text">
            The platform operates on simulated projects (labeled <code>dataOrigin: &quot;demo&quot;</code>). No live government data, real-time traffic, road closures, or PostGIS spatial geometry is connected. Conflict proximity uses Haversine point distance as an approximation; spatial findings are explicitly marked approximate. A Supabase/PostGIS integration and real civic record ingestion are the next production steps.
          </p>
        </div>
      </div>

      <hr className="lp-rule" />

      {/* ── Technology stack ── */}
      <section
        id="stack"
        className="lp-section"
        aria-labelledby="stack-heading"
        style={{ paddingTop: "3rem", paddingBottom: "3rem" }}
      >
        <span className="lp-section-label" id="capabilities">Architecture</span>
        <h2 className="lp-section-heading" id="stack-heading">
          Built on verifiable choices.
        </h2>
        <div className="lp-stack__grid">
          <div className="lp-stack__item">
            <div className="lp-stack__role">Framework</div>
            <div className="lp-stack__name">Next.js 16</div>
            <div className="lp-stack__note">App Router · TypeScript · Vercel Edge</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Database</div>
            <div className="lp-stack__name">Supabase PostgreSQL</div>
            <div className="lp-stack__note">Full CRUD schema · Row Level Security · In-memory fallback</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Mapping</div>
            <div className="lp-stack__name">Leaflet + React-Leaflet</div>
            <div className="lp-stack__note">GeoSearch via OSM Nominatim · Status-coded pins</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">AI Engine</div>
            <div className="lp-stack__name">Gemini 2.5 Flash</div>
            <div className="lp-stack__note">@google/genai SDK · Bounded agent · Structured PDF extraction</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">PDF Parsing</div>
            <div className="lp-stack__name">unpdf</div>
            <div className="lp-stack__note">Embedded text extraction from municipal notices</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Validation</div>
            <div className="lp-stack__name">Zod v4</div>
            <div className="lp-stack__note">Runtime schema validation at every AI boundary</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Conflict logic</div>
            <div className="lp-stack__name">date-fns + Haversine</div>
            <div className="lp-stack__note">Deterministic spatial and temporal clash detection</div>
          </div>
          <div className="lp-stack__item">
            <div className="lp-stack__role">Testing</div>
            <div className="lp-stack__name">Vitest</div>
            <div className="lp-stack__note">14 unit tests · DB layer + domain logic + agent tools</div>
          </div>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <div className="lp-cta-strip" role="complementary" aria-label="Platform CTA">
        <span className="lp-cta-strip__label">Ready to inspect</span>
        <h2 className="lp-cta-strip__heading">
          Open the platform.<br />Inspect the evidence.
        </h2>
        <Link href="/workspace" className="lp-cta-strip__btn">
          Explore the Intelligence Platform →
        </Link>
        <p className="lp-cta-strip__sub">
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
