# Accountabul UI Hackathon — migration notes

## Source reference

Visual baseline: https://accountabul-rebuilt.accountabul.chatgpt.site — calm,
evidence-first property discovery. Brand direction kept: deep teal-navy palette,
Instrument Serif display type with Work Sans body text, generous whitespace,
soft borders and low-contrast surfaces.

## Current scope

The project has been reduced to a **single homepage** as the hackathon starting
point. All other routes (properties list, property detail, professionals
directory, trust center, workspace/dashboard, sitemap handler) were removed
along with their components and mock records.

## Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/routes/index.tsx` | Landing page: hero, "how it works", principles |
| root layout | `src/routes/__root.tsx` | Fonts, head metadata, header/footer shell, TanStack Query provider |

## Components

- `src/components/site-header.tsx` — brand mark + preview label (no nav, since
  there is only one page).
- `src/components/site-footer.tsx` — brand blurb and preview disclaimer.
- `src/components/ui-kit.tsx` — shared primitives: `Section`, `SectionHeading`,
  `Card`, `EmptyState`.
- `src/components/ui/*` — shadcn primitives, available but mostly unused.

## Data assumptions

- `src/data/mock.ts` contains **editorial copy only** (`trustPrinciples`).
  There are no property or professional records anywhere in the codebase.
- The hero stats and the evidence panel render placeholders / an `EmptyState`
  until real data is wired.

## Styling

- Tailwind CSS v4 via `src/styles.css` with oklch design tokens
  (`--background`, `--surface`, `--primary`, `--verified`, `--caution`, …).
- No hardcoded color utilities in components; everything goes through tokens.
- Fonts loaded with a `<link>` tag in the root route head.

## Out of scope (deliberately not built)

- No database tables, SQL migrations, schema or RLS policies.
- No auth, no Supabase / Lovable Cloud integration.
- No server functions or API routes.

## Adding a backend later

1. Enable Lovable Cloud and create the tables for properties, evidence items
   and professionals.
2. Add new route files under `src/routes/` for the pages you want back
   (`properties.index.tsx`, `properties.$slug.tsx`, `professionals.tsx`,
   `trust.tsx`, `dashboard.tsx`).
3. Fetch in route loaders via `context.queryClient.ensureQueryData(...)` and
   read with `useSuspenseQuery` in components.
4. Restore navigation links in `site-header.tsx` / `site-footer.tsx` as the
   routes come back.
