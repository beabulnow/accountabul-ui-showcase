# Accountabul Property Registry — Database Reference and Roadmap

**Status:** Living technical reference

**Version:** 0.2

**Last updated:** 2026-08-08

**Audience:** Accountabul staff, database reviewers, and engineering contributors

**System of record:** Lovable Cloud / Supabase Postgres

## 1. Purpose

This document records what the Accountabul Property Verification Registry database currently stores, how records relate, who may access them, and which future blockchain data may belong on chain. Implemented claims map to committed migrations; proposed sections remain roadmap material until separately approved and built.

## 2. Product boundary

The product registers and reviews **property records**. It does not create or transfer legal title, tokenize property value, issue an investment, provide an appraisal, or represent government approval.

When Accountabul later uses the XRP Ledger, it will publish a compact cryptographic proof of an approved record. The user receives an in-app registry receipt, not an NFT or transferable property token. Private information and source documents must never be written to a public blockchain.

## 3. Status labels

- **Implemented:** Present in the active Lovable database.

- **Proposed:** Approved as a planning concept but not yet implemented.

- **Open decision:** Requires founder, policy, legal, privacy, or technical review before implementation.

- **Verification required:** A factual claim or outside data source must be independently confirmed.

## 4. Phase 1 — implemented tables

### 4.1 `profiles`

One application profile for each authenticated account.

| Column | Type | Required | Purpose |

|---|---|---:|---|

| `id` | UUID | Yes | Primary key; references `auth.users.id`; cascades on account deletion |

| `email` | Text | No | Authoritative email copied from Supabase Auth; users cannot edit it directly |

| `full_name` | Text | No | User's display name |

| `first_name` | Text | No | Confirmed account-holder first name; required for profile completion |

| `middle_name` | Text | No | Optional middle name |

| `last_name` | Text | No | Confirmed account-holder last name; required for profile completion |

| `date_of_birth` | Date | No | Private account-holder birth date; required for profile completion |

| `phone_e164` | Text | No | Private normalized phone number; required for profile completion |

| `phone_verified_at` | Timestamp with timezone | No | Reserved for a future phone-verification flow |

| `bio` | Text | No | Optional private introduction, up to 500 characters |

| `avatar_path` | Text | No | Owner-scoped path in the private `profile-avatars` Storage bucket |

| `profile_completed_at` | Timestamp with timezone | No | Server-derived profile-completion time |

| `privacy_accepted_at` | Timestamp with timezone | No | Server-written identity-information notice acceptance time |

| `privacy_policy_version` | Text | No | Accepted notice version |

| `created_at` | Timestamp with timezone | Yes | Account-profile creation time |

| `updated_at` | Timestamp with timezone | Yes | Last profile update time |

Rules:

- A database trigger creates the profile when a Supabase Auth user is created.

- Users may read their own profile and update only approved profile-input
  columns. They cannot write `email`, `id`, `full_name`, staff authorization,
  phone verification, or profile-completion timestamps.

- A trigger derives `full_name`, records notice acceptance, and sets or clears
  profile completion from the required fields.

- Profile completion records identity information supplied by the account
  holder. It must not be presented as independent KYC verification.

- Profile photos live in a private bucket under `{auth.uid()}/avatar`; owners
  manage only their own object and authorized staff have read-only access.

- Authorized staff may read profiles for registry administration.

- `email`, `id`, and staff authorization cannot be changed from the user interface.

### 4.2 `staff_roles`

The only source of staff authorization.

| Column | Type | Required | Purpose |

|---|---|---:|---|

| `id` | UUID | Yes | Primary key |

| `user_id` | UUID | Yes | References `auth.users.id` |

| `role` | Enum | Yes | `admin` or `reviewer` |

| `created_at` | Timestamp with timezone | Yes | Role-assignment time |

Rules:

- Unique constraint on `user_id + role`.

- Users cannot grant, change, or remove staff roles.

- Roles are assigned only through a controlled server-side administrative process.

- Do not authorize staff using user-editable metadata, profile fields, email domains, or URL routes.

- No person has a staff role until it is explicitly assigned and documented.

### 4.3 `property_registrations`

The main user-submitted property-record table for the first MVP.

| Column | Type | Required | Purpose |

|---|---|---:|---|

| `id` | UUID | Yes | Internal primary key |

| `user_id` | UUID | Yes | Submitter account; references `auth.users.id` |

| `receipt_code` | Text | Yes | Unique human-readable registry receipt, such as `ACB-2026-XXXXXXXX` |

| `status` | Enum | Yes | Authoritative workflow status |

| `submitter_full_name` | Text | Yes | Name supplied with this submission |

| `relationship` | Enum | Yes | `owner`, `authorized_representative`, `property_professional`, or `other` |

| `relationship_other` | Text | No | Explanation when relationship is `other` |

| `address_line1` | Text | Yes | Street address |

| `address_line2` | Text | No | Unit or secondary address information |

| `city` | Text | Yes | City |

| `state` | Text | Yes | State; MVP defaults to Missouri |

| `postal_code` | Text | Yes | Five-digit ZIP or ZIP+4 |

| `county` | Text | Yes | County or jurisdiction |

| `parcel_id` | Text | No | Parcel identifier supplied by the user |

| `property_type` | Enum | Yes | `single_family`, `multi_family`, `condo`, `townhouse`, `land`, `commercial`, `mixed_use`, or `other` |

| `public_source_notes` | Text | No | Assessor links, record references, or other reviewable public-source notes |

| `user_note` | Text | No | Message from submitter to reviewer |

| `affirm_accurate` | Boolean | Yes | Submitter affirmation of accuracy to the best of their knowledge |

| `affirm_authorized` | Boolean | Yes | Submitter affirmation that they are authorized to provide the information |

| `affirm_not_title` | Boolean | Yes | Submitter acknowledgement of the product boundary |

| `normalized_address` | Generated text | Yes | Lowercased, whitespace-normalized lookup value |

| `submitted_at` | Timestamp with timezone | No | First submission time |

| `created_at` | Timestamp with timezone | Yes | Record creation time |

| `updated_at` | Timestamp with timezone | Yes | Last record update time |

Authoritative status values:

1. `draft`

2. `submitted`

3. `under_review`

4. `needs_information`

5. `approved`

6. `anchoring`

7. `anchored`

8. `rejected`

Rules:

- Users may create only their own `draft` or `submitted` registrations.

- All three affirmations are required before a record may leave `draft`.

- Users may view only their own registrations.

- Users may edit only their own `draft` or `needs_information` records, and may save the result as `draft` or `submitted`.

- Staff may review authorized records and change workflow status.

- A record cannot become `anchored` unless a completed `record_anchors` row exists.

- Address alone must never be treated as conclusive property identity. Parcel IDs are meaningful only with jurisdiction context.

### 4.4 `registration_status_history`

Append-only receipt and workflow history.

| Column | Type | Required | Purpose |

|---|---|---:|---|

| `id` | UUID | Yes | Primary key |

| `registration_id` | UUID | Yes | References `property_registrations.id` |

| `from_status` | Status enum | No | Previous authoritative status |

| `to_status` | Status enum | Yes | New authoritative status |

| `changed_by` | UUID | No | Authenticated user or staff account responsible for the action |

| `user_visible_message` | Text | No | Staff message shown to the submitter |

| `is_user_visible` | Boolean | Yes | Whether the history event appears in the user's receipt |

| `created_at` | Timestamp with timezone | Yes | Event time |

Rules:

- The initial `draft` or `submitted` event is created by a database trigger from the authoritative registration row.

- Ordinary users cannot insert, modify, or fabricate history rows.

- Only authorized staff may add later history events, and `changed_by` must match the acting staff account.

- A displayed history label never overrides the authoritative status in `property_registrations`.

### 4.5 `staff_notes`

Private staff-only review notes.

| Column | Type | Required | Purpose |

|---|---|---:|---|

| `id` | UUID | Yes | Primary key |

| `registration_id` | UUID | Yes | References `property_registrations.id` |

| `author_id` | UUID | No | Staff account that wrote the note |

| `body` | Text | Yes | Internal note, up to 4,000 characters |

| `created_at` | Timestamp with timezone | Yes | Note creation time |

Rules:

- Staff notes are never shown to submitters or the public.

- Only authorized staff may read or insert them.

- The note author must match the authenticated staff account.

### 4.6 `record_anchors`

Server-written proof metadata for an approved registry record.

| Column | Type | Required | Purpose |

|---|---|---:|---|

| `id` | UUID | Yes | Primary key |

| `registration_id` | UUID | Yes | Unique reference to `property_registrations.id` |

| `canonical_payload_hash` | Text | No | Lowercase 64-character SHA-256 hash of the canonical record payload |

| `xrpl_network` | Text | No | `testnet`, `devnet`, or `mainnet` |

| `xrpl_tx_hash` | Text | No | Uppercase 64-character XRPL transaction hash |

| `validated_ledger_index` | Big integer | No | Ledger index after validated confirmation |

| `anchored_at` | Timestamp with timezone | No | Validated anchor time |

| `created_at` | Timestamp with timezone | Yes | Anchor-job creation time |

| `updated_at` | Timestamp with timezone | Yes | Last anchor-job update time |

Rules:

- Application users have read-only access to their own anchor proof.

- Staff may read anchor proofs for registry work.

- Only a trusted server-side publisher may insert or update anchor rows.

- No XRPL seed, private key, service-role key, personal information, address, deed, or document content may be stored in this table or frontend code.

- `anchored` means the transaction was found in a validated ledger and all required proof fields were stored. A submitted transaction alone is not enough.

## 5. Implemented relationships

```text

auth.users

├── 1:1 profiles

├── 1:many staff_roles

└── 1:many property_registrations

              ├── 1:many registration_status_history

              ├── 1:many staff_notes

              └── 1:0..1 record_anchors

```

All dependent application rows use foreign keys. Account-owned data is deleted when the owning Auth user is deleted only where the implemented foreign-key rule specifies cascading behavior. Material deletion and retention policies remain an open governance decision.

## 6. Access-control matrix

| Data/action | Signed-out visitor | Signed-in submitter | Reviewer | Admin | Trusted server |

|---|---:|---:|---:|---:|---:|

| Read public homepage | Yes | Yes | Yes | Yes | N/A |

| Read own profile | No | Yes | Yes | Yes | Yes |

| Read all profiles | No | No | Yes | Yes | Yes |

| Edit profile email or ID | No | No | No | No | Controlled Auth process only |

| Read own registrations | No | Yes | Yes | Yes | Yes |

| Read another user's registrations | No | No | Yes | Yes | Yes |

| Create own draft/submission | No | Yes | Yes | Yes | Yes |

| Change review status | No | No | Yes | Yes | Yes |

| Insert status history | No | No | Yes | Yes | Yes |

| Read/write staff notes | No | No | Yes | Yes | Yes |

| Assign staff roles | No | No | No | Controlled process | Yes |

| Write XRPL anchor proof | No | No | No | No from browser | Yes |

Every table in the exposed `public` schema must have Row Level Security enabled. Frontend possession of a publishable key is never sufficient authorization. Service-role or secret credentials must never be shipped to the browser.

## 7. Data classification

### Public or potentially public after policy approval

- Registry receipt code

- General property address and parcel reference when legally and contractually permitted

- Limited source references

- Verification status and dates

- Canonical payload hash

- XRPL transaction hash, network, and validated ledger index

### Account-private

- User identity and email

- User notes

- Draft registrations

- Relationship statements

- Status messages intended only for the submitter

### Staff-confidential

- Internal review notes

- Reviewer assignments

- Conflict analysis

- Fraud, abuse, or security flags

- Operational audit details

### Never publish on a public blockchain

- Names, email addresses, phone numbers, government identifiers, credentials, or tenant information

- Deeds, inspection files, photographs, contracts, or source documents

- Full addresses when policy calls for redaction

- Authentication tokens, API keys, service-role keys, wallet seeds, or signing secrets

## 8. Phase 2 — proposed evidence model

Do not add these tables merely because they appear in this document. Add them through reviewed migrations when the corresponding workflow is approved.

### `properties`

Canonical property identity separated from individual submissions: jurisdiction, jurisdiction-scoped parcel ID, normalized address, coordinates, legal-description hash, and active/merged/split status.

### `data_sources`

Source organization, system name, authority/scope, access method, license or terms, update cadence, reliability notes, and active status. Source authority must be independently verified.

### `source_records`

One retrieved or manually preserved source item: source ID, external record ID, retrieval time, permitted storage pointer, content hash, schema version, and privacy class.

### `property_assertions`

Field-level claims linking a property to a source record: field name, raw value, normalized value, effective date, state, confidence, and superseded-by reference.

Proposed field-level states:

- `source_confirmed`

- `multi_source_match`

- `conflict`

- `stale`

- `unverified`

These labels describe evidence state, not legal ownership or title status.

### `evidence_documents`

Document type, issuer, privacy class, private storage pointer, content hash, signature metadata, and retention status. Actual files belong in a private storage bucket with separate storage policies; the database stores metadata and a pointer.

### `property_events`

Permits, inspections, work orders, rehabilitation, maintenance, tax-status updates, transfer notices, corrections, and other reviewed events. Each event must identify its evidence and verification state.

### `reviews`

Assignment, conflict reason, decision, evidence considered, reviewer, timestamps, and user-visible outcome. Internal rationale must remain separate from public or user-visible messages.

### `correction_requests`

Submitter or public error reports, challenged fields, supporting evidence, workflow status, resolution, and links to the superseded and replacement record versions.

### `record_versions`

Immutable published snapshots with a schema version, canonical JSON payload, payload hash, prior-version link, correction reason, approval identity, and publication time.

### `anchor_jobs` and `anchor_attempts`

Operational queue and retry history for XRPL publishing. Store network, publisher account address, sequence/ticket reference, fee, submitted transaction hash, engine result, validated ledger, retry count, error category, and timestamps. Never store signing secrets.

### `audit_events`

Append-only security and administrative activity: actor, action, object type/ID, before/after summary or hashes, request correlation ID, and timestamp. Avoid duplicating sensitive record contents into the audit log.

## 9. XRPL record-proof contract

**Proposed; not implemented.**

For an approved record version:

1. Build canonical JSON server-side using a fixed schema version and deterministic field ordering.

2. Exclude private, staff-only, and prohibited fields.

3. Calculate a SHA-256 hash of the exact canonical bytes.

4. Submit a compact memo-bearing XRPL transaction from an Accountabul-controlled publisher account.

5. Accountabul pays the network fee; the user needs no wallet.

6. Wait until the transaction appears in a validated ledger.

7. Store the canonical hash, XRPL network, transaction hash, validated ledger index, and validation time.

8. Mark the registration `anchored` only after the proof record is complete.

9. Display the proof as a registry receipt. Do not call it legal title, an ownership token, or a property-backed asset.

The exact canonical JSON schema, memo format, transaction type, key-custody process, retry policy, and testnet-to-mainnet approval gate are open technical and security decisions.

## 10. Flare boundary

Flare remains a proposed later verification/workflow layer. No Flare tables, contracts, or dual-chain status should be added to the first MVP until the founder approves the exact use case and the team verifies network requirements independently.

If added later, Flare and XRPL must have explicit separate responsibilities. A single-chain proof must never be displayed as dual-chain confirmed.

## 11. Open decisions

- Who may serve as reviewer, administrator, database owner, security owner, and XRPL signing approver? No person is assigned until acceptance is documented.

- Which property fields may be made public?

- Which jurisdictions and source datasets may be used, under what terms, and with what refresh periods?

- What evidence is required for approval?

- What is the correction and appeal process?

- What are the retention and deletion rules for user submissions and evidence?

- Will the first blockchain pilot use XRPL testnet only, and what authorizes a mainnet move?

- Is Flare necessary for the MVP, or should it remain a later independent verification layer?
