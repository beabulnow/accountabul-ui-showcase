# Accountabul UI Hackathon — UI Migration Notes

## Source reference

- Visual/functional baseline: `https://accountabul-rebuilt.accountabul.chatgpt.site`
  (the live reference is behind a ChatGPT sign-in wall, so this rebuild follows the
  documented Accountabul brand direction rather than a pixel-scrape: calm,
  evidence-first property discovery, verified professionals, a public trust center,
  property detail pages with an evidence trail, and a workspace/dashboard).
- Tone: quiet, document-led, no persuasion language. Evidence gaps are shown, never hidden.

## Stack

TanStack Start v1 + React 19 + Vite + Tailwind v4 (CSS-first tokens in `src/styles.css`).
No backend, no database, no auth.

## Design system

All colors/typography live as tokens in `src/styles.css`:

- Ink: deep slate-teal (`--foreground`, `--primary`), paper surfaces (`--background`, `--surface`).
- Semantic evidence states: `--verified` (green), `--caution` (amber), `--destructive` (flagged).
- Typography: Instrument Serif (display) + Work Sans (body), loaded via `<link>` in `src/routes/__root.tsx`.
- Utilities: `.eyebrow`, `.surface-grid`; shadows `--shadow-soft`, `--shadow-lift`.

Never hardcode color utilities in components — extend the tokens instead.

## Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Landing: hero, evidence sample, how-it-works, featured properties, professionals, principles, CTA |
| `/properties` | `src/routes/properties.index.tsx` | Discovery grid with client-side search, type filter, trust-score filter, sort |
| `/properties/$slug` | `src/routes/properties.$slug.tsx` | Property detail: gallery image, overview, evidence trail, activity timeline, sticky facts/CTA panel, related professionals |
| `/professionals` | `src/routes/professionals.tsx` | Verified professional directory with role filter and per-person check list |
| `/trust` | `src/routes/trust.tsx` | Trust center: principles, trust-score bands, verification checks, FAQs |
| `/dashboard` | `src/routes/dashboard.tsx` | Workspace states: stats, tabs for Overview / Saved / Evidence gaps / Activity |
| `/sitemap.xml` | `src/routes/sitemap[.]xml.ts` | Generated from the same mock property list |

Shared chrome (header + footer) lives in `src/routes/__root.tsx`.

## Components

- `src/components/site-header.tsx` — sticky nav with mobile disclosure menu.
- `src/components/site-footer.tsx` — link columns + demo-data notice.
- `src/components/ui-kit.tsx` — `Section`, `SectionHeading`, `Card`, `StatusPill`,
  `TrustScore`, `PropertyCard`, `ProfessionalCard`. These are the reusable presentation
  primitives; prefer extending them over one-off markup.
- shadcn primitives remain available under `src/components/ui/`.

## Mock data assumptions

All demo data is in `src/data/mock.ts` — static, synchronous, typed:

- `Property` — 6 listings (Scotland), each with `trustScore` (0–100), `evidenceCount`,
  `evidence[]` (`verified | pending | flagged`, with `source` and `updated` date), and a
  short `timeline[]`.
- `Professional` — 6 people with `role`, `licence`, `verifiedSince`, `rating`, `specialties`,
  and a `checks[]` list mirroring the trust-center cadence.
- `trustPrinciples`, `trustChecks`, `workspaceStats`, `workspaceTasks`, `workspaceActivity`.
- Photography uses remote Unsplash URLs; swap for owned assets before any public launch.
- Dates, licence numbers, firms and people are fictional and illustrative only.

Filtering, sorting and tab state are all client-side (`useState`/`useMemo`) — no network calls.

## Out of scope (deliberately not built)

- No database tables, SQL migrations, schema or seeds.
- No RLS policies, auth schema, sign-in/sign-up, or session handling.
- No server functions, API routes (other than the static sitemap handler), or third-party integrations.
- No payments, messaging, file upload, or notification backends.
- The workspace is a visual state only; nothing persists across reloads.

## How to wire a database later

1. Keep the exported types in `src/data/mock.ts` as the contract; move them to
   `src/data/types.ts` when real fetching lands.
2. Replace each mock export with a TanStack Query `queryOptions` object; call
   `context.queryClient.ensureQueryData(...)` in route loaders and `useSuspenseQuery(...)`
   in components. Component markup should not need to change.
3. Move search/filter/sort from `useMemo` into query params + server-side filtering
   once the listing count grows.
4. Add auth by introducing an `_authenticated` layout route and moving `/dashboard`
   underneath it.
