# Taqsimat — Product Definition & Roadmap (v2)

## Mission

A Muslim community that is financially educated, wealthier, and free from riba.

## What we're building

Taqsimat is a neutral financial platform for Muslims. We help users understand their money, fulfill their religious financial duties, and find the best halal options for growing their wealth — always transparently, always in the user's interest.

We are an aggregator and guidance layer, not a financial institution. We don't hold money. We list options, compare them, explain trade-offs, and redirect users to the partners who actually provide the products.

Long-term, Taqsimat will offer its own Islamic banking products — but always alongside competitors, ranked by merit, with full disclosure. Neutrality is the moat.

## The three acts

1. **Trust** — Super App ships as a pure aggregator. Zero custody, zero licensing burden.
2. **Intermediation** — Partner with Islamic banks and brokers to move money without holding it.
3. **Banking** — Full Islamic banking license. Deposits, financing, cards.

## Core object

The **balance sheet** is the core data object of the entire platform. Its purpose is to **identify the user's financial condition** — not just track assets, but diagnose a state.

Every other module is a lens on it:

- **Meros** — how this gets distributed at death
- **Zakotim** — what's owed from this annually
- **Halal investments** — where the next dollar goes
- **Fin Advisor** — what to do given this position
- **Will and testament** — how to direct this beyond what Meros mandates
- **Future bank** — what we can underwrite for this user

The balance sheet has two layers:

1. **Raw asset layer** — cash, gold, property, stocks, crypto, receivables, debts, with currency and jurisdiction.
2. **Diagnostic layer** — computed state on top: net worth, liquidity position, asset composition, zakat-eligibility status, debt-to-asset ratio, halal/haram composition.

Fin Advisor reads the diagnostic layer, not the raw layer. Get both layers right and every module becomes personalized. Get them wrong and the whole platform is generic.

## Mission → product mapping

| Mission | Delivered by |
|---|---|
| Financially educated | Courses + Fin Advisor |
| Wealthier | Balance sheet + Halal investments compare + eventual bank |
| Riba-free | Every listed product Shariah-screened; haram options invisible by default |
| Community | Zakotim, Meros, Will and testament |

## What we are not

- Not a bank (yet)
- Not a broker — we redirect, we don't execute
- Not a fatwa service — edge cases go to scholars
- Not a crypto exchange
- Not for businesses in the MVP
- Not neutral-in-name-only — competitors stay listed fairly even when we have our own bank

---

## Geographic strategy

**Uzbekistan first, architected for the world.**

Uzbekistan is the launch market. Product polish, local partnerships, UZS-first UX, Uzbek-language content — Uzbekistan is the visible priority.

But the architecture is country-agnostic from day 1:

- Multi-currency is native. No hardcoded UZS. Balance sheet stores amount + currency code. Zakotim computes nisab in whichever currency the user holds.
- Jurisdiction is a first-class field on every user. Meros rules, will-and-testament legal requirements, and halal screening standards vary by country.
- Courses content is structured for translation from day 1, even if launched in Uzbek only.
- Every country-dependent module has a "your jurisdiction" state. Nothing breaks for a non-Uzbek user — modules either work generically or say "coming soon for your region, join the waitlist."

The principle: we pull markets toward us by being excellent in Uzbekistan, not by pushing into every market at once.

---

## Shariah screening methodology

Two lenses, user-selectable:

- **Strict mode** — AAOIFI-certified instruments only. Conservative, scholar-defensible set (sukuk, certified Islamic funds). For users who want zero ambiguity.
- **Screened mode** — broader Shariah screening. Stocks passing standard sector and financial-ratio filters, halal crypto, wider set. For users comfortable with scholarly majority opinions.

Every listed investment shows which lens it passes. **Default is Screened mode** — more practical, what most Muslims actually invest in — with a prominent toggle to switch to Strict.

Screening criteria are published. Users can see *why* an instrument passes or fails.

---

## Scholar governance

We have scholars. This unblocks:

- **Courses** — content production can start immediately with review capacity in place
- **Fin Advisor** — ongoing audit of outputs, not just one-time system prompt approval
- **Halal screening** — edge cases have a clear escalation path
- **Meros** — modern edge cases (step-children, adopted children, non-Muslim heirs) have someone to rule on them

**To structure before content volume scales:** move from single-scholar to a scholar board (minimum two, ideally three+) so every published ruling can be cross-checked. Single-scholar dependency is a continuity and consistency risk.

---

## Roadmap

### Track A — Product (sequential)

Each step depends on the previous one. Ship in order.

1. **Balance sheet** — user adds or connects assets (cash, gold, property, stocks, crypto, receivables, debts). Multi-currency, jurisdiction-aware. Aggregator only, no custody. Includes diagnostic layer (net worth, liquidity, composition, zakat status). Foundation every later module reads from.
2. **Meros** — inheritance calculator. Reads the balance sheet. Applies Shariah inheritance rules, with per-jurisdiction handling for civil law overlays.
3. **Zakotim** — zakat calculator. Reads the balance sheet. Applies nisab and annual cycle logic in the user's currency.
4. **Halal investments compare** — list and rank Shariah-compliant options. Compare returns, risk, liquidity. Dual lens (Strict / Screened). Redirect to partner brokers. Screening methodology is public.
5. **Fin Advisor** — AI guidance grounded in the user's balance sheet diagnostic, zakat/inheritance situation, investments, jurisdiction, and the Courses content library. Scholar-audited.
6. **Will and testament** — digital wasiyat. Per-jurisdiction legal review required — slowest step to ship well.

### Track B — Courses (parallel, always-free)

- **Format:** articles + video lessons
- **Production:** in-house team with scholar board
- **Structure:** translation-ready from day 1
- **Price:** free forever
- **Role:** trust anchor, SEO/YouTube acquisition engine, grounding for Fin Advisor

### Wallet evolution (parallel, licensing-gated)

Not a product step — a licensing and partnership journey. Each stage unlocks when prerequisites are met.

| Stage | Custody | What's needed |
|---|---|---|
| Aggregator | None | Ships with Balance sheet |
| Connected | None (read-only) | Open banking APIs, partner integrations |
| Semi-custodial | Partner holds | EMI or payment license |
| Custodial | Taqsimat holds | Full Islamic banking license |

---

## Resolved

1. Geographic strategy — Uzbekistan first, architected for multi-country from day 1
2. Balance sheet purpose — identify the user's financial condition (raw layer + diagnostic layer)
3. Halal screening methodology — dual lens: Strict (AAOIFI) and Screened, user-selectable, Screened default
4. Scholar access — we have scholars; move to a scholar board before scaling content
5. Launch market — Uzbekistan, with soft landing for other countries via waitlist

## Open for next session

- Detailed balance sheet schema (asset types, field definitions, diagnostic computations)
- Jurisdiction matrix for Meros and Will-and-testament (which countries we support at launch, which are waitlisted)
- Partner landscape for halal investments in Uzbekistan — who do we redirect to?
- Banking endgame jurisdiction — still open (Uzbekistan for license, or elsewhere?)
- Fin Advisor scope boundaries — what it answers, what it refers to a human scholar
