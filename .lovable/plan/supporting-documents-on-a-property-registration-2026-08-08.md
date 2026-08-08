# Supporting documents on a property registration

Add a dedicated upload area to `/register-property` with one labelled slot per document type, so evidence arrives pre-sorted instead of as a pile of files. Each slot accepts several files, and files stay private to the submitter and registry staff.

## The eight document slots

The most widely accepted proofs that a property belongs to someone:

1. **Deed or title document** — the primary ownership instrument
2. **Property tax statement or assessor record** — shows who the jurisdiction bills
3. **Mortgage, loan or payoff statement** — lender's record of the owner
4. **Homeowners insurance declaration page** — insurer's record of the owner
5. **Utility bill or occupancy proof** — ties a person to the address
6. **Government-issued photo ID** — identity of the submitter
7. **Authority document** — power of attorney, authorization letter, trust or LLC formation, probate or estate letters (for anyone submitting on an owner's behalf)
8. **Other supporting document** — survey, closing statement, HOA letter, anything that doesn't fit above

Each slot has its own short helper line explaining what a reviewer is looking for. All slots are optional individually, but **at least one document must be attached before a record can be submitted for review**. Drafts can be saved with nothing attached.

## Accepted files

PDF, JPG, PNG and HEIC, up to 15 MB each, up to 8 files per slot. Anything else is rejected in the browser with a clear message before upload starts.

## What the user sees

On `/register-property`, a new "Supporting documents" card sits between "Supporting context" and "Affirmations":

```text
Supporting documents
Attach what you have. At least one document is required to submit.

  Deed or title document              [ Add files ]
  The recorded instrument naming the owner.
    deed-page-1.pdf      1.2 MB   [remove]
    deed-page-2.pdf      0.9 MB   [remove]

  Property tax statement              [ Add files ]
  ...
```

Files chosen before the record exists are held in the browser, then uploaded once the record is created (on either "Save draft" or "Submit for review"), with a progress state on the button.

On `/registrations/$id`, the owner sees the same slots grouped by type, can open any file, and can add or remove files while the record is a draft or in "needs information". Once submitted, the list becomes read-only until a reviewer asks for more.

On `/registry-admin`, reviewers see every attached document grouped by slot with the filename, size and upload date, and can open each one.

## Technical notes

**Storage** — a new private bucket `registration-documents`. Object path is `{user_id}/{registration_id}/{document_type}/{uuid}-{filename}`, so storage policies can authorize on the leading user folder and staff read the whole bucket. Files are fetched through short-lived signed URLs; nothing is public.

**Database** — a new `public.registration_documents` table:

- `registration_id` (references `property_registrations`), `user_id`, `document_type` (new `registration_document_type` enum with the eight values above), `storage_path`, `file_name`, `mime_type`, `byte_size`, `uploaded_at`
- GRANTs for `authenticated` and `service_role`, RLS enabled
- Owners may read and insert rows for their own registrations; owners may delete only while the parent record is `draft` or `needs_information`; staff may read all rows. No client updates.
- Matching `storage.objects` policies on the bucket mirroring the same rules.

**Code** — document-type labels, helper text, accepted MIME list and size limits live in a new `src/lib/documents.ts` alongside the existing `src/lib/registry.ts`. A reusable `DocumentSlots` component handles pick/validate/list/remove and is shared by the register form and the detail page. Upload runs after the registration insert so every file has a real `registration_id`; a failed upload surfaces a per-file error and leaves the saved record intact rather than rolling it back.

**Validation** — the "at least one document" rule is enforced in the submit path in the client, and reinforced by a check when a reviewer moves a record out of `submitted`. Registration schema itself is unchanged.

## Out of scope

No OCR, no automatic document classification, no virus scanning, no anchoring of document hashes. Documents are evidence for human review only. do not change or introduce code that changes any files out side of this

&nbsp;