# Taqsimat — One-Page PRDs (all six modules)

**Purpose of this document.** Give the team a single whole-system view before we write the architecture and the detailed v1 spec. Each PRD is deliberately one page. Detailed PRDs come later, per module, when we're about to build.

**Shared concepts used throughout.** These appear across modules and become the data model.

- **Balance sheet** — the user's asset and liability ledger. Multi-currency, jurisdiction-aware, typed per asset category.
- **Family graph** — the user's family tree: spouse(s), parents, grandparents up two levels, children, grandchildren, siblings (blood/paternal/maternal), nieces/nephews, uncles, cousins. Nodes are people with alive/dead status and counts. Needed by Meras, referenced by Will and testament and Fin Advisor.
- **Jurisdiction** — country code on every user. Drives Meras civil-law overlays, Will and testament legal template, local halal screening standards, local partner availability.
- **Madhhab** — the user's chosen school of Islamic jurisprudence. Hanafi at launch; architecture supports adding Shafi'i, Maliki, Hanbali later.
- **Shariah engine** — a shared service that screens investments, flags riba, audits content. Dual-lens: Strict (AAOIFI) and Screened (sector + financial ratio filters). User-selectable, Screened default.
- **Scholar board** — a small group of certified scholars who review published content (Courses, Fin Advisor outputs) and rule on edge cases referred from any module.

---

## 1. Balance sheet

**Problem.** Muslims don't have one place that shows what they own — assets are scattered across bank accounts, gold, property, maybe stocks or crypto. Without a single view, zakat is guessed, inheritance is unknowable, and financial decisions are blind.

**What it does.** User enters (or eventually connects) their assets and liabilities. The app shows their total net worth, breaks it down by category, and diagnoses their financial condition — liquidity, composition, zakat-eligibility, debt ratio, halal/haram split.

**Core user actions.**
1. Add an asset (pick category, enter amount + currency + metadata)
2. Add a liability (debt to a person, religious debt, loan)
3. View net worth and breakdown on a dashboard
4. Edit or delete any entry
5. See the diagnostic layer: "you are above nisab," "60% of your wealth is in cash," "you have 3 months of liquidity"

**Data it owns.**
- Asset entries with type, amount, currency, acquisition date, valuation method, metadata (e.g., gold purity and weight, property type and jurisdiction, stock ticker and screening status)
- Liability entries with type (personal debt, religious debt, loan), amount, currency, counterparty
- Computed diagnostics (recomputed on every change)

**Asset categories (v1 target set).** Cash and cash equivalents, bank deposits, gold and silver (weight + value), real property (residence vs. investment), livestock, stocks and funds, sukuk, crypto, receivables (money owed to user), business equity, other tangible assets.

**What it hands to other modules.**
- Meras reads the asset list + liabilities to compute the distributable estate
- Zakotim reads zakatable assets to compute what's owed
- Halal investments reads current composition to suggest where the next dollar goes
- Fin Advisor reads the full diagnostic to ground its advice
- Future bank reads it as underwriting data

**Out of scope for this module.** Custody (we never hold assets). Automated property valuation. Live market pricing for stocks (v1: user enters current value). Tax calculations.

---

## 2. Meras

**Problem.** Shariah inheritance rules are mathematically precise but practically opaque. Most Muslims can't calculate their heirs' shares correctly. Mistakes lead to injustice and family disputes.

**What it does.** Given the user's balance sheet and family graph, Meras computes the distributable estate (after burial costs, debts, religious debts, and wasiyat up to 1/3) and distributes it to eligible heirs according to Shariah — fard (fixed) shares first, then asaba (residuary) heirs through the 11-step ladder, with Awl and Radd corrections applied when needed.

**Core user actions.**
1. Confirm (or update) balance sheet and family graph
2. Enter deductions: burial costs, debts to people, religious debts (unpaid zakat, kaffarat), wasiyat amount
3. Walk through the heir-enumeration flow: gender, spouse, children count, parents alive, grandparents alive, siblings by type (blood/paternal/maternal), and deeper collaterals if needed
4. View the computed distribution — each heir named with their share amount and share rationale
5. Export or share the result (PDF, link)

**Data it owns.**
- Meras calculation sessions (snapshot of balance sheet + family graph + deductions + results, timestamped)
- The Hanafi rule set as a pluggable engine (see "What it hands to other modules")

**Algorithm stages.**
- **Stage A — Deduction:** total estate → minus burial → minus debts to people → minus religious debts → net amount → minus wasiyat (capped 1/3) → final distributable
- **Stage B — Fard shares:** for each eligible heir, apply conditional rules from the Hanafi ruleset. Some heirs have fixed fractions (1/2, 1/3, 1/6, 1/4, 1/8, 2/3) conditional on what other heirs exist.
- **Stage C — Corrections:** if sum of shares > 1, apply Awl (scale down proportionally). If sum < 1 and no spouse, apply Radd (redistribute remainder to non-spouse fard heirs proportionally).
- **Stage D — Asaba:** any remainder goes to residuary heirs via the 11-step ladder: son → son's son → father → father's father → blood brother → paternal brother → blood brother's son → paternal brother's son → blood uncle → paternal uncle → blood uncle's son → paternal uncle's son.

**What it hands to other modules.**
- Will and testament reads Meras results to show "this is what's mandated by Shariah; here's where you can add bequests within the 1/3 wasiyat limit"
- Fin Advisor can reference Meras results when advising on estate planning

**Out of scope for this module.** Multi-madhhab at launch (Hanafi only; architecture supports adding others). Non-Muslim heirs, adopted children, step-children, lost heirs, posthumous children — flagged and referred to scholar board. Civil law jurisdictions that override Shariah distribution (informational only — we show both).

---

## 3. Zakotim

**Problem.** Muslims know they owe zakat but struggle to compute it correctly: what's zakatable, what's exempt, when the year resets, how to handle multiple currencies and gold by weight, whether business inventory counts, how to handle debts.

**What it does.** Reads the balance sheet, applies nisab threshold in the user's currency, identifies zakatable assets, computes 2.5% on the zakatable total, tracks the hawl (lunar year) from the user's declared start date, and generates reminders.

**Core user actions.**
1. Confirm balance sheet
2. Set or confirm the hawl start date (the user's "zakat anniversary")
3. View zakatable vs. non-zakatable breakdown with explanation per asset
4. See total zakat owed, in user's currency
5. Mark zakat as paid (logged to the liability side as "paid this year") or get redirected to a verified charity partner
6. Receive reminders: "your zakat year ends in 30 days"

**Data it owns.**
- Hawl anniversary per user
- Zakat calculation sessions (timestamped snapshots)
- Payment history (marked-paid entries, even if not collected by us)
- Nisab reference values (gold 87.48g, silver 612.36g — we compute both, use the lower per most schools)

**Zakat treatment per asset category.**
- Cash, bank deposits, gold, silver, receivables (if collectible): zakatable at full value
- Stocks: zakatable at market value (company's zakatable assets method is v2+)
- Sukuk: zakatable per scholar ruling
- Crypto: zakatable at market value (Screened mode); Strict mode refers to scholar
- Primary residence, personal use vehicle, personal jewelry (minor amounts): exempt
- Investment property: zakatable on rental income accumulated, not on property value
- Business equity / inventory: zakatable per the "business assets" method (inventory value + cash + receivables minus short-term liabilities)
- Liabilities: short-term debts owed by user are deducted; long-term are per scholar ruling

**What it hands to other modules.**
- Meras reads "unpaid zakat" as a religious debt to deduct before distribution
- Fin Advisor references zakat obligation when advising on cash flow and savings

**Out of scope for this module.** Fitrana / sadaqah al-fitr (different calculation, eventually added). Business zakat for registered companies (v2). Kaffarat (expiation payments) beyond recording them as religious debt.

---

## 4. Halal investments compare

**Problem.** Muslims want to invest but can't easily tell what's halal. Generic brokers don't screen for Shariah. Islamic investment products exist but are scattered, hard to compare, and vary in how strictly they comply.

**What it does.** A comparison and discovery layer — no custody, no brokerage. Lists Shariah-compliant investment options available to the user (based on their jurisdiction), ranks them by return, risk, liquidity, and screening strictness. Clicking through redirects to the partner broker or platform that actually offers the product.

**Core user actions.**
1. Browse by asset class (sukuk, Shariah-compliant stocks, halal funds/ETFs, real estate, commodities)
2. Filter by screening lens (Strict / Screened) and by jurisdiction
3. Compare options side-by-side: return, risk, minimum investment, fees, lock-up
4. See screening rationale per instrument — why it passes, what criteria
5. Redirect to partner with referral tracking

**Data it owns.**
- Listings catalog (instruments, providers, metadata, screening status, last-reviewed date)
- Screening methodology (published, versioned)
- Partner agreements and affiliate tracking
- User's saved watchlist and redirect history

**Screening methodology.**
- **Strict:** AAOIFI-certified instruments only (certified sukuk, certified Islamic funds, scholar-certified platforms)
- **Screened:** sector screen (no alcohol, gambling, conventional finance, adult content, pork, tobacco, weapons) + financial ratio screen (interest-bearing debt < 33% of market cap, interest income < 5% of revenue, cash + receivables not majority of assets)
- Both lenses shown on every listing. User picks default. Criteria are public.

**What it hands to other modules.**
- Balance sheet: when user redirects and actually invests, they can log it back as an asset. (v1 manual; v2 partner integration for auto-sync.)
- Fin Advisor references the comparison data when asked "where should I invest?"

**Out of scope for this module.** Executing trades. Holding securities. Providing financial advice (we show data; Fin Advisor gives advice, and only with disclaimers). Real-time price feeds (v1 daily snapshots).

---

## 5. Fin Advisor

**Problem.** Most Muslims don't have access to a financial advisor who understands both finance and Shariah. Existing AI assistants are either financially uninformed about Islamic finance or not trusted on Shariah rulings. Generic advisors don't know the user's actual balance sheet.

**What it does.** An AI assistant that answers financial questions, grounded in three things: (1) the user's balance sheet and diagnostic, (2) the Courses content library (scholar-reviewed), (3) a fixed set of policies about what it will and won't rule on. It personalizes advice, cites its sources, and refers edge cases to scholars.

**Core user actions.**
1. Ask a question in natural language ("should I pay off my mortgage early or invest?")
2. Receive an answer grounded in the user's balance sheet, with citations to Courses articles
3. See clearly when the answer is general guidance vs. a decision only a scholar should make
4. Follow up, save threads, return later

**Data it owns.**
- Conversation history per user
- Prompt templates and policies (versioned, scholar-reviewed)
- Embeddings over Courses content for retrieval
- Flagged/escalated conversations for scholar review

**Grounding and guardrails.**
- Reads the user's balance sheet diagnostic (not raw entries)
- Retrieves relevant Courses content and cites it
- Never rules on edge-case Shariah questions — refers to scholar board with a "submit to scholar" button
- Never recommends specific individual stocks/instruments — refers to Halal investments compare
- Never discusses haram financial instruments except to explain why they're haram
- Outputs are sampled and reviewed by scholar board on a rolling basis; flagged patterns lead to prompt updates

**What it hands to other modules.**
- Flags to scholar board for ruling on novel questions
- Referrals into Halal investments compare, Zakotim, Meras when user question crosses those domains

**Out of scope for this module.** Specific security recommendations (no "buy X"). Tax advice. Legal advice. Ruling on edge-case Shariah questions. Real-time market commentary. Investment execution.

---

## 6. Will and testament

**Problem.** Most Muslims die without a valid, Shariah-compliant wasiyat. Either they assume Shariah distribution alone is enough (it often isn't in civil-law jurisdictions that ignore Shariah without a will), or they use a generic will template that contradicts Islamic inheritance.

**What it does.** Helps the user draft a digital wasiyat that (a) declares Shariah distribution as the governing framework, (b) captures discretionary bequests within the 1/3 wasiyat limit, (c) names executors and guardians, (d) produces a document that is legally valid in the user's jurisdiction — reviewed per country by local legal counsel before the module is enabled for that country.

**Core user actions.**
1. See their Meras-computed distribution as the baseline
2. Add bequests within the 1/3 limit: charity (sadaqah jariyah), specific items to specific non-heirs, etc.
3. Name executor(s) and, if minor children exist, guardian(s)
4. Add funeral wishes and other non-binding instructions
5. Generate the jurisdiction-specific document, sign digitally (where legally valid) or print for physical signing
6. Store securely, share with executor

**Data it owns.**
- Will drafts and versions per user
- Jurisdiction-specific legal templates (reviewed by local counsel per country)
- Bequest entries (linked to balance sheet items where applicable)
- Executor and guardian designations
- Signed/final status flag, delivery record

**Jurisdictional model.** At launch, supported jurisdictions are the ones where legal review is complete. For users in unsupported jurisdictions, the module shows "we don't yet support legally-binding wills in your country; you can draft an intent document and we'll notify you when full support is ready. Join waitlist." Uzbekistan is day-1 target; others added as legal review completes.

**What it hands to other modules.** Meras reads wasiyat amount as a deduction in the inheritance calculation. Fin Advisor can answer questions about estate planning with reference to the user's wasiyat status.

**Out of scope for this module.** Probate execution. Real-time legal counsel (we refer to lawyers, we don't provide legal advice). Multi-jurisdictional wills (v2 — users with assets across countries). Trusts, waqf structures, living wills.

---

## Cross-cutting observations from writing all six in parallel

1. **The shared data model is clear.** Balance sheet + family graph + jurisdiction + madhhab are used by 4+ modules each. These are first-class entities in the architecture, not owned by any single module.

2. **Three modules are "pure function" modules** — Meras, Zakotim, and parts of Fin Advisor take inputs and return outputs deterministically, no side effects. Ideal for unit testing and Claude Code.

3. **Two modules are "content + comparison" modules** — Halal investments compare and Courses. Both depend on an editorial workflow (scholar review, partner onboarding) that has no analog in the computational modules.

4. **One module is a "legal workflow" module** — Will and testament. Its constraint isn't engineering difficulty; it's per-jurisdiction legal review. It can only ship for a country after a lawyer in that country has reviewed and signed off on the template. This is the slowest module by nature.

5. **Fin Advisor is the integration point** — it reads from every other module and routes questions into them. Building Fin Advisor last (per the roadmap) is correct; it needs the others to exist before it can ground anything.

6. **Courses is not in this PRD set** because it was decided separately as an always-free parallel track with its own team. The architecture doc will still need to account for content storage, retrieval, and embedding for Fin Advisor grounding.

---

## Open questions to resolve before architecture

1. **User authentication model at launch** — email+password, phone+OTP, social login, or passkey? Affects onboarding friction heavily.
2. **Currency conversion source** — which FX rate provider? Central Bank of Uzbekistan for official rates, or a market provider?
3. **Gold/silver price source** — for nisab calculations and gold valuation. Local market or international spot?
4. **Scholar review workflow** — how do edge cases actually get from the app to a scholar and back? Ticketing system, scheduled calls, async email?
5. **Partner onboarding process for Halal investments** — who qualifies, what's the due diligence, who signs off?
6. **Hosting jurisdiction** — where do user data and servers live? Affects data privacy law (Uzbekistan has specific requirements), latency, and compliance.
