# Accountabul UI — migration & Phase 1 registry notes

## Source reference

Visual baseline: https://accountabul-rebuilt.accountabul.chatgpt.site — calm,
evidence-first property discovery. Brand direction kept: deep teal-navy palette,
Instrument Serif display type with Work Sans body text, generous whitespace,
soft borders and low-contrast surfaces.

## Current scope

Phase 1 of the **Property Verification Registry** is live on top of the original
UI system: Lovable Cloud backend, email/password auth, a protected user area,
and a staff-only review workspace. There is no seeded or demo data anywhere.

## Routes

| Route | File | Access | Purpose |
| --- | --- | --- | --- |
| `/` | `src/routes/index.tsx` | public | Registry hero, how-it-works, "what this is / is not" |
| `/auth` | `src/routes/auth.tsx` | public | Sign in, create account, forgot password |
| `/reset-password` | `src/routes/reset-password.tsx` | public | Set a new password from a recovery link |
| `/dashboard` | `src/routes/_authenticated/dashboard.tsx` | signed in | The user's own registrations only |
| `/register-property` | `src/routes/_authenticated/register-property.tsx` | signed in | Submission form, save draft or submit |
| `/registrations/$id` | `src/routes/_authenticated/registrations.$id.tsx` | signed in, owner | Registry receipt, history, record-proof state |
| `/registry-admin` | `src/routes/_authenticated/registry-admin.tsx` | staff only | Review workspace (unlinked, `noindex`) |
| gate | `src/routes/_authenticated/route.tsx` | — | `ssr: false` session guard, redirects to `/auth` |
| root layout | `src/routes/__root.tsx` | — | Fonts, head metadata, header/footer, Query provider, toaster |

## Components and shared code

- `src/components/site-header.tsx` — brand mark plus session-aware nav
  (Sign in / Create account, or Dashboard / Register / Sign out).
- `src/components/site-footer.tsx` — brand blurb and registry disclaimer.
- `src/components/ui-kit.tsx` — `Section`, `SectionHeading`, `Card`, `EmptyState`.
- `src/components/status-chip.tsx` — themed chip for the eight registration statuses.
- `src/lib/registry.ts` — status list/labels/help copy, relationship and property
  type options, Zod `registrationSchema`, date formatters.
- `src/hooks/use-session.ts` — `useSession` and `useIsStaff`.
- `src/data/mock.ts` — editorial copy only (`trustPrinciples`); no records.

## Data model (Lovable Cloud)

- `profiles` — 1:1 with `auth.users`, populated by an auth trigger.
- `staff_roles` — `user_id` + `role` (`admin` | `reviewer`). Read-only to clients.
- `property_registrations` — the submission, `receipt_code`, status enum,
  normalized address fields, affirmation flags.
- `registration_status_history` — dated transitions, with an
  `is_user_visible` flag and an optional `user_visible_message`.
- `staff_notes` — internal only, never readable by submitters.
- `record_anchors` — reserved XRPL proof fields (canonical payload hash,
  network, tx hash, validated ledger index, anchored timestamp).

RLS is on for every table, policies are `TO authenticated` with `auth.uid()`
ownership predicates, updates use both `USING` and `WITH CHECK`, and staff
authorization resolves through `staff_roles` (never user metadata). A database
trigger refuses an `anchored` status without complete proof fields.

## Styling

- Tailwind CSS v4 via `src/styles.css` with oklch design tokens
  (`--background`, `--surface`, `--primary`, `--verified`, `--caution`, …).
- No hardcoded color utilities in components; everything goes through tokens.
- Fonts loaded with a `<link>` tag in the root route head.

## Remaining XRPL work (not built)

Signing and submission are deliberately absent. The intended later flow:

1. Server-side, canonicalize an approved registration into a deterministic payload.
2. Hash it and store the hash in `record_anchors.canonical_payload_hash`.
3. Publish only that hash from an Accountabul-paid XRPL publisher (server-side
   key material only — never in the client), moving the record to `anchoring`.
4. Wait for a validated ledger, then write `xrpl_tx_hash`,
   `validated_ledger_index` and `anchored_at` back and move to `anchored`.

No property NFT or transferable asset is ever issued; the in-app registry
receipt is the user-facing artifact.

## Manual setup still required

See `docs/ADMIN_BOOTSTRAP.md` — the first admin must be assigned by SQL after
signing up. Until then `/registry-admin` denies everyone.
