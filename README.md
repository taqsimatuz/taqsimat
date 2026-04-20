# Taqsimat — Claude Code Bundle

This bundle contains everything Claude Code needs to understand the Taqsimat project.

## What's inside

```
CLAUDE.md                      # Auto-loaded by Claude Code every session
docs/
  01-product-definition.md     # Mission, scope, what we are and aren't building
  02-prds.md                   # One-page PRDs for all 6 modules
  03-architecture.md           # Full MVP architecture, schema, algorithm spec
README.md                      # This file
```

## How to use

1. **Get your Lovable repo.** After Lovable generates the initial scaffold, clone the repo to your local machine.

2. **Drop this bundle into the repo root.** The `CLAUDE.md` file goes at the repo root. The `docs/` folder goes at the repo root too.

   ```
   your-repo/
     CLAUDE.md          ← from this bundle
     docs/              ← from this bundle
       01-product-definition.md
       02-prds.md
       03-architecture.md
     app/               ← your Next.js code from Lovable
     package.json
     ...
   ```

3. **Run Claude Code in the repo.** Open a terminal in the repo root and run `claude`. Claude Code will automatically read `CLAUDE.md` at the start of every session, and `CLAUDE.md` tells Claude Code to read the three docs.

4. **First prompt suggestion:**

   > "Read CLAUDE.md and all three files in docs/. Confirm you understand the project. Then let's implement `lib/meras/` per architecture section 4.3, with full test coverage using the canonical cases listed in the spec."

## Keeping it up to date

- Edit the docs in `docs/` as the product evolves. Claude Code will pick up changes on the next session.
- Update the "Current state" section in `CLAUDE.md` as you ship milestones.
- If you add new specs (e.g., `docs/04-courses-content-strategy.md`), add a reference to them in the "Read these documents" section of `CLAUDE.md`.

## Notes

- `CLAUDE.md` is a convention Claude Code looks for. No config needed.
- If you use a different AI coding tool, the same files work — just tell the tool to read them at the start of each session.
