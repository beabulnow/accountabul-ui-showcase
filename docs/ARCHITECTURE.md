# Verifiabul Property Registry — Current Architecture

## Product boundary

The application registers and reviews property records. It does not create or transfer legal title, tokenize property value, issue an investment, provide an appraisal, or represent government approval.

## Application routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Product explanation and boundary |
| `/auth` | Public | Sign in, account creation, Google authentication, and password recovery request |
| `/reset-password` | Public | Set a password from a recovery link |
| `/dashboard` | Signed in | Current user's registrations |
| `/register-property` | Signed in | Save a draft or submit a property record |
| `/registrations/$id` | Owner or staff through RLS | Registry receipt, history, and record-proof state |
| `/registry-admin` | Staff only | Unlinked, noindex review workspace |

The `_authenticated` route gate handles session redirects. Database row-level security remains the authoritative data boundary.

## Shared application code

- `src/components/site-header.tsx` and `site-footer.tsx` provide the application shell.
- `src/components/ui-kit.tsx` contains shared layout primitives.
- `src/components/status-chip.tsx` renders the eight registration states.
- `src/lib/registry.ts` contains labels, validation, and formatting.
- `src/hooks/use-session.ts` exposes session and staff-role state.
- `src/data/mock.ts` contains editorial copy only; it does not contain property or user records.

## Database

Lovable Cloud / Supabase Postgres stores `profiles`, `staff_roles`, `property_registrations`, `registration_status_history`, `staff_notes`, and `record_anchors`. Every public table uses RLS. Staff authorization comes only from `staff_roles`; users cannot assign themselves a role.

Generated ownership, receipt, and timestamp fields are server-controlled. Staff status changes use one database function so the authoritative status and its history entry commit together.

The detailed schema and proposed evidence model are in [DATABASE_SPEC.md](DATABASE_SPEC.md).

## XRPL boundary

XRPL signing and submission are not implemented. The reserved proof fields hold a deterministic payload hash, network, validated transaction hash, ledger index, and anchor time. Signing material must remain server-side, Verifiabul pays the fee, and the user receives an in-app registry receipt rather than a wallet, NFT, or transferable token.

## Manual administration

The first staff role still requires the controlled server-side process in [ADMIN_BOOTSTRAP.md](ADMIN_BOOTSTRAP.md). No account is staff until that role is explicitly assigned.
