# Access lockdown audit — 2026-08-18

Question for every check: can someone who should not have access read, write, or escalate?

## Results

| ID | Area | Verdict | Evidence |
| --- | --- | --- | --- |
| A1 | Auth entry points | PASS | Email/password + Google only; no `signInAnonymously`, no auto-confirm bypass. |
| A2 | OAuth redirect | PASS | `redirect_uri` is `window.location.origin` (same-origin, public route). |
| A3 | Hardcoded secrets | PASS | No service-role key, secret, or password literal in `src/`. |
| R1 | Route gates | PASS | Every private page lives under `_authenticated/` with the managed `ssr: false` gate; admin pages additionally check the staff role server-side. |
| R2 | Admin route by URL | PASS | `/registry-admin` renders only for a staff role resolved by `sync_staff_access`; all admin data reads are RLS-gated regardless of UI. |
| S1 | Public endpoints | PASS | `/lovable/email/auth/preview` requires the `LOVABLE_API_KEY` bearer; `/lovable/email/auth/webhook` verifies the signed webhook via the SDK; `/sitemap.xml` emits static public paths only. |
| S2 | Endpoint data exposure | PASS | No public endpoint returns user or registration data. |
| D1 | RLS enabled | PASS | All 11 public tables have RLS on with at least one policy; every policy targets `authenticated`. |
| D2 | Anonymous table privileges | FIXED | `anon` previously held INSERT/UPDATE/DELETE grants on 9 tables (blocked only by RLS). All `anon` privileges revoked plus default privileges. Anonymous reads now fail with `permission denied` instead of returning an empty set. |
| D3 | Over-broad authenticated grants | FIXED | Revoked write grants that no policy allowed: history is read-only, on-chain proofs and verification reports are read-only, staff-role rows are read-only, document rows cannot be updated, and DELETE was revoked everywhere it had no policy. |
| D4 | Cross-user reads | PASS | Live probe as a non-staff signed-in user returned only their own profile; another user's profile, registrations, documents, history, notes, and reports all returned empty. |
| D5 | Privilege escalation | PASS | Insert into `staff_roles` fails for anon and for a signed-in non-staff user; the allowlist trigger additionally restricts staff to one confirmed Google account. |
| D6 | Staff RPCs | PASS | `review_registration_status`, `publish_verification_report`, `set_verification_report_progress` all raise "registry staff role required" for a non-staff caller. |
| D7 | SECURITY DEFINER hygiene | PASS | Every routine pins `search_path`; none is executable by `anon` or `PUBLIC`. |
| D8 | Role storage | PASS | Roles live in `public.staff_roles`, never on `profiles`. |
| ST1 | Storage buckets | PASS | Both buckets are private; policies scope objects to `auth.uid()` folders, with staff read on registration documents. |

## Fixes applied this run

Migration: revoke unnecessary table privileges.

- Revoked all privileges on every `public` table from `anon`, and revoked future default privileges for `anon`.
- `registration_status_history`, `record_anchors`, `verification_reports`, `staff_roles`: `authenticated` reduced to read-only.
- `registration_documents`: `authenticated` reduced to select/insert/delete (no update).
- Revoked `DELETE` from `authenticated` on all remaining tables where no delete policy exists.

## Accepted risks

- Linter warning "Signed-In Users Can Execute SECURITY DEFINER Function" fires for `sync_staff_access`, `publish_verification_report`, and `set_verification_report_progress`. Each must be callable by a signed-in user by design and each authorises internally (`app_private.is_staff` / allowlist) before doing anything. Accepted; recorded in security memory.
- `/lovable/email/auth/preview` compares the API key with `!==` rather than a constant-time compare. Low risk (Lovable-internal endpoint, no data returned), noted for a future pass.

## Open question for the owner

None. Staff access is currently a single account (`jibreelm.dev@gmail.com`); adding a second admin requires an allowlist migration.
