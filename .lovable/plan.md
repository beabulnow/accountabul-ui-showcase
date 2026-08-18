# Verifiabul ID — one profile across the ecosystem

Goal: a user signs up once, and that same identity + basic profile works across every Verifiabul-family app (Lovable-built and external), with a consent screen that lets them pick which apps may receive their data.

## How it works

Verifiabul becomes the identity hub. Other apps don't keep their own separate signup — they send the user here to sign in, then receive back only the fields the user consented to share.

```text
  Other app  --sign in-->  Verifiabul ID  --consent screen-->  back to app
                                 |                              (name, email,
                          one shared profile                     phone, avatar)
```

Each partner app still keeps its own local user record; it's linked to the shared Verifiabul ID, so records stay separate but the person is the same everywhere.

## The consent experience

First time a user signs into any ecosystem app:

1. Welcome panel: "Welcome to the Verifiabul ecosystem" + short explanation that we share a small set of profile data across our own apps.
2. Exactly what's shared, listed plainly: profile photo, first name, last name, phone number, email address. Copy notes more fields may be added later, with notice.
3. Checkbox list of ecosystem apps (Verifiabul Registry, plus any others we register). User ticks the apps they want their profile shared with.
4. Confirm → returns to the app they came from.

They can revisit consent any time from their profile page: see which apps have access, tick/untick, revoke. Every change is logged.

## What we build in this project (Phase A)

- **Identity tables**: `ecosystem_apps` (registered apps, slug, name, description, redirect URLs), `app_consents` (user × app, granted/revoked, scopes, timestamps), `consent_events` (audit trail). RLS: users read/write only their own consent rows; app registry readable by signed-in users; grants scoped so nothing is client-writable that shouldn't be.
- **Shared profile view**: a narrow, read-only projection of `profiles` exposing only avatar, first name, last name, phone, email — never registry data, never verification records.
- **Consent screen**: new route `/ecosystem-consent` matching the current visual system (sticky heading rail, cards, the existing checkbox/affirmation styling from the wizard). Shown once after first sign-in, before the dashboard; reachable later from `/profile`.
- **Profile section**: "Connected apps" card listing each app, its access state, and a revoke control.

## What we build for other apps (Phase B)

- **Sign-in handoff**: a `/connect` route that another app links to with its app slug and return URL. Verifiabul authenticates (existing email + Google auth), runs the consent screen if needed, then returns the user with a short-lived one-time code.
- **Profile endpoint**: a public API route `/api/public/identity/profile` that exchanges that one-time code for the consented profile fields. Only fields the user approved, only for apps the user ticked, only from a registered app using its own server-side key. Nothing sensitive is ever put in a URL.
- **Integration doc**: `docs/ECOSYSTEM_SSO.md` with the exact steps for any future app — Lovable or external — to plug in (register app, link format, code exchange, sample request/response).

## Technical notes

- Auth itself stays on the existing Lovable Cloud account store (email + password and Google). We are not building a second password system; other apps delegate to this one.
- The handoff is a standard authorization-code pattern: code issued on redirect, exchanged server-to-server for profile data, single use, short expiry, bound to the requesting app.
- Each registered app gets a server-side client secret stored as a project secret; app-to-app calls are verified against it. Browser code never sees it.
- Consent is enforced at the data layer: the profile endpoint reads through consent, so an app with no active grant gets nothing even if it holds a valid code.
- Existing routes, wizard, registry admin, and security posture are untouched.

## Suggested order

1. Phase A — tables, consent screen, connected-apps management inside this app.
2. Phase B — `/connect` handoff, profile exchange endpoint, integration doc.
3. Onboard the second app against the doc and verify end to end.
