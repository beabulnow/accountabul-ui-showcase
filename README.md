# Accountabul Property Verification Registry

A property **record** registration and verification workflow. Users submit a property record,
registry staff review it, and an approved record can later receive a "record proof" (registry
receipt) anchored as a deterministic hash. This is not a title service, not an appraisal, not a
legal filing, and not a token.

Canonical repository: `JibreelMuhammad/accountabul-property-registry` (private, `main`).

## Development

Node.js and npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
git clone <this-repository-url>
cd <repository-name>
npm ci
npm run dev
```

Copy `.env.example` to `.env` and fill in the values for your own backend. `.env` is ignored by
git and must never be committed.

## Authentication

Email + password and Google sign-in, all at `/auth`; password reset lands on `/reset-password`.
Email confirmation is on, so a new account is not signed in until the link is clicked — the UI
says so explicitly.

`/dashboard`, `/register-property`, `/registrations/$id` and `/registry-admin` sit behind the
`_authenticated` route gate and, authoritatively, behind row-level security scoped to
`auth.uid()`.

## Admin bootstrap

`/registry-admin` denies every account until a staff role exists for it. Staff roles cannot be
created from the client. See [docs/ADMIN_BOOTSTRAP.md](docs/ADMIN_BOOTSTRAP.md) for the one-time
server-side SQL that promotes the first admin.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — routes, components, authorization, status flow.
- [docs/DATABASE_SPEC.md](docs/DATABASE_SPEC.md) — authoritative database specification.
- [docs/ADMIN_BOOTSTRAP.md](docs/ADMIN_BOOTSTRAP.md) — first admin setup.
- [docs/GITHUB_WORKFLOW.md](docs/GITHUB_WORKFLOW.md) — repository operating rules.

## Database changes

Migrations are append-only. Never edit an applied migration in `supabase/migrations/`; add a new
one. `docs/DATABASE_SPEC.md` is the source of truth for schema and access control.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Lovable Cloud (Postgres, auth, RLS)
