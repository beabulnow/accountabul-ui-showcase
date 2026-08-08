# Verifiabul Property Verification Registry

A private, early-stage registry for submitting property records, reviewing them with authorized staff, and later publishing a compact record proof to the XRP Ledger. A registry receipt is not a deed, legal title, appraisal, ownership token, or government filing.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone https://github.com/JibreelMuhammad/accountabul-property-registry.git
cd accountabul-property-registry
cp .env.example .env
npm i
npm run dev
```

Use `npm ci` for repeatable validation from the committed lockfile. The production build is `npm run build`; static checks are `npm run lint`.

## Authentication

Accounts use Google or email + password. Sign up, sign in and password reset all live at
`/auth`; the reset link lands on `/reset-password`. Email confirmation is on by
default, so a new account is not signed in until the confirmation link is
clicked — the UI says so explicitly.

After either Google or email/password sign-in, accounts with incomplete identity
information are sent to `/complete-profile`. The one-time onboarding collects
the account holder's name, date of birth, phone, optional bio and optional
private profile photo. Returning users can maintain this information at
`/profile`. Profile completion is not represented as independent KYC
verification.

Everything under `/dashboard`, `/profile`, `/register-property`,
`/registrations/$id` and `/registry-admin` sits behind the `_authenticated`
route gate and, at the database level, behind row-level security scoped to
`auth.uid()`. Incomplete profiles may only access `/complete-profile` and
`/profile`. Users can only ever read or write their own profiles, avatars and
registrations.

## Admin bootstrap

`/registry-admin` denies every account until a staff role exists for it. Staff
roles cannot be created from the client. See
[docs/ADMIN_BOOTSTRAP.md](docs/ADMIN_BOOTSTRAP.md) for the one-time server-side
SQL that promotes the first admin after they sign up.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — current routes, components, data model, and XRPL boundary.
- [docs/DATABASE_SPEC.md](docs/DATABASE_SPEC.md) — implemented database reference and proposed future model.
- [docs/ADMIN_BOOTSTRAP.md](docs/ADMIN_BOOTSTRAP.md) — first admin setup.
- [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md) — repository and Lovable synchronization rules.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Lovable Cloud (Postgres, auth, RLS)
