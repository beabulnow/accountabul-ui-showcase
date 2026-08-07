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
| `/sitemap.xml` | `src/routes/sitemap[.]xml.ts` | Static routes plus one entry per property (currently none) |

Shared chrome (header + footer) lives in `src/routes/__root.tsx`.

## Components

- `src/components/site-header.tsx` — sticky nav with mobile disclosure menu.
- `src/components/site-footer.tsx` — link columns + interface notice.
- `src/components/ui-kit.tsx` — `Section`, `SectionHeading`, `Card`, `StatusPill`,
  `TrustScore`, `PropertyCard`, `ProfessionalCard`. These are the reusable presentation
  primitives; prefer extending them over one-off markup.
- shadcn primitives remain available under `src/components/ui/`.

## Data assumptions

`src/data/mock.ts` is the data contract only — it contains **no demo records**:

- `properties: Property[]` and `professionals: Professional[]` are exported as empty arrays.
- `workspaceStats`, `workspaceTasks`, `workspaceActivity` are exported as empty arrays.
- `trustPrinciples` and `trustChecks` remain populated: they are editorial page copy for the
  trust center, not records.
- The `Property`, `Professional` and `EvidenceItem` types are the contract every component
  reads from; keep them stable when wiring the database.

Because the collections are empty, every list surface renders an empty state via
`EmptyState` in `src/components/ui-kit.tsx`. `/properties/$slug` throws `notFound()` for any
slug, which is handled by the root `notFoundComponent`.

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
2. Replace each empty export with a TanStack Query `queryOptions` object; call
   `context.queryClient.ensureQueryData(...)` in route loaders and `useSuspenseQuery(...)`
   in components. Component markup should not need to change.
3. Move search/filter/sort from `useMemo` into query params + server-side filtering
   once the listing count grows.
4. Add auth by introducing an `_authenticated` layout route and moving `/dashboard`
   underneath it.
