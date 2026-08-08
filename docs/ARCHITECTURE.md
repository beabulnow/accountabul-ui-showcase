# Architecture — Accountabul Property Verification Registry

Canonical database contract: [docs/DATABASE_SPEC.md](DATABASE_SPEC.md).
Repository rules: [docs/GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md).

## Stack

- **TanStack Start v1** (React 19, Vite 7) — file-based routing under `src/routes`.
- **Tailwind CSS v4** — design tokens live in `src/styles.css` (`@theme`), never hardcoded colors.
- **Lovable Cloud (Supabase Postgres + Auth)** — accessed from the browser client at
  `src/integrations/supabase/client.ts`; row-level security is the authorization boundary.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | public | Registry landing page: what the registry is and is not. |
| `/auth` | public | Email + password and Google sign-in / account creation. |
| `/reset-password` | public | Password reset landing target. |
| `/_authenticated/dashboard` | signed in | The user's own registrations. |
| `/_authenticated/register-property` | signed in | Submission form with required affirmations. |
| `/_authenticated/registrations/$id` | owner or staff | Registry receipt, status history, record-proof state. |
| `/_authenticated/registry-admin` | staff only | Review queue, internal notes, status transitions. |

`src/routes/_authenticated/route.tsx` is the integration-managed gate (`ssr: false`); it checks
the persisted Supabase session and redirects to `/auth`. The gate is convenience only — every
read and write is independently enforced by RLS.

## Components and shared code

- `src/components/site-header.tsx` — responsive, session-aware navigation (staff see the
  registry-admin link). The compact mobile sizing must be preserved.
- `src/components/site-footer.tsx` — registry disclaimers.
- `src/components/ui-kit.tsx` — `Section`, `SectionHeading`, `Card`, `EmptyState`.
- `src/components/status-chip.tsx` — status token → chip styling.
- `src/components/ui/*` — shadcn primitives; retained even when currently unused.
- `src/lib/registry.ts` — status labels, option lists, Zod schemas, formatting helpers.
- `src/hooks/use-session.ts` — `useSession` and `useIsStaff`.

## Authorization model

- Roles live in `public.staff_roles` and are only assignable server-side
  (see [docs/ADMIN_BOOTSTRAP.md](ADMIN_BOOTSTRAP.md)).
- `app_private.is_staff(uuid)` is a private `SECURITY DEFINER` helper; it is not exposed to
  clients.
- Owners may read and edit only their own draft / needs-information registrations.
- Generated and identity fields (`receipt_code`, `user_id`, `normalized_address`, timestamps)
  are not client-updatable: table-wide `UPDATE` is revoked and only submission fields plus
  `status` carry a column grant.

## Status transitions

Staff never update `property_registrations.status` directly from the client. They call:

```ts
supabase.rpc("review_registration_status", {
  _registration_id,
  _to_status,
  _user_visible_message,
});
```

`public.review_registration_status` is `SECURITY INVOKER`, verifies
`app_private.is_staff(auth.uid())`, locks the row `FOR UPDATE`, updates the status and inserts
the matching `registration_status_history` row inside one transaction. Execute is revoked from
`PUBLIC` and `anon`, granted to `authenticated`. Authorization still resolves through RLS
because the function runs as the caller.

## Record proof (XRPL) boundary

`record_anchors` stores proof metadata only. `enforce_anchor_proof()` refuses to let a
registration reach `anchored` unless a matching anchor row has a canonical payload hash,
network, transaction hash, validated ledger index and anchored timestamp.

Out of scope in this phase and not to be added without explicit approval: XRPL signing keys or
seeds in the app, tokens/NFTs, property-value tokenization, title or legal-ownership claims,
and any new Phase 2 evidence tables.

## Environment

Runtime configuration is injected by Lovable Cloud. `.env` is environment-local and must not be
committed; `.env.example` documents the required variable names. No service-role key, database
password or signing secret belongs in this repository.
