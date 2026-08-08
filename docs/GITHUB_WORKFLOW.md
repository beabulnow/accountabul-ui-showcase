# GitHub Workflow — Accountabul Property Verification Registry

**Canonical repository:** https://github.com/JibreelMuhammad/accountabul-property-registry
**Visibility:** private
**Default branch:** `main`
**Project:** Accountabul Property Verification Registry

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

## 7. Repository stays private

Keep the repository private unless the founder explicitly approves a visibility
change.

## 8. Branching and review

`main` is the stable branch. Nontrivial work should use short-lived feature
branches and reviewed pull requests when Git sync is available. Keep branches
narrow and merge them promptly.

## 9. One canonical repository

Do not create, fork, or switch to a different GitHub repository for this
project. The repository named above is the single canonical home.

## 10. Sync status — automatic connection awaiting repair

The GitHub App automatic two-way connection is **currently awaiting repair**:
Lovable's installer returned a GitHub 404 when establishing the link.

Do not claim automatic sync is healthy until a real push from Lovable has been
verified as landing on GitHub. Until that verification happens, assume code must
be moved manually and confirm the state of both sides before relying on either.

---

**Scope note:** this document is operational guidance only. It does not change
migrations, database tables, application behavior, project visibility, or
publishing status.
