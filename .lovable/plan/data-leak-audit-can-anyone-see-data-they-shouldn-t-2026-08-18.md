# Data-leak audit: can anyone see data they shouldn't?

A read-only security pass over the whole app, followed by fixes for anything that fails. No feature work.

## What gets checked

**1. Who can read each table**
Every table (profiles, property_registrations, registration_documents, registration_status_history, registration_corrections, staff_notes, staff_roles, record_anchors, verification_reports/checks/sources) is checked for: row-level security on, explicit access grants, and at least one policy. Special attention to whether a signed-out visitor or a signed-in stranger can read another person's registrations, documents, phone number, date of birth, or the internal staff notes.

**2. Who can write**
Confirm nobody can create or edit a row owned by someone else, and that status changes, verification outcomes, and anchor proofs can only be made by registry staff through the guarded database routines.

**3. Admin lockdown**
Re-verify that only your Google account can obtain a staff role, that the allowlist cannot be extended from the browser, and that the admin screens cannot be reached by typing the URL.

**4. Uploaded files**
Both storage buckets (property documents, profile avatars) are private. Verify the storage access rules actually scope each file to its owner plus staff, so a signed-in stranger cannot guess a path or mint a signed link for someone else's deed or photo ID.

**5. Public endpoints**
The two email routes under `/lovable/email/auth/*` and the sitemap are reachable without signing in. Verify they authenticate their caller, reject unsigned requests, and never echo user data.

**6. Live probe**
Run real queries against the database as an anonymous visitor and as a signed-in non-staff user, and try to read another account's rows and files. Record what actually comes back rather than trusting the policy text.

**7. Built-in scans**
Run the database linter and the platform security scan and triage every result.

## Fixes

Anything that fails is fixed in the same run — tightened policies, removed grants, corrected storage rules. Nothing is loosened to make a check pass. Anything intentionally permissive is documented as an accepted risk in security memory rather than silently left open.

## Output

`docs/security/2026-08-18-access-lockdown.md`: a table of every check with pass/fail and one line of evidence, the fixes applied, accepted risks, and anything that needs a decision from you. Ends with a typecheck run.

## Technical notes

- Policy/grant inspection via `pg_policies` and `information_schema.role_table_grants`; storage rules via `storage.objects` policies.
- Anonymous probe uses the publishable key with no session; the non-staff probe uses a minted session for an existing non-admin auth user.
- `SECURITY DEFINER` routines (`sync_staff_access`, `publish_verification_report`, `review_registration_status`, `set_verification_report_progress`, `apply_correction_response`, `guard_correction_response`) are checked for pinned `search_path` and correctly scoped EXECUTE.
- The app has no server functions today — all reads go through the browser client, so RLS is the only boundary and is weighted accordingly.
