# Taqsimat — Project Context

**What this file is.** Context that Claude Code should read on every session before writing or editing code. Keep it short and current.

---

## Mission

A Muslim community that is financially educated, wealthier, and free from riba.

## What we're building

Taqsimat is a neutral financial platform for Muslims. It helps users see their financial position, fulfill religious duties (zakat, inheritance, wasiyat), and find the best halal investment options. We are an aggregator and guidance layer, not a financial institution. We don't hold money.

The MVP has five features: **Balance sheet, Meras (inheritance), Zakat, Halal investment options, Fin Advisor**. Courses runs as a parallel always-free content track.

## Read these documents before writing code

They are the single source of truth. If something here conflicts with them, the docs win — tell the user.

- `docs/01-product-definition.md` — mission, scope, what we are and are not building, geographic strategy, screening methodology
- `docs/02-prds.md` — one-page PRDs for all six modules with shared data model, inputs, outputs, out-of-scope items
- `docs/03-architecture.md` — full MVP architecture, Supabase schema, RLS policies, module designs, Meras algorithm spec, Fin Advisor system prompt, build order

---

## Technology stack

- **Next.js 15 (App Router)** + **TypeScript strict mode** + **Tailwind** + **shadcn/ui**
- **Supabase** for PostgreSQL, auth, row-level security, Edge Functions, pg_cron, pgvector, storage
- **Vercel** for hosting
- **next-intl** for i18n (English + Uzbek, URL-based locale)
- **Anthropic or OpenAI API** for Fin Advisor (server-side only, never in the browser)
- Scaffolded with **Lovable**; hand-coded parts written by engineers or Claude Code

## Folder structure

```
app/
  (marketing)/          landing, about, privacy
  (app)/                authenticated + guest app routes
    balance-sheet/
    zakat/
    meras/
    investments/
    advisor/
  api/
    advisor/            Fin Advisor LLM endpoint
    meras/              Meras calculation endpoint
    cron/               Scheduled job handlers
lib/
  supabase/             client/server/admin clients
  meras/                hand-coded Hanafi algorithm + tests
  zakat/                nisab and zakat calculation
  balance-sheet/        diagnostic pure functions
  shariah/              screening rules
  i18n/                 translations
  types/                shared TypeScript types
components/
  ui/                   shadcn components
  forms/                shared form primitives
docs/                   the three spec docs above
```

---

## Critical constraints (do not compromise on these)

1. **Meras must be hand-coded with full test coverage.** Do not let Lovable generate the inheritance algorithm. See `docs/03-architecture.md` §4.3 for the spec. Unit tests must cover the canonical cases listed there before any UI ships. A single publicly discovered miscalculation destroys scholar credibility forever.

2. **Fin Advisor must be grounded.** Never let the LLM invent Shariah rulings. System prompt is in `docs/03-architecture.md` §4.5 — do not alter without scholar review. Minimum 5 scholar-reviewed Courses articles must exist before Fin Advisor launches. If a user question requires a Shariah ruling the prompt does not cover, the response must offer to refer to a scholar — never guess.

3. **Row-level security on every user-owned table.** See §3.10. Missing RLS on a user table is a security incident, not a bug to fix later.

4. **All LLM and admin calls are server-side only.** The Supabase service role key and LLM API keys must never be shipped to the browser. Only used in Next.js API routes or Edge Functions.

5. **Monetary amounts use `numeric(20, 2)`, never floats.** Inheritance and zakat math cannot tolerate floating-point drift.

6. **Hanafi only at launch, architecture supports others.** The `profiles.madhhab` field exists and is locked to `'hanafi'` in the UI. The Meras engine is a pure function so other madhhabs can be added later without rewrites.

7. **Zod validation on every form and API route.** Never trust client input.

---

## What Claude Code should do well (hand-coded work)

Lovable handles UI scaffolding (pages, forms, dashboards, shadcn composition, routing, i18n wiring). Claude Code focuses on the parts Lovable does not reliably build:

1. **Meras algorithm** in `lib/meras/` — deduction, fard shares, Awl/Radd corrections, asaba ladder. With tests.
2. **Fin Advisor API route** at `/api/advisor/chat` — retrieval over pgvector, prompt construction, streaming LLM response, DB writes, cost controls.
3. **Balance sheet diagnostics** in `lib/balance-sheet/diagnostics.ts` — pure functions for net worth, composition, liquidity, zakat eligibility, halal/haram split.
4. **Supabase Edge Functions** — daily CBU FX rate fetch, daily zakat hawl reminder email.
5. **Zod schemas** — per form and API route.

---

## Build order (dependencies)

Build in this order regardless of calendar. Each step unblocks the next:

1. Infrastructure (Supabase project, Next.js app, Lovable scaffold, Vercel deploy, auth with guest mode, i18n scaffold, empty pages).
2. Balance sheet (CRUD for assets + liabilities, dashboard, diagnostics). **Foundational — everything else reads from it.**
3. Zakat (nisab from `prices`, calculation, hawl setup, history).
4. Family graph wizard (11-step UI writing to `family_members`). Build in parallel with step 5.
5. Meras algorithm (`lib/meras/` with full test coverage).
6. Meras UI integration (wizard → algorithm → results).
7. Investment options UI (listings, detail, admin enters catalog via Supabase dashboard).
8. Courses infrastructure (article storage, rendering, 5 launch articles scholar-reviewed).
9. Fin Advisor (embed Courses, retrieval, system prompt, chat UI, cost controls, scholar flagging).
10. Pre-launch scholar review sweep (sample outputs from Meras and Fin Advisor, all Courses, all investment screenings).
11. Beta with 20–50 users.
12. Public launch.

---

## Current state

<!-- Update this section as you go. Example format below. -->

**Phase:** Pre-build — specs complete, nothing written yet.

**Done:**
- Product definition finalized (v2)
- One-page PRDs for all 6 modules
- MVP architecture with Supabase schema and Meras algorithm spec

**In progress:**
- (nothing yet)

**Next up:**
- Set up Supabase project and Next.js scaffold via Lovable
- Apply schema from `docs/03-architecture.md` §3 to Supabase
- Implement auth with guest mode

---

## Style and behavior expectations for Claude Code

- **Read the docs first.** On the first turn of a session, confirm you've read `docs/01-product-definition.md`, `docs/02-prds.md`, and `docs/03-architecture.md`. If anything in them is ambiguous for the task at hand, ask before writing code.
- **Match the existing code style.** When editing files, match conventions already present in the repo.
- **TypeScript strict, no `any`.** If a type is genuinely unknown, use `unknown` and narrow.
- **Tests for pure functions.** Meras, Zakat, and balance sheet diagnostics are pure — write tests alongside the implementation.
- **Commits small and focused.** One concern per commit. Commit messages describe the why, not just the what.
- **When in doubt, ask.** Especially on anything touching religious calculations, user trust, or security.
