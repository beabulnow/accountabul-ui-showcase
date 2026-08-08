# GitHub Workflow — Verifiabul Property Verification Registry

**Canonical repository:** https://github.com/beabulnow/accountabul-ui-showcase
**Visibility:** public (current GitHub setting as of 2026-08-08)
**Default branch:** `main`
**Project:** Verifiabul Property Verification Registry

These are the repository operating instructions for this project. They apply to
Lovable, local development, and any collaborator with push access.

---

## 1. Authoritative database specification

`docs/DATABASE_SPEC.md` is the authoritative database specification. Any
disagreement between code, migrations, and that document is resolved by updating
the spec deliberately — not by silently drifting away from it.

## 2. Migration history is append-only

Preserve all applied Supabase migrations. Every schema change must be a **new,
reviewed migration**. Never rewrite, squash, edit, or delete published migration
history, even to "clean it up."

## 3. Never commit secrets or production data

The following must never enter the repository, in any branch, commit, fixture,
screenshot, or log:

- Supabase service-role keys or database passwords
- XRPL seeds, private keys, or signing material
- OAuth client secrets
- Real user records, property submissions, or any other production data

If something in this list is ever committed, treat it as a credential compromise:
rotate it first, then remove it from the codebase.

## 4. Keep environment files and local secrets ignored

`.env` and any local secret or credential files stay in `.gitignore`. Backend
configuration is injected at runtime and does not belong in version control.

## 5. Preserve the product boundary

This project is **property-record registration and verification**. It is not:

- legal title or a title transfer
- an ownership token
- an appraisal or valuation
- a government filing or public land-records submission

Product copy, docs, commit messages, and code identifiers must stay inside that
boundary. Use "record proof" or "registry receipt."

## 6. XRPL scope constraint

Future XRPL work must anchor **only deterministic hashes and public proof
metadata**. Users receive an in-app registry receipt — never a transferable
token. No personally identifying or submission content goes on-ledger.

## 7. Repository visibility requires approval

The current canonical repository is public. Do not change repository visibility
again without explicit founder approval.

## 8. Branching and review

`main` is the stable branch. Nontrivial work should use short-lived feature
branches and reviewed pull requests when Git sync is available. Keep branches
narrow and merge them promptly.

## 9. One canonical repository

Do not create, fork, or switch to a different GitHub repository for this
project. The repository named above is the single canonical home.

## 10. Sync status — two-way sync verified

Automatic two-way sync was verified on 2026-08-08. Lovable exported commit
`3c79b5c` to this repository, and Lovable then ingested GitHub-origin commit
`65dc98e` from `main`.

Before starting work, confirm the latest `main` commit on both sides. Do not
create or switch to another repository to work around an integration failure.

---

**Scope note:** this document is operational guidance only. It does not change
migrations, database tables, application behavior, project visibility, or
publishing status.
