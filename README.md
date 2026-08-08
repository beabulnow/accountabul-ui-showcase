# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Authentication

Accounts use email + password. Sign up, sign in and password reset all live at
`/auth`; the reset link lands on `/reset-password`. Email confirmation is on by
default, so a new account is not signed in until the confirmation link is
clicked — the UI says so explicitly.

Everything under `/dashboard`, `/register-property`, `/registrations/$id` and
`/registry-admin` sits behind the `_authenticated` route gate and, at the
database level, behind row-level security scoped to `auth.uid()`. Users can only
ever read or write their own registrations.

## Admin bootstrap

`/registry-admin` denies every account until a staff role exists for it. Staff
roles cannot be created from the client. See
[docs/ADMIN_BOOTSTRAP.md](docs/ADMIN_BOOTSTRAP.md) for the one-time server-side
SQL that promotes the first admin after they sign up.

## Docs

- [docs/UI_MIGRATION.md](docs/UI_MIGRATION.md) — routes, components, data model
  and the remaining XRPL record-proof work.
- [docs/ADMIN_BOOTSTRAP.md](docs/ADMIN_BOOTSTRAP.md) — first admin setup.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Lovable Cloud (Postgres, auth, RLS)
